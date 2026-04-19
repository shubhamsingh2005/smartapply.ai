import pytest
import uuid
from app.repositories.profile_repository import ProfileRepository
from app.models.profile import Profile, Experience

@pytest.mark.asyncio
async def test_upsert_profile_preserves_all_fields(db_session):
    repo = ProfileRepository(db_session)
    user_id = uuid.uuid4()
    
    # Initial data
    data = {
        "personal": {
            "headline": "Initial Headline",
            "phone": "1234567890",
            "location": "Global"
        },
        "skills": ["Python"],
        "socialLinks": {"github": "shubham"}
    }
    
    profile = await repo.upsert_profile(user_id, data)
    assert profile.headline == "Initial Headline"
    assert profile.phone == "1234567890"
    assert profile.skills == ["Python"]
    
    # Update partial data
    update_data = {
        "personal": {
            "headline": "Updated Headline"
        }
    }
    
    updated_profile = await repo.upsert_profile(user_id, update_data)
    assert updated_profile.headline == "Updated Headline"
    # Verify phone was preserved
    assert updated_profile.phone == "1234567890"
    # Verify skills were preserved
    assert updated_profile.skills == ["Python"]

@pytest.mark.asyncio
async def test_experience_delta_soft_delete(db_session):
    repo = ProfileRepository(db_session)
    user_id = uuid.uuid4()
    profile = Profile(user_id=user_id)
    db_session.add(profile)
    await db_session.commit()
    
    # 1. Add experience
    await repo.update_experience_delta(profile.id, [{"company": "Google", "role": "Staff"}])
    
    # Verify added
    res = await repo.get_profile_by_user_id(user_id)
    assert len(res.experience) == 1
    exp_id = str(res.experience[0].id)
    
    # 2. Update with empty list (should soft delete existing)
    await repo.update_experience_delta(profile.id, [])
    
    # Verify soft deleted
    # Need to refresh or re-fetch
    res_after = await repo.get_profile_by_user_id(user_id)
    # relationship still contains it, but is_deleted should be True
    assert res_after.experience[0].is_deleted is True
