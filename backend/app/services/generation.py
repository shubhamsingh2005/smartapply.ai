"""
Phase 4 – PDF Generation Service
Uses Playwright (headless Chromium) to render Jinja2 HTML templates into pixel-perfect PDFs.
Supports: Resume + Cover Letter generation.
"""
import json
import re
import base64
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

import httpx
from jinja2 import Environment, FileSystemLoader, select_autoescape
from app.core.config import settings

# Template directory
TEMPLATE_DIR = Path(__file__).parent.parent / "templates"
jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(["html"])
)


class PDFGenerationService:
    """Renders HTML templates to PDF bytes via Playwright headless Chromium."""

    @staticmethod
    async def render_template_to_pdf(template_name: str, context: Dict[str, Any]) -> bytes:
        """Render a Jinja2 HTML template to PDF bytes."""
        from playwright.async_api import async_playwright

        template = jinja_env.get_template(template_name)
        html_content = template.render(**context)

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.set_content(html_content, wait_until="networkidle")
            pdf_bytes = await page.pdf(
                format="A4",
                margin={"top": "0px", "bottom": "0px", "left": "0px", "right": "0px"},
                print_background=True,
            )
            await browser.close()

        return pdf_bytes

    @classmethod
    async def generate_resume_pdf(
        cls,
        profile: Any,
        user: Any,
        tailored_summary: str,
        optimized_bullets: List[Dict],
        job_info: Dict[str, Any],
    ) -> bytes:
        """Build resume context and render to PDF."""

        # Build experience list — inject AI-optimized bullets for most recent role
        experience_list = []
        for i, exp in enumerate(getattr(profile, "experience", [])):
            bullets = []
            if i == 0 and optimized_bullets:
                # Use AI-optimized bullets for the most recent/relevant role
                bullets = [b.get("optimized", b.get("original", "")) for b in optimized_bullets]
            elif exp.description:
                bullets = [exp.description]

            experience_list.append({
                "role": exp.role or "",
                "company": exp.company or "",
                "location": getattr(exp, "location", "") or "",
                "start_date": _format_date(getattr(exp, "start_date", None)),
                "end_date": _format_date(getattr(exp, "end_date", None)),
                "bullets": bullets,
                "description": exp.description or "",
            })

        # Build education list
        education_list = []
        for edu in getattr(profile, "education", []):
            education_list.append({
                "degree": edu.degree or "",
                "field_of_study": getattr(edu, "field_of_study", "") or "",
                "institution": edu.institution or "",
                "graduation_year": getattr(edu, "graduation_year", "") or "",
                "gpa": getattr(edu, "gpa", "") or "",
            })

        # Build projects list
        projects_list = []
        for proj in getattr(profile, "projects", []):
            projects_list.append({
                "title": proj.title or "",
                "description": proj.description or "",
                "tech_stack": getattr(proj, "tech_stack", "") or "",
                "url": getattr(proj, "url", "") or "",
            })

        # Build certifications list
        cert_list = []
        for cert in getattr(profile, "certifications", []):
            cert_list.append({
                "name": getattr(cert, "name", str(cert)) or "",
                "issuer": getattr(cert, "issuer", "") or "",
            })

        context = {
            "name": user.full_name or user.email,
            "headline": profile.headline or job_info.get("title", ""),
            "tailored_summary": tailored_summary,
            "email": user.email,
            "phone": getattr(profile, "phone", "") or "",
            "location": getattr(profile, "location", "") or "",
            "linkedin": getattr(profile, "linkedin_url", "") or "",
            "website": getattr(profile, "website", "") or "",
            "experience": experience_list,
            "education": education_list,
            "projects": projects_list,
            "skills": profile.skills or [],
            "certifications": cert_list,
        }

        return await cls.render_template_to_pdf("resume.html", context)

    @classmethod
    async def generate_cover_letter_pdf(
        cls,
        profile: Any,
        user: Any,
        cover_letter_text: str,
        job_info: Dict[str, Any],
    ) -> bytes:
        """Render cover letter to PDF."""

        # Convert plain-text paragraphs to HTML <p> tags
        paragraphs = [p.strip() for p in cover_letter_text.strip().split("\n\n") if p.strip()]
        html_body = "".join(f"<p>{para}</p>" for para in paragraphs)

        context = {
            "name": user.full_name or user.email,
            "headline": profile.headline or "",
            "email": user.email,
            "phone": getattr(profile, "phone", "") or "",
            "linkedin": getattr(profile, "linkedin_url", "") or "",
            "date": datetime.now().strftime("%B %d, %Y"),
            "company_name": job_info.get("company", "the Company"),
            "job_title": job_info.get("title", "the Role"),
            "cover_letter_body": html_body,
        }

        return await cls.render_template_to_pdf("cover_letter.html", context)


