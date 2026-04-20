import json
import re
from typing import Dict, Any
import httpx
from pypdf import PdfReader
from io import BytesIO
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

from app.services.ai_base import AIBaseParser, AIServiceError

class AIResumeParser(AIBaseParser):
    @staticmethod
    def extract_text(pdf_file: bytes) -> str:
        """Extract raw text from PDF bytes."""
        try:
            reader = PdfReader(BytesIO(pdf_file))
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            logger.error(f"RESUME_PDF_EXTRACT_FAIL: {str(e)}")
            return ""

    @classmethod
    async def parse(cls, pdf_file: bytes) -> Dict[str, Any]:
        """Parse Resume PDF into our ERP schema with resilience."""
        raw_text = cls.extract_text(pdf_file)
        
        if not raw_text.strip() or len(raw_text.strip()) < 50:
            return {"error": "Failed to extract text from Resume PDF. Ensure it's a valid text-based PDF."}

        prompt = f"""
        You are an elite Resume Parser. Extract all details from the provided Resume text into the REQUIRED ERP SCHEMA.
        
        CRITICAL RULES:
        1. Format all dates as YYYY-MM.
        2. Clean symbols and bullet points.
        3. Categorize skills: technical, interpersonal, intrapersonal.
        
        REQUIRED ERP SCHEMA:
        {{
            "personal": {{ "fullName": "", "headline": "", "summary": "", "phone": "", "location": "", "website": "" }},
            "experience": [{{ "company": "", "role": "", "location": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM or Present", "description": "" }}],
            "education": [{{ "institution": "", "degree": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM" }}],
            "skills": {{ "technical": [], "interpersonal": [], "intrapersonal": [] }},
            "projects": [{{ "title": "", "description": "", "link": "", "technologies": [] }}],
            "achievements": [],
            "certifications": [],
            "socialLinks": {{ "github": "", "linkedin": "", "portfolio": "" }}
        }}

        RESUME TEXT:
        {raw_text}
        """

        try:
            content = await cls.call_gemini(prompt)
            parsed = cls.clean_json_response(content)
            return cls._validate_parsed_data(parsed)
        except AIServiceError as e:
            logger.error(f"RESUME_PARSING_FAILED: {e.message}")
            return {"error": f"AI Parsing Warning: {e.message}"}
        except Exception as e:
            logger.error(f"UNEXPECTED_RESUME_ERROR: {str(e)}")
            return {"error": "Internal system error during Resume parsing."}

    @staticmethod
    def _validate_parsed_data(data: Any) -> Dict[str, Any]:
        """Ensure critical nested fields exist even if empty."""
        if not isinstance(data, dict):
            data = {}

        defaults = {
            "personal": {}, "experience": [], "education": [], "projects": [],
            "skills": {"technical": [], "interpersonal": []},
            "achievements": [], "certifications": [], "socialLinks": {}
        }
        for key, val in defaults.items():
            if key not in data:
                data[key] = val
        return data
