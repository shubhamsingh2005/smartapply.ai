from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from app.db.session import get_db
from app.models.user import User
from app.models.profile import Profile
from app.api.v1.endpoints.auth import get_current_user
from app.services.intelligence import JobIntelligenceService
from app.services.relevance import RelevanceScoringService
from app.services.generation import DocumentGenerationService
from typing import Any
import base64

router = APIRouter()


def _build_erp_data(profile: Profile, user: User) -> dict:
    """Build the full ERP data dict from a loaded profile."""
    return {
        "personal": {
            "fullName": user.full_name,
            "headline": profile.headline,
            "summary": profile.summary,
            "phone": getattr(profile, "phone", ""),
            "location": getattr(profile, "location", ""),
            "linkedin": getattr(profile, "linkedin_url", ""),
            "website": getattr(profile, "website", ""),
        },
        "skills": profile.skills or [],
        "experience": [
            {
                "role": e.role,
                "company": e.company,
                "description": e.description,
                "start_date": str(e.start_date) if getattr(e, "start_date", None) else "",
                "end_date": str(e.end_date) if getattr(e, "end_date", None) else "",
            }
            for e in (profile.experience or [])
        ],
        "education": [
            {
                "degree": ed.degree,
                "institution": ed.institution,
                "field_of_study": getattr(ed, "field_of_study", ""),
                "graduation_year": getattr(ed, "graduation_year", ""),
            }
            for ed in (profile.education or [])
        ],
        "projects": [
            {
                "title": p.title,
                "description": p.description,
                "tech_stack": getattr(p, "tech_stack", ""),
                "url": getattr(p, "url", ""),
            }
            for p in (profile.projects or [])
        ],
        "certifications": [
            {
                "name": getattr(c, "name", str(c)),
                "issuer": getattr(c, "issuer", ""),
            }
            for c in (getattr(profile, "certifications", None) or [])
        ],
    }


def _load_profile(db: Session, user: User) -> Profile:
    profile = (
        db.query(Profile)
        .options(
            joinedload(Profile.experience),
            joinedload(Profile.education),
            joinedload(Profile.projects),
        )
        .filter(Profile.user_id == user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding.")
    return profile


# ─────────────────────────────────────────────────────────────────────────────
# 1. ANALYZE JOB MATCH  (Step 1 — returns JSON intelligence + relevance score)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/analyze-match")
async def analyze_job_match(
    jd_text: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Phase 4: Analyzes how the user's ERP data matches a Job Description.
    Returns job intelligence + relevance score.
    """
    profile = _load_profile(db, current_user)
    erp_data = _build_erp_data(profile, current_user)

    analysis = await JobIntelligenceService.analyze_job(jd_text, erp_data)
    relevance = RelevanceScoringService.calculate_relevance(analysis)
    analysis["relevance"] = relevance

    return analysis


# ─────────────────────────────────────────────────────────────────────────────
# 2. GENERATE AI ASSETS  (Step 2 — returns tailored text content for preview)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/generate-assets")
async def generate_job_assets(
    jd_text: str = Body(..., embed=True),
    analysis_results: dict = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Phase 4: Generates tailored Resume text assets and Cover Letter.
    Returns JSON previews — use /generate-resume-pdf and /generate-cover-letter-pdf for downloads.
    """
    profile = _load_profile(db, current_user)
    erp_data = _build_erp_data(profile, current_user)

    assets = await DocumentGenerationService.generate_assets(jd_text, erp_data, analysis_results)
    return assets


# ─────────────────────────────────────────────────────────────────────────────
# 3. DOWNLOAD RESUME PDF
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/generate-resume-pdf")
async def generate_resume_pdf(
    jd_text: str = Body(..., embed=True),
    assets: dict = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Phase 4: Renders and returns a pixel-perfect PDF resume as a binary download.
    """
    profile = _load_profile(db, current_user)

    pdf_b64 = await DocumentGenerationService.generate_resume_pdf(
        profile=profile,
        user=current_user,
        assets=assets,
    )
    pdf_bytes = base64.b64decode(pdf_b64)

    filename = f"resume_{current_user.full_name or 'smartapply'}.pdf".replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─────────────────────────────────────────────────────────────────────────────
# 4. DOWNLOAD COVER LETTER PDF
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/generate-cover-letter-pdf")
async def generate_cover_letter_pdf(
    assets: dict = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Phase 4: Renders and returns a pixel-perfect PDF cover letter as a binary download.
    """
    profile = _load_profile(db, current_user)

    pdf_b64 = await DocumentGenerationService.generate_cover_letter_pdf(
        profile=profile,
        user=current_user,
        assets=assets,
    )
    pdf_bytes = base64.b64decode(pdf_b64)

    filename = f"cover_letter_{current_user.full_name or 'smartapply'}.pdf".replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
