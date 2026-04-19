import pytest
import uuid
import json
from app.services.profile_service import ProfileService
from app.core.redis_client import async_redis

@pytest.mark.asyncio
async def test_get_active_profile_caching_full_object(db_session, mocker):
    service = ProfileService(db_session)
    user_id = uuid.uuid4()
    
    # Mock repo to return a profile
    mock_profile = mocker.Mock()
    mock_profile.id = uuid.uuid4()
    mock_profile.headline = "Staff Engineer"
    mock_profile.summary = "..."
    mock_profile.experience = []
    mock_profile.education = []
    mock_profile.projects = []
    mock_profile.certifications = []
    
    mocker.patch.object(service.repo, 'get_profile_by_user_id', return_value=mock_profile)
    mocker.patch.object(service.repo, 'get_version_count', return_value=5)
    mocker.patch.object(service.repo, 'get_latest_version', return_value=None)
    
    # First call - Cache Miss
    data = await service.get_active_profile(user_id)
    assert data["erp_data"]["headline"] == "Staff Engineer"
    
    # Verify cached in Redis
    cached = await async_redis.get(f"profile:full:{user_id}")
    assert cached is not None
    cached_json = json.loads(cached)
    assert cached_json["erp_data"]["headline"] == "Staff Engineer"
    assert "meta" in cached_json
