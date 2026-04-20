import asyncio
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.profile import Profile, ProfileVersion, Experience
from app.models.job import JobAnalysis
from app.models.audit import AuditLog

async def inspect_db():
    async with AsyncSessionLocal() as db:
        print("--- DB INSPECTION ---")
        
        # 1. Users
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f"Users: {[u.email for u in users]}")
        
        # 2. Profiles
        result = await db.execute(select(Profile))
        profiles = result.scalars().all()
        print(f"Profiles: {[(p.id, p.user_id) for p in profiles]}")
        
        # 3. Versions
        result = await db.execute(select(ProfileVersion))
        versions = result.scalars().all()
        print(f"Versions count: {len(versions)}")
        
        # 4. Experiences
        result = await db.execute(select(Experience))
        exps = result.scalars().all()
        print(f"Experiences count: {len(exps)}")

if __name__ == "__main__":
    asyncio.run(inspect_db())
