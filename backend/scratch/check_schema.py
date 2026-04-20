import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as db:
        for table in ['experience', 'education', 'project', 'certification', 'profile_version']:
            try:
                res = await db.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'"))
                cols = [r[0] for r in res.fetchall()]
                print(f"Table {table}: {cols}")
            except Exception as e:
                print(f"Table {table} error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
