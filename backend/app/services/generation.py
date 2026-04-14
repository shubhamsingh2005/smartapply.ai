import json
import re
from typing import Dict, Any
import httpx
from app.core.config import settings

class DocumentGenerationService:
    @classmethod
    async def generate_assets(cls, jd_text: str, profile_data: Dict[str, Any], analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Phase 6: Generates a tailored Resume structure and Cover Letter 
        based on Job Intelligence and Relevance Scoring.
        """
        if not settings.GOOGLE_AI_API_KEY:
            return {"error": "AI API key missing"}

        prompt = f"""
        You are an elite Career Strategist and ATS Specialist.
        Based on the Job Description and the Candidate's Career ERP, generate top-tier job application assets.

        TARGET JOB:
        {jd_text}

        CANDIDATE CAREER ERP:
        {json.dumps(profile_data, indent=2)}

        ANALYSIS INSIGHTS (Phase 5):
        {json.dumps(analysis_results, indent=2)}

        TASK:
        1. Tailored Professional Summary: Write a 3-4 sentence punchy summary for the resume that bridges the candidate's strengths with the JD's specific needs.
        2. Resume Bullet Enhancements: Suggest 3 specific bullet point optimizations for the candidate's latest experience to align with this role.
        3. Personalized Cover Letter: Write a professional, high-impact cover letter. It should:
           - Address the specific problem the company is trying to solve.
           - Highlight 2 matching skills identified by the Semantic Mapping engine.
           - Have a clear call to action.
           - Use a professional yet modern tone.

        RETURN JSON FORMAT:
        {{
            "resume_assets": {{
                "tailored_summary": "",
                "bullet_optimizations": [
                    {{ "original": "", "optimized": "", "rationale": "" }}
                ]
            }},
            "cover_letter": ""
        }}
        """

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={settings.GOOGLE_AI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=50.0)
                if response.status_code == 200:
                    content = response.json()['candidates'][0]['content']['parts'][0]['text']
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    return json.loads(json_match.group()) if json_match else json.loads(content)
                return {"error": f"Asset generation failed: {response.text}"}
            except Exception as e:
                return {"error": str(e)}
