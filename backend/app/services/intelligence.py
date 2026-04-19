import json
import re
import asyncio
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

async def safe_execute(fn, context: str = "operation"):
    try:
        return await fn()
    except Exception as e:
        logger.error(f"RESILIENCY_FAILURE: {context} failed: {e}", extra={"context": context, "error": str(e)})
        return None

class JobIntelligenceService:
    @classmethod
    async def analyze_job(cls, jd_text: str, profile_data: Dict[str, Any], retries: int = 2) -> Dict[str, Any]:
        """
        Performs Phase 4 semantic intelligence with retry logic and safe execution.
        """
        if not settings.GOOGLE_AI_API_KEY:
            logger.error("AI_CONFIG_ERROR: GOOGLE_AI_API_KEY is missing.")
            return cls._fallback_response("Search/AI configuration missing.")

        prompt = cls._build_prompt(jd_text, profile_data)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GOOGLE_AI_API_KEY}"
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        for attempt in range(retries + 1):
            try:
                logger.info(f"AI_REQUEST_INITIATED: Attempt {attempt + 1}", extra={"user_id": profile_data.get("personal", {}).get("fullName")})
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(url, json=payload)
                    
                    if response.status_code != 200:
                        logger.warning(f"AI_HTTP_ERROR: Status {response.status_code} on attempt {attempt + 1}")
                        if attempt == retries:
                            return cls._fallback_response(f"AI Service Error (HTTP {response.status_code})")
                        continue

                    raw_data = response.json()
                    content = raw_data['candidates'][0]['content']['parts'][0]['text']
                    
                    # Robust JSON Extraction
                    try:
                        json_match = re.search(r'\{.*\}', content, re.DOTALL)
                        parsed = json.loads(json_match.group()) if json_match else json.loads(content)
                        logger.info("AI_PARSE_SUCCESS", extra={"fit_score": parsed.get("analysis", {}).get("fit_score")})
                        return parsed
                    except Exception as je:
                        logger.error(f"AI_JSON_PARSE_ERROR: {je}")
                        if attempt == retries:
                            return cls._fallback_response("Final attempt: AI returned malformed data.")
                        continue

            except (httpx.TimeoutException, httpx.RequestError) as ne:
                logger.warning(f"AI_NETWORK_ISSUE: {ne} on attempt {attempt + 1}")
                if attempt == retries:
                    return cls._fallback_response("Network limit reached for AI services.")
                await asyncio.sleep(1.0 * (attempt + 1)) # Exponential-ish backoff
            except Exception as e:
                logger.error(f"AI_UNHANDLED_FAILURE: {e}")
                return cls._fallback_response("Unexpected AI service failure.")

        return cls._fallback_response("Exceeded all retries for AI Analysis.")

    @staticmethod
    def _build_prompt(jd_text: str, profile_data: Dict[str, Any]) -> str:
        return f"""
        Analyze the following Job Description against the User's Career Profile.
        PROFILE: {json.dumps(profile_data)}
        JD: {jd_text}
        ...
        RETURN JSON (job_info, parsed_requirements, analysis)
        """

    @staticmethod
    def _fallback_response(error_msg: str) -> Dict[str, Any]:
        return {
            "error": error_msg,
            "job_info": {},
            "analysis": {
                "fit_score": 0,
                "explanation": f"REDUCED_CAPABILITY_MODE: {error_msg}",
                "matches": [],
                "gaps": {"explicit": [], "implied": []}
            }
        }
