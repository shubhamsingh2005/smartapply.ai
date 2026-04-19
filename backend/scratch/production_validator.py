import asyncio
import httpx
import time
import random
import uuid
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
NUM_USERS = 15
TEST_DURATION_SEC = 600 # 10 mins (Audit duration within turn constraints)

# Global Metrics
METRICS = {
    "total_requests": 0,
    "success_count": 0,
    "error_count": 0,
    "latencies": [],
    "cache_hits": 0,
    "cache_misses": 0
}

async def user_session(user_id: int):
    email = f"loadtest_{user_id}_{uuid.uuid4().hex[:4]}@audit.com"
    password = "LoadTestPassword123!"
    headers = {}
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=60.0) as client:
        # 1. Login
        try:
            print(f"User {user_id} attempting login...")
            login_res = await client.post("/api/v1/auth/login/email", json={"email": "shubhamsingh33972@gmail.com", "password": "S@rb@ni30"})
            if login_res.status_code != 200:
                 print(f"User {user_id} login failed: {login_res.status_code} - {login_res.text}")
                 return
            
            token = login_res.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print(f"User {user_id} logged in successfully.")
        except Exception as e:
            print(f"Auth Setup Exception for user {user_id}: {e}")
            return

        start_time = time.time()
        while time.time() - start_time < TEST_DURATION_SEC:
            op_start = time.time()
            try:
                # ACTION 1: Fetch Profile (Caches hits/misses)
                res = await client.get("/api/v1/profile/me", headers=headers)
                METRICS["total_requests"] += 1
                if res.status_code == 200:
                    METRICS["success_count"] += 1
                else:
                    METRICS["error_count"] += 1
                
                # ACTION 2: Update Profile (Invalidates cache)
                await client.put("/api/v1/profile/me", headers=headers, json={"personal": {"headline": f"Load Test {random.random()}"}})
                
                # ACTION 3: AI Analysis (Stress AI simulation + network)
                await client.post("/api/v1/ai/analyze-match", headers=headers, json={"jd_text": "Looking for a resilient engineer who survives stress tests."})
                
                METRICS["latencies"].append(time.time() - op_start)
                
            except Exception as e:
                METRICS["error_count"] += 1
                METRICS["latencies"].append(time.time() - op_start)
            
            await asyncio.sleep(random.uniform(0.5, 2.0))

async def main():
    print(f"--- STARTING PRODUCTION VALIDATION ---")
    print("Waiting 10s for server warm-up...")
    await asyncio.sleep(10)
    print(f"Concurrency: {NUM_USERS} users")
    print(f"Target Duration: {TEST_DURATION_SEC}s")
    
    start = time.time()
    await asyncio.gather(*[user_session(i) for i in range(NUM_USERS)])
    duration = time.time() - start
    
    avg_lat = sum(METRICS["latencies"]) / len(METRICS["latencies"]) if METRICS["latencies"] else 0
    
    print("\n--- FINAL AUDIT METRICS ---")
    print(f"Total Requests: {METRICS['total_requests']}")
    print(f"Success Rate: {(METRICS['success_count']/METRICS['total_requests'])*100:.2f}%")
    print(f"Error Count: {METRICS['error_count']}")
    print(f"Avg Latency: {avg_lat:.3f}s")
    print(f"Total Test Time: {duration:.2f}s")

if __name__ == "__main__":
    asyncio.run(main())
