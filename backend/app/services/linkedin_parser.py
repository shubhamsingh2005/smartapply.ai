import json
import re
from typing import Dict, Any, List
from pypdf import PdfReader
from io import BytesIO
import httpx
from app.core.config import settings

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
            print(f"DEBUG: LinkedIn PDF Extraction failed: {str(e)}")
            return ""

    @classmethod
    async def parse(cls, pdf_file: bytes) -> Dict[str, Any]:
        """Parse LinkedIn PDF into our ERP schema using AI."""
        raw_text = cls.extract_text(pdf_file)
        
        if not raw_text.strip():
            return {"error": "Failed to extract text from PDF"}

        if not settings.GOOGLE_AI_API_KEY:
            print("DEBUG: No GOOGLE_AI_API_KEY found, LinkedIn AI parsing unavailable.")
            return {"error": "AI Configuration missing"}

        prompt = f"""
        You are an expert LinkedIn profile parser. 
        Extract all career information from the following LinkedIn PDF text into a strict JSON format matching our ERP schema.
        
        REQUIRED SCHEMA:
        {{
            "personal": {{ "fullName": "", "headline": "", "summary": "", "phone": "", "location": "", "website": "" }},
            "education": [{{ "institution": "", "degree": "", "fieldOfStudy": "", "startDate": "", "endDate": "" }}],
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

        LINKEDIN TEXT:
        {raw_text}

        Rules:
        1. Return ONLY valid JSON.
        2. Map LinkedIn sections accurately.
        3. Standardize dates to YYYY-MM-DD or Month YYYY.
        """

        # Use gemini-flash-latest as confirmed by diagnostic
        model = "gemini-flash-latest"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GOOGLE_AI_API_KEY}"
        
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
                print(f"DEBUG: Calling Gemini API ({model})...")
                response = await client.post(url, json=payload, timeout=30.0)
                print(f"DEBUG: Gemini API Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    content = result['candidates'][0]['content']['parts'][0]['text']
                    
                    # More robust JSON cleaning
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        try:
                            return json.loads(json_match.group())
                        except:
                            pass
                    return json.loads(content)
                
                # If Flash fails, use the alias latest
                if response.status_code in [429, 404]:
                    print(f"DEBUG: {model} failed with {response.status_code}... check quota.")

                print(f"DEBUG: Gemini API Failed: {response.text}")
                return {"error": f"AI API failed with status {response.status_code}: {response.json().get('error', {}).get('message', 'Unknown Error')}"}
            except Exception as e:
                print(f"DEBUG: LinkedIn AI Parsing Exception: {str(e)}")
                return {"error": str(e)}
