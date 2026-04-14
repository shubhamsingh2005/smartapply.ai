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
        You are an expert technical recruiter and career strategist.
        Analyze the match between this Candidate ERP and the Job Description.

        CANDIDATE ERP DATA:
        {json.dumps(erp_data)}

        JOB DESCRIPTION:
        {jd_text}

        TASK:
        1. Extract Job Intelligence: Identify Job Title, Company, and required Experience Level.
        2. Fit/Gap Analysis:
           - Explicit Matches: Skills clearly stated in both.
           - Explicit Gaps: Skills requested in JD but missing in ERP.
           - Implied Gaps: Skills the role implies (e.g., if it's a 'Lead' role, 'Mentorship' is an implied gap if not in ERP).
        3. Compliance Score: 0-100 overall fit.
        4. Confidence Mapping: For each match, rate the evidence strength (High/Medium/Low).

        RETURN JSON:
        {{
            "job_info": {{ "title": "", "company": "", "experience_required": "" }},
            "match_score": 0,
            "fit_analysis": {{
                "explicit_matches": [{{ "skill": "", "confidence": "high/medium/low", "evidence": "" }}],
                "explicit_gaps": [],
                "implied_gaps": [],
                "explanation": ""
            }},
            "improvement_plan": []
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
