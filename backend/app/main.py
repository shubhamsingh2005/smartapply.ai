from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.base import Base
from app.db.session import engine
from app.core.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from app.core.redis_client import init_redis
from app.core.logging import get_logger
import os

logger = get_logger(__name__)

os.makedirs("app/static/screenshots", exist_ok=True)

# Create tables on startup
# Note: In production, you'd use Alembic migrations instead of this
# try:
#     Base.metadata.create_all(bind=engine)
#     db_status = "connected"
# except Exception as e:
#     print(f"Error creating tables: {e}")
#     db_status = f"error: {str(e)}"
db_status = "skipping auto-create"

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
async def startup_event():
    await init_redis()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema synchronized.")

app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Set all CORS enabled origins
# If allow_credentials=True, allow_origins cannot be ["*"]
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
]

if settings.BACKEND_CORS_ORIGINS:
    if isinstance(settings.BACKEND_CORS_ORIGINS, list):
        origins.extend(settings.BACKEND_CORS_ORIGINS)
    else:
        # Handle comma-separated string from environment variables
        extra_origins = [i.strip() for i in settings.BACKEND_CORS_ORIGINS.split(",")]
        origins.extend(extra_origins)

# Deduplicate origins
origins = list(set(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.get("/")
def root():
    return {"message": f"Welcome to {settings.APP_NAME} API"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "service": settings.APP_NAME,
        "database": db_status
    }

# Include all API routers
app.include_router(api_router, prefix=settings.API_V1_STR)
