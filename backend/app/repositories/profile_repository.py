from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.profile import Profile, Experience
import uuid
from typing import Optional, Dict, Any
from app.core.logging import get_logger

logger = get_logger(__name__)

class ProfileRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_profile_by_user_id(self, user_id: uuid.UUID) -> Optional[Profile]:
        from sqlalchemy.orm import selectinload
        result = await self.db.execute(
            select(Profile)
            .filter(Profile.user_id == user_id)
            .options(
                selectinload(Profile.experience),
                selectinload(Profile.education),
                selectinload(Profile.projects),
                selectinload(Profile.certifications)
            )
        )
        return result.scalars().first()

    async def upsert_profile(self, user_id: uuid.UUID, profile_data: Dict[str, Any]) -> Profile:
        from sqlalchemy.exc import IntegrityError
        profile = await self.get_profile_by_user_id(user_id)
        
        if not profile:
            try:
                profile = Profile(user_id=user_id)
                self.db.add(profile)
                await self.db.commit()
            except IntegrityError:
                await self.db.rollback()
                profile = await self.get_profile_by_user_id(user_id)
            else:
                await self.db.refresh(profile)

        personal = profile_data.get("personal", {})
        if profile:
             if personal:
                profile.headline = personal.get("headline", profile.headline)
                profile.summary = personal.get("summary", profile.summary)
                profile.location = personal.get("location", profile.location)
                profile.phone = personal.get("phone", profile.phone)
                profile.website = personal.get("website", profile.website)
    
             # JSON / List fields mapping
             profile.skills = profile_data.get("skills", profile.skills)
             profile.social_links = profile_data.get("socialLinks", profile.social_links)
             profile.achievements = profile_data.get("achievements", profile.achievements)
             profile.interests = profile_data.get("hobbies", profile_data.get("interests", profile.interests))
             profile.languages = profile_data.get("languages", profile.languages)
    
             await self.db.commit()
             await self.db.refresh(profile)
        return profile

    async def update_experience_delta(self, profile_id: uuid.UUID, experiences: list) -> None:
        """
        Non-destructive Async Delta update strategy.
        """
        result = await self.db.execute(select(Experience).filter(Experience.profile_id == profile_id))
        existing_exps = result.scalars().all()
        existing_map = {str(e.id): e for e in existing_exps}
        
        income_ids = []
        for exp in experiences:
            exp_id = exp.get("id")
            if exp_id and exp_id in existing_map:
                record = existing_map[exp_id]
                record.company = exp.get("company", record.company)
                record.role = exp.get("role", record.role)
                income_ids.append(exp_id)
            else:
                new_exp = Experience(profile_id=profile_id, company=exp.get("company"), role=exp.get("role"))
                self.db.add(new_exp)
        
        # Soft delete logic
        for e_id, record in existing_map.items():
            if e_id not in income_ids:
                if hasattr(record, 'is_deleted'):
                    record.is_deleted = True 
                else:
                    # Fallback if migration hasn't run yet
                    logger.warning(f"Experience {e_id} has no is_deleted field. Skipping soft-delete.")

        await self.db.commit()

    async def get_version_count(self, profile_id: uuid.UUID) -> int:
        from app.models.profile import ProfileVersion
        from sqlalchemy import func
        result = await self.db.execute(select(func.count(ProfileVersion.id)).filter(ProfileVersion.profile_id == profile_id))
        return result.scalar() or 0

    async def get_latest_version(self, profile_id: uuid.UUID) -> Optional[Any]:
        from app.models.profile import ProfileVersion
        result = await self.db.execute(
            select(ProfileVersion)
            .filter(ProfileVersion.profile_id == profile_id)
            .order_by(ProfileVersion.created_at.desc())
        )
        return result.scalars().first()
