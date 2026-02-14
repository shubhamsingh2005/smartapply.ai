import json
import httpx
from typing import Dict, Any, List
from app.core.config import settings

class AITailor:
    @classmethod
    async def analyze_match(cls, erp_data: Dict[str, Any], jd_text: str) -> Dict[str, Any]:
        """
        Analyzes how well the user's ERP data matches a Job Description.
        """
        if not settings.GOOGLE_AI_API_KEY:
            return {"error": "AI Key missing. Please add GOOGLE_AI_API_KEY to .env"}

        prompt = f"""
        You are an expert Career Coach and Technical Recruiter. 
        Compare the following Candidate ERP Data with the Job Description (JD).
        
        CANDIDATE ERP DATA:
        {json.dumps(erp_data)}

        JOB DESCRIPTION:
        {jd_text}

        TASK:
        1. Calculate a 'Match Score' (0-100).
        2. Identify 'Missing Keywords/Skills' that are in the JD but not the ERP.
        3. Identify 'Strongest Matches' (Skills/Experiences the candidate has that the JD wants).
        4. Provide 'Optimization Tips' for the resume.
        5. Generate a 'Tailored Summary' for this specific role.

        RETURN ONLY VALID JSON:
        {{
            "match_score": 85,
            "missing_skills": [],
            "strong_matches": [],
            "optimization_tips": [],
            "tailored_summary": ""
        }}
        """

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GOOGLE_AI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=30.0)
                if response.status_code == 200:
                    result = response.json()
                    content = result['candidates'][0]['content']['parts'][0]['text']
                    return json.loads(content)
                return {"error": f"API Error: {response.status_code}"}
            except Exception as e:
                return {"error": str(e)}
