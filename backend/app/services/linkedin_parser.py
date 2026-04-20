import json
import re
from typing import Dict, Any, List
from pypdf import PdfReader
from io import BytesIO
import httpx
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

class LinkedInParser:
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
        """Parse LinkedIn PDF into our ERP schema using Gemini 2.0 AI."""
        raw_text = cls.extract_text(pdf_file)
        
        # DEBUG: Log for diagnosis
        try:
            with open("scratch/last_linkedin_text.txt", "w", encoding="utf-8") as f:
                f.write(raw_text)
        except:
            pass

        if not raw_text.strip() or len(raw_text.strip()) < 50:
            return {"error": "Failed to extract text from LinkedIn PDF. Check if it's a valid LinkedIn export."}

        if not settings.GOOGLE_AI_API_KEY:
            logger.warning("MISSING_KEY: LinkedIn parsing mock triggered.")
            return {"error": "AI Configuration missing"}

        prompt = f"""
        You are a world-class AI LinkedIn profile parser. 
        Your task is to extract all career information from the provided LinkedIn PDF text and map it to the REQUIRED ERP SCHEMA.
        
        CRITICAL INSTRUCTIONS:
        1. The text extraction often mixes two columns (sidebar and main content). Carefully separate them.
        2. "Experience" usually contains company name, role, dates (e.g., "Jun 2021 - Present"), and descriptions.
        3. "Education" contains school, degree (e.g., "Bachelor of Science"), and dates.
        4. "Skills" should be categorized into technical (e.g., Python, AWS), interpersonal (e.g., Leadership), and intrapersonal (e.g., Growth Mindset).
        5. "Certifications" are often in the sidebar. Extract the name, issuer, and date.
        6. Standardize all dates to "YYYY-MM". If a date is "Present", use "Present".
        7. If a field is missing, use an empty string "" or an empty list [].
        
        REQUIRED ERP SCHEMA:
        {{
            "personal": {{ 
                "fullName": "Full Name", 
                "headline": "Current Role | Headline", 
                "summary": "Professional Summary", 
                "phone": "", 
                "location": "City, Country", 
                "website": "" 
            }},
            "education": [
                {{ 
                    "institution": "University Name", 
                    "degree": "Degree (e.g. BS)", 
                    "fieldOfStudy": "Field of Study", 
                    "startDate": "YYYY-MM", 
                    "endDate": "YYYY-MM" 
                }}
            ],
            "experience": [
                {{ 
                    "company": "Company Name", 
                    "role": "Job Title", 
                    "location": "City, Country", 
                    "startDate": "YYYY-MM", 
                    "endDate": "YYYY-MM or Present", 
                    "isCurrent": true/false, 
                    "description": "Responsibilities and achievements" 
                }}
            ],
            "projects": [
                {{ 
                    "title": "", 
                    "description": "", 
                    "link": "", 
                    "technologies": [] 
                }}
            ],
            "skills": {{ 
                "technical": [], 
                "interpersonal": [], 
                "intrapersonal": [] 
            }},
            "achievements": [],
            "certifications": [
                {{ 
                    "name": "Certification Name", 
                    "issuer": "Issuing Org", 
                    "date": "YYYY-MM" 
                }}
            ],
            "socialLinks": {{ 
                "github": "", 
                "linkedin": "LinkedIn profile URL if found in text", 
                "leetcode": "", 
                "portfolio": "" 
            }}
        }}

        RAW LINKEDIN TEXT:
        ---
        {raw_text}
        ---

        FINAL RULE: Return ONLY the JSON object. Do not explain anything. 
        """

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
                        return {"error": "AI Safety filter blocked the conversion of this LinkedIn profile."}

                    content = result['candidates'][0]['content']['parts'][0]['text']
                    
                    # More robust JSON cleaning
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        parsed = json.loads(json_match.group())
                        return cls._validate_parsed_data(parsed)
                    
                    parsed = json.loads(content)
                    return cls._validate_parsed_data(parsed)
                
                logger.error(f"GEMINI_LINKEDIN_ERROR {response.status_code}: {response.text}")
                return {"error": f"AI Parsing failed with status {response.status_code}"}
            except Exception as e:
                logger.error(f"LINKEDIN_AI_EXCEPTION: {str(e)}")
                return {"error": "System error during LinkedIn parsing."}

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
