import json
import re
from typing import Dict, Any
import httpx
from pypdf import PdfReader
from io import BytesIO
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

class AIResumeParser:
    @staticmethod
    def extract_text(pdf_file: bytes) -> str:
        """Extract text from PDF."""
        try:
            reader = PdfReader(BytesIO(pdf_file))
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            logger.error(f"PDF_EXTRACT_FAIL: {str(e)}")
            return ""

    @classmethod
    async def parse(cls, pdf_file: bytes) -> Dict[str, Any]:
        """Parse Resume using Google Gemini AI."""
        raw_text = cls.extract_text(pdf_file)
        
        # DEBUG: Log the extracted text to a file for diagnosis
        try:
            with open("scratch/last_resume_text.txt", "w", encoding="utf-8") as f:
                f.write(raw_text)
        except:
            pass

        if not raw_text.strip() or len(raw_text.strip()) < 50:
            logger.error(f"EXTRACT_EMPTY or TOO_SHORT: Length {len(raw_text)}")
            return {"error": "Could not extract enough text from the PDF. Please ensure it is a text-based PDF (not a scanned image)."}

        if not settings.GOOGLE_AI_API_KEY:
            logger.warning("MISSING_KEY: No GOOGLE_AI_API_KEY found, using mock.")
            return {
                "personal": {"fullName": "AI Mock (Key Missing)", "headline": "Add your API Key to .env"},
                "experience": [],
                "education": [],
                "skills": {"technical": [], "interpersonal": [], "intrapersonal": []}
            }

        prompt = f"""
        You are a world-class ATS (Applicant Tracking System) parser. 
        Extract all career information from the following resume text into the REQUIRED ERP SCHEMA.
        
        CRITICAL INSTRUCTIONS:
        1. Extract fullName, headline, summary, phone, location, and website from personal info.
        2. Format experience, education, and projects as lists of objects.
        3. Skills MUST be categorized: technical (tools/tech), interpersonal (soft skills), intrapersonal (self-management).
        4. Standardize all dates to "YYYY-MM". If a date says "Present", use "Present".
        5. Return ONLY valid JSON. No markdown summaries.

        REQUIRED ERP SCHEMA:
        {{
            "personal": {{ 
                "fullName": "", "headline": "", "summary": "", "phone": "", "location": "", "website": "" 
            }},
            "education": [
                {{ 
                    "institution": "", "degree": "", "fieldOfStudy": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM" 
                }}
            ],
            "experience": [
                {{ 
                    "company": "", "role": "", "location": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM or Present", "isCurrent": false, "description": "" 
                }}
            ],
            "projects": [
                {{ 
                    "title": "", "description": "", "link": "", "technologies": [] 
                }}
            ],
            "skills": {{ 
                "technical": [], "interpersonal": [], "intrapersonal": [] 
            }},
            "achievements": [],
            "certifications": [
                {{ 
                    "name": "", "issuer": "", "date": "YYYY-MM" 
                }}
            ],
            "socialLinks": {{ 
                "github": "", "linkedin": "", "leetcode": "", "portfolio": "" 
            }}
        }}

        RESUME TEXT:
        {raw_text}
        """

        # Using Gemini 2.0 Flash for superior parsing and speed
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={settings.GOOGLE_AI_API_KEY}"
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "response_mime_type": "application/json",
            },
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
                if response.status_code == 200:
                    result = response.json()
                    
                    if not result.get('candidates'):
                        logger.error(f"GEMINI_EMPTY_CANDIDATES: {result}")
                        return {"error": "AI refused to parse this content due to safety filters."}

                    content = result['candidates'][0]['content']['parts'][0]['text']
                    
                    # Clean the response if it's wrapped in markdown
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        parsed = json.loads(json_match.group())
                        # Ensure fields exist to avoid frontend blanks
                        return cls._validate_parsed_data(parsed)
                    
                    parsed = json.loads(content)
                    return cls._validate_parsed_data(parsed)
                else:
                    logger.error(f"GEMINI_API_ERROR {response.status_code}: {response.text}")
                    return {"error": f"Gemini API error: {response.status_code}"}
            except Exception as e:
                logger.error(f"PARSING_EXCEPTION: {str(e)}")
                return {"error": "System encountered an error during parsing."}

    @staticmethod
    def _validate_parsed_data(data: Any) -> Dict[str, Any]:
        """Ensure critical nested fields exist even if empty."""
        if not isinstance(data, dict):
            logger.warning(f"UNEXPECTED_DATA_TYPE: Expected dict, got {type(data)}")
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