# ─── AI DOCUMENT GENERATION (upgraded generation.py logic) ─────────────────────

class DocumentGenerationService:
    """
    Phase 4 – Full Document Generation Pipeline.
    1. Calls Gemini to produce tailored summary, bullet optimizations & cover letter text.
    2. Renders them into downloadable PDFs via PDFGenerationService.
    """

    @classmethod
    async def generate_assets(
        cls,
        jd_text: str,
        profile_data: Dict[str, Any],
        analysis_results: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate AI assets (text only, no PDF bytes). Used for preview."""
        if not settings.GOOGLE_AI_API_KEY:
            return {"error": "AI API key missing"}

        prompt = f"""
You are an elite Career Strategist and ATS Specialist.
Based on the Job Description and the Candidate's Career ERP, generate top-tier job application assets.

TARGET JOB:
{jd_text}

CANDIDATE CAREER ERP:
{json.dumps(profile_data, indent=2)}

ANALYSIS INSIGHTS:
{json.dumps(analysis_results, indent=2)}

TASK:
1. Tailored Professional Summary: Write a punchy 3-4 sentence summary that bridges the candidate's strengths to the JD's specific needs. Mention the company name and role if known.
2. Resume Bullet Enhancements: Suggest 3 specific bullet point optimizations for the candidate's most recent experience. Use strong action verbs + quantified impact where possible.
3. Personalized Cover Letter: Write a professional, high-impact cover letter (3 paragraphs):
   - Opening: Express excitement, name the role & company.
   - Middle: Highlight 2-3 specific matching skills with concrete evidence.
   - Closing: Clear call to action.

RETURN JSON FORMAT ONLY:
{{
    "resume_assets": {{
        "tailored_summary": "",
        "bullet_optimizations": [
            {{ "original": "", "optimized": "", "rationale": "" }}
        ]
    }},
    "cover_letter": "",
    "job_info": {{ "title": "", "company": "" }}
}}
"""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GOOGLE_AI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=60.0)
                if response.status_code == 200:
                    content = response.json()["candidates"][0]["content"]["parts"][0]["text"]
                    json_match = re.search(r"\{.*\}", content, re.DOTALL)
                    return json.loads(json_match.group()) if json_match else json.loads(content)
                return {"error": f"AI generation failed: {response.status_code}"}
            except Exception as e:
                return {"error": str(e)}

    @classmethod
    async def generate_resume_pdf(
        cls,
        profile: Any,
        user: Any,
        assets: Dict[str, Any],
    ) -> str:
        """
        Generate PDF resume and return base64-encoded string for download.
        """
        tailored_summary = assets.get("resume_assets", {}).get("tailored_summary", "")
        bullets = assets.get("resume_assets", {}).get("bullet_optimizations", [])
        job_info = assets.get("job_info", {})

        pdf_bytes = await PDFGenerationService.generate_resume_pdf(
            profile=profile,
            user=user,
            tailored_summary=tailored_summary,
            optimized_bullets=bullets,
            job_info=job_info,
        )
        return base64.b64encode(pdf_bytes).decode("utf-8")

    @classmethod
    async def generate_cover_letter_pdf(
        cls,
        profile: Any,
        user: Any,
        assets: Dict[str, Any],
    ) -> str:
        """
        Generate PDF cover letter and return base64-encoded string for download.
        """
        cover_letter_text = assets.get("cover_letter", "")
        job_info = assets.get("job_info", {})

        pdf_bytes = await PDFGenerationService.generate_cover_letter_pdf(
            profile=profile,
            user=user,
            cover_letter_text=cover_letter_text,
            job_info=job_info,
        )
        return base64.b64encode(pdf_bytes).decode("utf-8")


def _format_date(val) -> str:
    """Safely format a date value to a short string."""
    if not val:
        return ""
    if hasattr(val, "strftime"):
        return val.strftime("%b %Y")
    return str(val)
