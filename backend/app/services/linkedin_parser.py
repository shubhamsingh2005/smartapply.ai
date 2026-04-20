import json
import re
from typing import Dict, Any, List
from pypdf import PdfReader
from io import BytesIO
import httpx
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

from app.services.ai_base import AIBaseParser, AIServiceError

class LinkedInParser(AIBaseParser):
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
            logger.error(f"LINKEDIN_PDF_EXTRACT_FAIL: {str(e)}")
            return ""

    @classmethod
    async def parse(cls, pdf_file: bytes) -> Dict[str, Any]:
        """Parse LinkedIn PDF into our ERP schema with resilience."""
        raw_text = cls.extract_text(pdf_file)
        
        if not raw_text.strip() or len(raw_text.strip()) < 50:
            return {"error": "Failed to extract text from LinkedIn PDF. Ensure it's a valid text-based PDF."}

        prompt = f"""
        You are a world-class AI LinkedIn profile parser. 
        Extract all career information from the provided LinkedIn PDF text into the REQUIRED ERP SCHEMA.
        
        CRITICAL INSTRUCTIONS:
        1. Resolve mixed columns (sidebar vs main content).
        2. Format dates as YYYY-MM or "Present".
        3. Categorize skills: technical, interpersonal, intrapersonal.
        
        REQUIRED ERP SCHEMA:
        {{
            "personal": {{ "fullName": "", "headline": "", "summary": "", "phone": "", "location": "", "website": "" }},
            "education": [{{ "institution": "", "degree": "", "fieldOfStudy": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM" }}],
            "experience": [{{ "company": "", "role": "", "location": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM or Present", "isCurrent": false, "description": "" }}],
            "projects": [{{ "title": "", "description": "", "link": "", "technologies": [] }}],
            "skills": {{ "technical": [], "interpersonal": [], "intrapersonal": [] }},
            "achievements": [],
            "certifications": [{{ "name": "", "issuer": "", "date": "YYYY-MM" }}],
            "socialLinks": {{ "github": "", "linkedin": "", "leetcode": "", "portfolio": "" }}
        }}

        RAW LINKEDIN TEXT:
        {raw_text}
        """

        try:
            # Use the robust base caller
            content = await cls.call_gemini(prompt)
            parsed = cls.clean_json_response(content)
            return cls._validate_parsed_data(parsed)
        except AIServiceError as e:
            logger.error(f"LINKEDIN_PARSING_FAILED: {e.message}")
            return {"error": f"AI Parsing Warning: {e.message}"}
        except Exception as e:
            logger.error(f"UNEXPECTED_LINKEDIN_ERROR: {str(e)}")
            return {"error": "Internal system error during LinkedIn parsing."}

    @staticmethod
    def _validate_parsed_data(data: Any) -> Dict[str, Any]:
        """Ensure critical nested fields exist even if empty."""
        if not isinstance(data, dict):
            data = {}
        defaults = {
            "personal": {}, "experience": [], "education": [], "projects": [],
            "skills": {"technical": [], "interpersonal": [], "intrapersonal": []},
            "achievements": [], "certifications": [], "socialLinks": {}
        }
        for key, val in defaults.items():
            if key not in data:
                data[key] = val
        return data

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
