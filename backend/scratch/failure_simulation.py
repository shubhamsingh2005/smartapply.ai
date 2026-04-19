import asyncio
import uuid
import json
from app.services.intelligence import JobIntelligenceService
from app.services.profile_service import ProfileService
from app.core.redis_client import cache

async def simulate_failures():
    print("--- SIMULATING REDIS DOWN ---")
    # Cache should return None silently or log warning
    val = await cache.get("test_key")
    print(f"Redis result (should be None): {val}")

    print("\n--- SIMULATING AI FAILURE (Invalid Key) ---")
    # Logic should use fallback
    res = await JobIntelligenceService.analyze_job("Dummy JD", {"personal": {"fullName": "Test"}})
    print(f"AI Fallback Result: {json.dumps(res, indent=2)}")
    if "REDUCED_CAPABILITY_MODE" in res["analysis"]["explanation"]:
        print("✅ AI Fallback Successful.")

if __name__ == "__main__":
    asyncio.run(simulate_failures())
