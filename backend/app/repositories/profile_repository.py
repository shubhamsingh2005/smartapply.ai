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
                selectinload(Profile.certifications),
                selectinload(Profile.user)
            )
        )
        return result.scalars().first()

    async def upsert_profile(self, user_id: uuid.UUID, profile_data: Dict[str, Any]) -> Profile:
        from sqlalchemy.exc import IntegrityError
        from app.models.profile import ProfileVersion
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
    
             # ERP Sections (Direct mapping with persistence of existing data)
             profile.skills = profile_data.get("skills", profile.skills)
             profile.social_links = profile_data.get("socialLinks", profile.social_links)
             profile.achievements = profile_data.get("achievements", profile.achievements)
             profile.interests = profile_data.get("hobbies", profile_data.get("interests", profile.interests))
             profile.languages = profile_data.get("languages", profile.languages)
             
             profile.volunteer = profile_data.get("volunteer", profile.volunteer)
             profile.extracurricular = profile_data.get("extracurricular", profile.extracurricular)
             profile.recommendations = profile_data.get("recommendations", profile.recommendations)
    
             await self.db.commit()
             await self.db.refresh(profile)
             
             # Atomic Version Snapshotting
             await self.create_snapshot(profile.id, profile_data)
             
        return profile

    async def create_snapshot(self, profile_id: uuid.UUID, data: Dict[str, Any]):
        """Creates a versioned snapshot of the profile state."""
        from app.models.profile import ProfileVersion
        from sqlalchemy.sql import func
        
        v_count = await self.get_version_count(profile_id)
        
        # Deactivate previous versions
        from sqlalchemy import update
        await self.db.execute(
            update(ProfileVersion).where(ProfileVersion.profile_id == profile_id).values(is_active=False)
        )
        
        new_version = ProfileVersion(
            profile_id=profile_id,
            data=data,
            version_number=v_count + 1,
            is_active=True
        )
        self.db.add(new_version)
        await self.db.commit()

    async def update_experience_delta(self, profile_id: uuid.UUID, experiences: list) -> None:
        """Full-field Async Delta update."""
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
                record.location = exp.get("location", record.location)
                record.description = exp.get("description", record.description)
                record.is_current = exp.get("isCurrent", record.is_current)
                # Date parsing handled outside or in validator
                income_ids.append(exp_id)
            else:
                new_exp = Experience(
                    profile_id=profile_id, 
                    company=exp.get("company"), 
                    role=exp.get("role"),
                    location=exp.get("location"),
                    description=exp.get("description"),
                    is_current=exp.get("isCurrent", False)
                )
                self.db.add(new_exp)
        
        for e_id, record in existing_map.items():
            if e_id not in income_ids:
                record.is_deleted = True 

        await self.db.commit()

    async def update_education_delta(self, profile_id: uuid.UUID, education: list) -> None:
        from app.models.profile import Education
        result = await self.db.execute(select(Education).filter(Education.profile_id == profile_id))
        existing = result.scalars().all()
        existing_map = {str(e.id): e for e in existing}
        income_ids = []
        for item in education:
            item_id = item.get("id")
            if item_id and item_id in existing_map:
                record = existing_map[item_id]
                record.institution = item.get("institution", record.institution)
                record.degree = item.get("degree", record.degree)
                record.field_of_study = item.get("fieldOfStudy", record.field_of_study)
                record.gpa = item.get("gpa", record.gpa)
                income_ids.append(item_id)
            else:
                new_item = Education(
                    profile_id=profile_id,
                    institution=item.get("institution"),
                    degree=item.get("degree"),
                    field_of_study=item.get("fieldOfStudy"),
                    gpa=item.get("gpa")
                )
                self.db.add(new_item)
        for e_id, record in existing_map.items():
            if e_id not in income_ids:
                record.is_deleted = True
        await self.db.commit()

    async def update_project_delta(self, profile_id: uuid.UUID, projects: list) -> None:
        from app.models.profile import Project
        result = await self.db.execute(select(Project).filter(Project.profile_id == profile_id))
        existing = result.scalars().all()
        existing_map = {str(p.id): p for p in existing}
        income_ids = []
        for item in projects:
            item_id = item.get("id")
            if item_id and item_id in existing_map:
                record = existing_map[item_id]
                record.title = item.get("title", record.title)
                record.description = item.get("description", record.description)
                record.link = item.get("link", record.link)
                record.technologies = item.get("technologies", record.technologies)
                income_ids.append(item_id)
            else:
                new_item = Project(
                    profile_id=profile_id,
                    title=item.get("title"),
                    description=item.get("description"),
                    link=item.get("link"),
                    technologies=item.get("technologies", [])
                )
                self.db.add(new_item)
        for e_id, record in existing_map.items():
            if e_id not in income_ids:
                record.is_deleted = True
        await self.db.commit()

    async def update_certification_delta(self, profile_id: uuid.UUID, certifications: list) -> None:
        from app.models.profile import Certification
        result = await self.db.execute(select(Certification).filter(Certification.profile_id == profile_id))
        existing = result.scalars().all()
        existing_map = {str(c.id): c for c in existing}
        income_ids = []
        for item in certifications:
            item_id = item.get("id")
            if item_id and item_id in existing_map:
                record = existing_map[item_id]
                record.name = item.get("name", record.name)
                record.issuer = item.get("issuer", record.issuer)
                income_ids.append(item_id)
            else:
                new_item = Certification(
                    profile_id=profile_id,
                    name=item.get("name"),
                    issuer=item.get("issuer")
                )
                self.db.add(new_item)
        for e_id, record in existing_map.items():
            if e_id not in income_ids:
                record.is_deleted = True
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
