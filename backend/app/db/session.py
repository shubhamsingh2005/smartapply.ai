import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

import ssl
database_url = settings.DATABASE_URL
connect_args = {}

if "sslmode=require" in database_url:
    # Explicitly enable SSL for asyncpg which doesn't support sslmode in URL
    database_url = database_url.replace("?sslmode=require", "").replace("&sslmode=require", "")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE  # Common for managed DBs like Supabase
    connect_args["ssl"] = ctx
    logger.info("DATABASE_SSL_ENABLED: Detected production environment.")

# Standardize async scheme
database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1).replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    database_url,
    pool_size=5,
    max_overflow=0,
    pool_pre_ping=True,
    connect_args=connect_args
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
        await session.commit()
