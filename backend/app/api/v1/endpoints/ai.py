from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.profile import Profile
from app.api.v1.endpoints.auth import get_current_user
from app.services.intelligence import JobIntelligenceService
from app.services.relevance import RelevanceScoringService
from app.services.generation import DocumentGenerationService
from typing import Any

router = APIRouter()

@router.post("/analyze-match")
async def analyze_job_match(
    jd_text: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Analyzes how the user's ERP data matches a given Job Description (Phase 4 + 5).
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding.")

    # Prepare Context Data
    erp_data = {
        "personal": {
            "fullName": current_user.full_name,
            "headline": profile.headline,
            "summary": profile.summary
        },
        "skills": profile.skills,
        "experience": [
            {"role": e.role, "company": e.company, "description": e.description} 
            for e in profile.experience
        ],
        "education": [
            {"degree": ed.degree, "institution": ed.institution} 
            for ed in profile.education
        ],
        "projects": [
            {"title": p.title, "description": p.description}
            for p in profile.projects
        ]
    }

    # Phase 4: Semantic Intelligence
    analysis = await JobIntelligenceService.analyze_job(jd_text, erp_data)
    
    # Phase 5: Relevance Scoring Engine
    relevance = RelevanceScoringService.calculate_relevance(analysis)
    
    # Aggregate results for decision support
    analysis["relevance"] = relevance
    
    return analysis

@router.post("/generate-assets")
async def generate_job_assets(
    jd_text: str = Body(..., embed=True),
    analysis_results: dict = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Generates tailored Resume and Cover Letter (Phase 6).
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # Prepare Context Data
    erp_data = {
        "personal": {"fullName": current_user.full_name, "headline": profile.headline},
        "skills": profile.skills,
        "experience": [{"role": e.role, "company": e.company, "description": e.description} for e in profile.experience],
        "education": [{"degree": ed.degree, "institution": ed.institution} for ed in profile.education]
    }

    assets = await DocumentGenerationService.generate_assets(jd_text, erp_data, analysis_results)
    return assets
