import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

database_url = settings.DATABASE_URL

# Handle potential issues with DATABASE_URL
if not database_url:
    logger.error("DATABASE_URL is not set!")
elif database_url.startswith("postgres://"):
    # Render and some other platforms use postgres://, but SQLAlchemy 1.4+ requires postgresql://
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# Check if we are using the default localhost URL in production
if settings.ENV == "production" and "localhost" in database_url:
    logger.warning("Using default localhost database URL in production environment!")

# For Supabase/external DBs, ensure we have a reasonable timeout and pool settings
engine = create_engine(
    database_url, 
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    listens_for=None # Placeholder if we needed to add SSL args specifically
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
