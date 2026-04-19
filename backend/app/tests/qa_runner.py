import asyncio
import httpx
import uuid
import sys
from typing import Dict, Any

API_BASE = "http://127.0.0.1:8000/api/v1"

results = {
    "Phase 1": {"status": "Pending", "errors": []},
    "Phase 2": {"status": "Pending", "errors": []},
    "Phase 4_5": {"status": "Pending", "errors": []},
    "Phase 7": {"status": "Pending", "errors": []}
}

async def run_qa():
    test_email = f"qa_test_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "SecurePassword123!"
    token = None
    
    async with httpx.AsyncClient() as client:
        # ----------------------------------------------------
        # PHASE 1: AUTHENTICATION
        # ----------------------------------------------------
        try:
            # 1. Signup
            signup_payload = {"email": test_email, "password": test_password, "full_name": "QA Tester"}
            res = await client.post(f"{API_BASE}/auth/signup/email", json=signup_payload, timeout=15.0)
            if res.status_code != 200:
                results["Phase 1"]["errors"].append(f"Signup failed: {res.status_code} - {res.text}")
            
            # Since OTP blocks login, let's see if we can bypass or see the error
            # 2. Login
            login_data = {"username": test_email, "password": test_password}
            res_login = await client.post(f"{API_BASE}/auth/login/access-token", data=login_data, timeout=5.0)
            if res_login.status_code == 200:
                token = res_login.json().get("access_token")
                results["Phase 1"]["status"] = "Pass"
            else:
                results["Phase 1"]["errors"].append(f"Login failed: {res_login.status_code} - {res_login.text}")
                results["Phase 1"]["status"] = "Fail"
                
        except Exception as e:
            import traceback
            results["Phase 1"]["errors"].append(traceback.format_exc())
            results["Phase 1"]["status"] = "Fail"

        # If Auth fails, we can't legitimately test authenticated routes with the new user.
        # We will attempt to fetch data anyway to see if unauth is blocked properly.
        # ----------------------------------------------------
        # PHASE 2: CAREER PROFILE 
        # ----------------------------------------------------
        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            res_profile = await client.get(f"{API_BASE}/profile/active", headers=headers)
            if token and res_profile.status_code == 200:
                results["Phase 2"]["status"] = "Pass"
            elif not token and res_profile.status_code in [401, 403]:
                # Unauthorized block works
                results["Phase 2"]["status"] = "Auth Block Validated"
            else:
                results["Phase 2"]["errors"].append(f"Profile active: {res_profile.status_code} - {res_profile.text}")
                results["Phase 2"]["status"] = "Fail"
        except Exception as e:
            results["Phase 2"]["errors"].append(str(e))
            results["Phase 2"]["status"] = "Fail"
            
        # ----------------------------------------------------
        # PHASE 7: AUTOMATION ENGINE
        # ----------------------------------------------------
        try:
            res_auto = await client.post(f"{API_BASE}/automation/start", headers=headers, json={
                "job_url": "https://example.com/job",
                "erp_data": {},
                "assets": {}
            })
            if token and res_auto.status_code == 200:
                results["Phase 7"]["status"] = "Pass"
            elif not token and res_auto.status_code in [401, 403]:
                results["Phase 7"]["status"] = "Auth Block Validated"
            else:
                results["Phase 7"]["errors"].append(f"Automation Start: {res_auto.status_code} - {res_auto.text}")
                results["Phase 7"]["status"] = "Fail"
        except Exception as e:
            import traceback
            results["Phase 7"]["errors"].append(traceback.format_exc())
            results["Phase 7"]["status"] = "Fail"

    for p, v in results.items():
        print(f"[{p}] Status: {v['status']}")
        if v['errors']:
            for err in v['errors']:
                print(f"    - ERROR: {err}")

if __name__ == "__main__":
    asyncio.run(run_qa())
