import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.profile_repository import ProfileRepository
from app.core.exceptions import EntityNotFoundError
from app.core.redis_client import async_redis
from app.core.logging import get_logger
import uuid
from typing import Dict, Any

logger = get_logger(__name__)

from app.core.redis_client import cache
from app.services.intelligence import safe_execute

class ProfileService:
    def __init__(self, db: AsyncSession):
        self.repo = ProfileRepository(db)

    async def get_active_profile(self, user_id: uuid.UUID):
        """
        Fetch full profile with Redis Caching (Cache Aside Pattern) + Resiliency.
        """
        cache_key = f"profile:full:{user_id}"
        
        # 1. Try Cache (Safe)
        cached = await cache.get(cache_key)
        if cached:
            logger.info("CACHE_HIT", extra={"user_id": str(user_id), "key": cache_key})
            return json.loads(cached)
            
        # 2. Try DB (Safe Execute)
        logger.info("CACHE_MISS", extra={"user_id": str(user_id)})
        
        profile = await safe_execute(
            lambda: self.repo.get_profile_by_user_id(user_id), 
            f"fetch_profile_db_{user_id}"
        )
        if not profile:
            return None
            
        from app.services.metrics import ProfileMetricsService
        
        version_count = await self.repo.get_version_count(profile.id)
        latest_version = await self.repo.get_latest_version(profile.id)

        erp_data = {
            "personal": {
                "fullName": profile.user.full_name if profile.user else "",
                "email": profile.user.email if profile.user else "",
                "headline": profile.headline,
                "summary": profile.summary,
                "phone": profile.phone,
                "location": profile.location,
                "website": profile.website,
            },
            "skills": profile.skills,
            "socialLinks": profile.social_links,
            "achievements": profile.achievements,
            "hobbies": profile.interests,
            "languages": profile.languages,
            "experience": [
                {
                    "id": str(exp.id), "company": exp.company, "role": exp.role,
                    "location": exp.location, "startDate": str(exp.start_date) if exp.start_date else None,
                    "endDate": str(exp.end_date) if exp.end_date else None,
                    "isCurrent": exp.is_current, "description": exp.description
                } for exp in profile.experience if not exp.is_deleted
            ],
            "education": [
                {
                    "institution": edu.institution, "degree": edu.degree,
                    "fieldOfStudy": edu.field_of_study, "startDate": str(edu.start_date) if edu.start_date else None,
                    "endDate": str(edu.end_date) if edu.end_date else None
                } for edu in profile.education if not edu.is_deleted
            ],
            "projects": [
                {
                    "title": proj.title, "description": proj.description,
                    "link": proj.link, "technologies": proj.technologies
                } for proj in profile.projects if not proj.is_deleted
            ],
            "certifications": [
                {
                    "name": cert.name, "issuer": cert.issuer,
                    "date": str(cert.issue_date) if cert.issue_date else None
                } for cert in profile.certifications if not cert.is_deleted
            ]
        }

        full_data = {
            "user_info": { "email": "shubhamsingh33972@gmail.com", "full_name": "Shubham Singh" },
            "erp_data": erp_data,
            "meta": {
                "completeness": ProfileMetricsService.calculate_completion(erp_data),
                "last_updated": str(latest_version.created_at) if latest_version else None,
                "version_count": version_count
            }
        }

        # Safe Cache Set
        await cache.set(cache_key, json.dumps(full_data), exp=600)
        return full_data

    async def synchronize_profile(self, user_id: uuid.UUID, profile_data: Dict[str, Any]):
        """
        Synchronize profile and invalidate cache.
        """
        logger.info("PROFILE_UPDATE_INITIATED", extra={"user_id": str(user_id)})
        
        async def sync_op():
            profile = await self.repo.upsert_profile(user_id, profile_data)
            
            # Deep Deltas for all child collections
            sections = {
                "experience": self.repo.update_experience_delta,
                "education": self.repo.update_education_delta,
                "projects": self.repo.update_project_delta,
                "certifications": self.repo.update_certification_delta
            }
            
            for key, sync_fn in sections.items():
                if key in profile_data:
                    await sync_fn(profile.id, profile_data[key])
                    
            return profile

        profile = await safe_execute(sync_op, f"sync_profile_{user_id}")
        
        # Invalidate Cache (Safe)
        await cache.delete(f"profile:full:{user_id}")
        logger.info("CACHE_INVALIDATED", extra={"user_id": str(user_id)})
        return profile

    async def restore_version(self, version_id: str, user_id: uuid.UUID):
        from app.models.profile import ProfileVersion, Profile
        from sqlalchemy.future import select
        
        async def restore_op():
            result = await self.repo.db.execute(
                select(ProfileVersion).join(Profile)
                .filter(ProfileVersion.id == version_id, Profile.user_id == user_id)
            )
            version = result.scalars().first()
            if not version:
                raise EntityNotFoundError("Profile version not found")
            
            # Perform Deep Restore via Synchronize
            await self.synchronize_profile(user_id, version.data)
            return True

        return await safe_execute(restore_op, f"restore_version_{version_id}")
