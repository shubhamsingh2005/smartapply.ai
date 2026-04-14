from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.base_class import Base
from app.db.session import engine

# Create tables on startup
# Note: In production, you'd use Alembic migrations instead of this
try:
    Base.metadata.create_all(bind=engine)
    db_status = "connected"
except Exception as e:
    print(f"Error creating tables: {e}")
    db_status = f"error: {str(e)}"

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
origins = []
if settings.BACKEND_CORS_ORIGINS:
    if isinstance(settings.BACKEND_CORS_ORIGINS, list):
        origins = settings.BACKEND_CORS_ORIGINS
    else:
        origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
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
