import json
import re
import asyncio
from typing import Dict, Any, Optional
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

class AIServiceError(Exception):
    """Custom exception for AI service failures."""
    def __init__(self, message: str, status_code: Optional[int] = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class AIBaseParser:
    @staticmethod
    @retry(
        retry=retry_if_exception_type(AIServiceError),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(3),
        before_sleep=lambda retry_state: logger.warning(f"AI_RETRYING: Attempt {retry_state.attempt_number} after error: {retry_state.outcome.exception()}")
    )
    async def call_gemini(prompt: str, model: str = "gemini-flash-latest") -> str:
        """Call Gemini API with exponential backoff and error handling."""
        if not settings.GOOGLE_AI_API_KEY:
            raise AIServiceError("GOOGLE_AI_API_KEY_MISSING")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GOOGLE_AI_API_KEY}"
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"},
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
            ]
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=60.0)
                
                if response.status_code == 429:
                    logger.error(f"GEMINI_RATE_LIMIT: {response.text}")
                    raise AIServiceError("Rate limit exceeded", status_code=429)
                
                if response.status_code != 200:
                    logger.error(f"GEMINI_API_ERROR {response.status_code}: {response.text}")
                    raise AIServiceError(f"API Error {response.status_code}", status_code=response.status_code)

                result = response.json()
                if not result.get('candidates'):
                    logger.error(f"GEMINI_NO_CANDIDATES: {result}")
                    raise AIServiceError("AI Safety block or empty response")

                return result['candidates'][0]['content']['parts'][0]['text']
            
            except httpx.RequestError as e:
                logger.error(f"HTTP_REQUEST_ERROR: {str(e)}")
                raise AIServiceError(f"Network error: {str(e)}")

    @staticmethod
    def clean_json_response(content: str) -> Dict[str, Any]:
        """Robutsly extract and clean JSON from AI response."""
        try:
            # Try direct parse
            return json.loads(content)
        except json.JSONDecodeError:
            # Try regex extraction
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except:
                    pass
            logger.error(f"JSON_CLEAN_FAIL: Could not parse {content[:100]}...")
            return {}

    @staticmethod
    def chunk_text(text: str, max_chars: int = 12000) -> list:
        """Simple character-based chunking for very large documents."""
        if len(text) <= max_chars:
            return [text]
        return [text[i:i+max_chars] for i in range(0, len(text), max_chars)]
