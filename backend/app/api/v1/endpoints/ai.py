from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.services.profile_service import ProfileService
from app.services.intelligence import JobIntelligenceService
from app.services.relevance import RelevanceScoringService
from app.services.generation import DocumentGenerationService
from typing import Any
import base64

router = APIRouter()

@router.post("/analyze-match")
async def analyze_job_match(
    jd_text: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ProfileService(db)
    profile_full = await service.get_active_profile(current_user.id)
    if not profile_full:
         raise HTTPException(status_code=404, detail="Profile not found.")
    
    erp_data = profile_full["erp_data"]
    analysis = await JobIntelligenceService.analyze_job(jd_text, erp_data)
    relevance = RelevanceScoringService.calculate_relevance(analysis)
    analysis["relevance"] = relevance
    return analysis

@router.post("/generate-assets")
async def generate_job_assets(
    jd_text: str = Body(..., embed=True),
    analysis_results: dict = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ProfileService(db)
    profile_full = await service.get_active_profile(current_user.id)
    if not profile_full:
         raise HTTPException(status_code=404, detail="Profile not found.")
    
    erp_data = profile_full["erp_data"]
    assets = await DocumentGenerationService.generate_assets(jd_text, erp_data, analysis_results)
    return assets

@router.post("/generate-resume-pdf")
async def generate_resume_pdf(
    jd_text: str = Body(..., embed=True),
    assets: dict = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    profile = await service.repo.get_profile_by_user_id(current_user.id)
    
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

@router.post("/generate-cover-letter-pdf")
async def generate_cover_letter_pdf(
    assets: dict = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    profile = await service.repo.get_profile_by_user_id(current_user.id)

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
