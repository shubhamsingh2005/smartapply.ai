import json
import re
from typing import Dict, Any
import httpx
from pypdf import PdfReader
from io import BytesIO
from app.core.config import settings

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
            print(f"DEBUG: PDF Extraction failed: {str(e)}")
            return ""

    @classmethod
    async def parse(cls, pdf_file: bytes) -> Dict[str, Any]:
        """Parse Resume using Google Gemini Pro AI."""
        raw_text = cls.extract_text(pdf_file)
        
        if not settings.GOOGLE_AI_API_KEY:
            # Fallback mock if no API key is provided
            print("DEBUG: No GOOGLE_AI_API_KEY found, using mock data.")
            return {
                "personal": {"fullName": "AI Mock (Key Missing)", "headline": "Add your API Key to .env"},
                "experience": [],
                "education": [],
                "skills": {"technical": [], "interpersonal": [], "intrapersonal": []}
            }

        prompt = f"""
        You are an expert ATS (Applicant Tracking System) parser. 
        Extract all career information from the following resume text into a strict JSON format.
        
        REQUIRED SCHEMA:
        {{
            "personal": {{ "fullName": "", "headline": "", "summary": "", "phone": "", "location": "", "website": "" }},
            "education": [{{ "institution": "", "degree": "", "fieldOfStudy": "", "gpa": "", "startDate": "", "endDate": "" }}],
            "experience": [{{ "company": "", "role": "", "location": "", "startDate": "", "endDate": "", "isCurrent": false, "description": "" }}],
            "projects": [{{ "title": "", "description": "", "link": "", "technologies": [] }}],
            "skills": {{ "technical": [], "interpersonal": [], "intrapersonal": [] }},
            "achievements": [],
            "certifications": [{{ "name": "", "issuer": "", "date": "" }}],
            "volunteer": [],
            "extracurricular": [],
            "hobbies": [],
            "languages": [],
            "socialLinks": {{ "github": "", "linkedin": "", "leetcode": "", "portfolio": "" }}
        }}

        RESUME TEXT:
        {raw_text}

        Rules:
        1. Return ONLY valid JSON. 
        2. If information is missing for a field, leave it as an empty string or empty list.
        3. Standardize dates to YYYY-MM-DD where possible.
        """

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={settings.GOOGLE_AI_API_KEY}"
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "response_mime_type": "application/json",
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=30.0)
                if response.status_code == 200:
                    result = response.json()
                    # Gemini might wrap JSON in Markdown code blocks or return it directly
                    content = result['candidates'][0]['content']['parts'][0]['text']
                    
                    # Clean the response if it's wrapped in markdown
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        return json.loads(json_match.group())
                    return json.loads(content)
                else:
                    print(f"DEBUG: Gemini API failed with status {response.status_code}: {response.text}")
                    return {"error": "AI Parsing failed"}
            except Exception as e:
                print(f"DEBUG: AI Parsing Exception: {str(e)}")
                return {"error": str(e)}
