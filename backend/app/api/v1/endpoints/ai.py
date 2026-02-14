from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.profile import Profile
from app.api.v1.endpoints.auth import get_current_user
from app.services.ai_tailor import AITailor
from typing import Any

router = APIRouter()

@router.post("/analyze-match")
async def analyze_job_match(
    jd_text: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Analyzes how the user's ERP data matches a given Job Description.
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding.")

    # Convert profile model to dict (simplified for prompt)
    erp_data = {
        "headline": profile.headline,
        "summary": profile.summary,
        "skills": profile.skills,
        "experience": [
            {"role": e.role, "company": e.company, "description": e.description} 
            for e in profile.experience
        ],
        "education": [
            {"degree": ed.degree, "institution": ed.institution} 
            for ed in profile.education
        ]
    }

    analysis = await AITailor.analyze_match(erp_data, jd_text)
    return analysis
