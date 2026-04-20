import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def sync_schema():
    async with AsyncSessionLocal() as db:
        print("--- SYNCING SCHEMA FOR PHASE 2 ---")
        
        # 1. Add is_deleted to existing tables
        tables = ['experience', 'education', 'project', 'certification']
        for table in tables:
            try:
                print(f"  Patching {table}...")
                await db.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE"))
                print(f"  {table} patched.")
            except Exception as e:
                print(f"  Error patching {table}: {e}")
        
        # 2. Create profile_version table if missing
        create_v_sql = """
        CREATE TABLE IF NOT EXISTS profile_version (
            id UUID PRIMARY KEY,
            profile_id UUID REFERENCES profile(id),
            data JSON NOT NULL,
            version_number INTEGER DEFAULT 1,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            version_label VARCHAR
        )
        """
        try:
            print("  Creating profile_version table...")
            await db.execute(text(create_v_sql))
            print("  profile_version table ready.")
        except Exception as e:
            print(f"  Error creating profile_version: {e}")
        
        # 3. Handle additional columns in profile (volunteer, extracurricular, recommendations) if missing
        profile_cols = ['volunteer', 'extracurricular', 'recommendations']
        for col in profile_cols:
            try:
                 await db.execute(text(f"ALTER TABLE profile ADD COLUMN IF NOT EXISTS {col} JSON DEFAULT '[]'::json"))
            except Exception as e:
                 print(f"  Error patching profile.{col}: {e}")

        await db.commit()
        print("--- SCHEMA SYNC COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(sync_schema())
