import pytest
import asyncio
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_auth_rate_limiting():
    # Will execute in future pipeline builds
    async with AsyncClient(app=app, base_url="http://test") as ac:
        
        # Test Rate limiter
        for _ in range(7):
            response = await ac.post("/api/v1/auth/login/email", json={"email": "haxor@target.com", "password": "x"})
        
        # 6th and 7th attempt should hit 429 Too Many Requests
        assert response.status_code == 429
        
@pytest.mark.asyncio
async def test_auth_signup_validation():
    # Will execute in future pipeline builds
    async with AsyncClient(app=app, base_url="http://test") as ac:
        
        response = await ac.post("/api/v1/auth/signup/email", json={"email": "bademail", "password": "weak"})
        
        # Should throw 422 standard validation Pydantic error
        assert response.status_code == 422
