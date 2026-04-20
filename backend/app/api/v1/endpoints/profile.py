from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import joinedload
from app.db.session import get_db
from app.models.user import User
from app.models.profile import Profile, Experience, Education, Project, Certification, ProfileVersion
from app.api.v1.endpoints.auth import get_current_user
from app.services.profile_service import ProfileService
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.logging import get_logger
from app.services.linkedin_parser import LinkedInParser
from app.services.ai_parser import AIResumeParser

logger = get_logger(__name__)
from datetime import datetime


router = APIRouter()

def parse_date(date_str):
    if not date_str or date_str.lower() in ["present", "current"]:
        return None
    try:
        # Try common formats
        for fmt in ("%Y-%m-%d", "%Y-%m", "%B %Y", "%b %Y"):
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        return None
        return None
    except:
        return None


@router.post("/parse/linkedin")
async def parse_linkedin_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
) -> Any:
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type.")
    contents = await file.read()
    return await LinkedInParser.parse(contents)

@router.post("/parse/resume")
async def parse_resume_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
) -> Any:
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type.")
    contents = await file.read()
    return await AIResumeParser.parse(contents)

@router.get("/me")
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    service = ProfileService(db)
    profile_data = await service.get_active_profile(current_user.id)
    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile_data

@router.put("/me")
async def update_profile(
    profile_data: Dict[str, Any], 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    logger.info(f"Updating profile for user {current_user.email}")
    service = ProfileService(db)
    await service.synchronize_profile(current_user.id, profile_data)
    return {"message": "Career Identity ERP Versioned & Finalized"}


@router.get("/versions")
async def get_profile_versions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(select(Profile).filter(Profile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        return []
    
    v_result = await db.execute(
        select(ProfileVersion)
        .filter(ProfileVersion.profile_id == profile.id)
        .order_by(ProfileVersion.created_at.desc())
    )
    versions = v_result.scalars().all()
    
    return [
        {
            "id": str(v.id),
            "version_number": v.version_number,
            "created_at": str(v.created_at),
            "label": v.version_label,
            "is_active": v.is_active
        } for v in versions
    ]

@router.get("/version/{version_id}")
async def get_profile_version(
    version_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    service = ProfileService(db)
    # This matches the legacy logic but async and service-contained
    result = await db.execute(
        select(ProfileVersion)
        .join(Profile)
        .filter(ProfileVersion.id == version_id, Profile.user_id == current_user.id)
    )
    version = result.scalars().first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Profile version not found")
        
    return {
        "id": str(version.id),
        "data": version.data,
        "created_at": str(version.created_at),
        "version_number": version.version_number
    }

@router.post("/version/{version_id}/restore")
async def restore_profile_version(
    version_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    service = ProfileService(db)
    # Delegating to service layer is cleaner
    await service.restore_version(version_id, current_user.id)
    return {"message": "Profile version restored successfully"}
