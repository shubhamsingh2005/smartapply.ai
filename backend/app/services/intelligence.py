import json
import re
from typing import Dict, Any
import httpx
from app.core.config import settings

class JobIntelligenceService:
    @classmethod
    async def analyze_job(cls, jd_text: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Performs Phase 4 semantic intelligence:
        - Extracts JD requirements.
        - Identifies Explicit vs Implied skill gaps.
        - Generates Fit/Gap analysis with explanations.
        """
        if not settings.GOOGLE_AI_API_KEY:
            return {"error": "AI API key missing"}

        prompt = f"""
        You are an expert Career Strategist and Technical Recruiter.
        Analyze the following Job Description against the User's Career Profile.
        
        USER CAREER PROFILE (Career ERP):
        {json.dumps(profile_data, indent=2)}
        
        JOB DESCRIPTION:
        {jd_text}
        
        TASK:
        1. Extract Job Requirements: Title, Company, Required Skills (Explicit), Implied Skills (based on context), and experience level.
        2. Perform Semantic Skill Mapping:
           - Use strictly professional conceptual matching.
           - DO NOT match unrelated tech (e.g., Python is NOT React, SQL is NOT MongoDB).
           - Only map direct relatives (e.g., 'FastAPI' <-> 'Python Backend', 'Postgres' <-> 'SQL').
           - If a user has 'Frontend' skills and the job is 'DevOps', match_type MUST be 'mismatch' or 'gap'.
        3. Perform Fit/Gap Analysis:
           - Matches: Only include skills where there is strong evidence or direct semantic relationship.
           - Gaps: Be critical. If a skill is mentioned in JD but absent or fundamentally different in Profile, list as 'Explicit Gap'.
        4. Compliance Score: 0-100 relevance score. Be conservative. 90+ means almost perfect match.
        5. Confidence Mapping: Rate each match's evidence strength (High/Medium/Low).

        RETURN JSON FORMAT:
        {{
            "job_info": {{ "title": "", "company": "", "experience_level": "" }},
            "parsed_requirements": {{ "explicit_skills": [], "implied_skills": [] }},
            "analysis": {{
                "fit_score": 0,
                "matches": [{{ "skill": "", "match_type": "exact/semantic", "evidence": "" }}],
                "gaps": {{ "explicit": [], "implied": [] }},
                "explanation": "",
                "confidence_mapping": {{ "skill_name": "high/medium/low based on profile evidence" }}
            }}
        }}
        """

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={settings.GOOGLE_AI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        async with httpx.AsyncClient() as client:
            try:
                # Add retry logic or more specific timeout
                response = await client.post(url, json=payload, timeout=30.0)
                
                if response.status_code != 200:
                    print(f"AI ERROR {response.status_code}: {response.text}")
                    return cls._fallback_response("AI Service unavailable. Please try again later.")

                raw_data = response.json()
                if 'candidates' not in raw_data or not raw_data['candidates']:
                    return cls._fallback_response("AI model didn't return a candidate.")

                content = raw_data['candidates'][0]['content']['parts'][0]['text']
                
                # Robust JSON Extraction
                try:
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    parsed = json.loads(json_match.group()) if json_match else json.loads(content)
                except Exception as je:
                    print(f"JSON Parsing Error: {je}")
                    return cls._fallback_response("Invalid response format from AI.")

                # Sanity Check Fit Score (Reduction of false positives)
                fit_score = parsed.get("analysis", {}).get("fit_score", 0)
                if fit_score < 10:
                    parsed["analysis"]["explanation"] = "Warning: Very low match detected. Review your profile for relevant keywords."
                
                return parsed

            except httpx.TimeoutException:
                return cls._fallback_response("AI Analysis timed out. The JD might be too long.")
            except Exception as e:
                print(f"CRITICAL AI FAILURE: {str(e)}")
                return cls._fallback_response(f"System Error: {str(e)}")

    @staticmethod
    def _fallback_response(error_msg: str) -> Dict[str, Any]:
        return {
            "error": error_msg,
            "job_info": {},
            "analysis": {
                "fit_score": 0,
                "explanation": error_msg,
                "matches": [],
                "gaps": {"explicit": [], "implied": []}
            }
        }
