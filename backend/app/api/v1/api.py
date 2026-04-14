from fastapi import APIRouter
from app.api.v1.endpoints import auth, profile, ai, automation

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(automation.router, prefix="/automation", tags=["automation"])
