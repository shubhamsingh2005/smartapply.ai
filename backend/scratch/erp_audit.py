import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

async def run_erp_audit():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("--- STARTING CAREER ERP AUDIT (PHASE 2) ---")
        
        # 1. AUTH - Login to get token
        login_res = await client.post(f"{BASE_URL}/auth/login/email", json={"email": "audit_161068@test.com", "password": "SecurityAudit!123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. INITIAL STATE check
        print("\n[1] Checking Initial ERP State...")
        p_res = await client.get(f"{BASE_URL}/profile/me", headers=headers)
        # It returned 404 in previous session because no profile. Let's see if we can create one.
        
        # 3. CREATE FULL PROFILE (V1)
        print("\n[2] Creating Full Profile (Version 1)...")
        v1_data = {
            "personal": {"headline": "Auditor V1", "summary": "Initial Snapshot"},
            "skills": {"technical": ["Security", "Python"]},
            "experience": [{"company": "AuditCorp", "role": "Lead Auditor", "description": "Analyzing systems"}]
        }
        u1_res = await client.put(f"{BASE_URL}/profile/me", json=v1_data, headers=headers)
        if u1_res.status_code == 200:
            print("  Profile V1 Created.")
        
        # 4. UPDATE PARTIAL FIELD (V2) - Test Data Loss
        print("\n[3] Updating Partial Field (V2) - Testing Data Loss...")
        v2_data = {
            "personal": {"headline": "Auditor V2 (Updated)"}
        }
        # The current implementation of PUT /me in profile.py calls synchronize_profile(profile_data)
        # My repository upsert_profile(profile_data) uses profile_data.get("personal", {})
        # If I send ONLY personal, what happens to skills?
        # My Repo code: profile.skills = profile_data.get("skills", profile.skills) -> PERSISTS OLD
        await client.put(f"{BASE_URL}/profile/me", json=v2_data, headers=headers)
        
        # Verify Persistence
        v_check = await client.get(f"{BASE_URL}/profile/me", headers=headers)
        print(f"  Profile Get Debug: {v_check.status_code} - {v_check.text}")
        erp = v_check.json()["erp_data"]
        
        if erp["headline"] == "Auditor V2 (Updated)" and erp["skills"]["technical"] == ["Security", "Python"]:
            print("  Partial Update PASSED (No data loss).")
        else:
            print(f"  DATA LOSS DETECTED: {erp}")

        # 5. VERSIONING CHECK
        print("\n[4] Verifying Versioning History...")
        versions_res = await client.get(f"{BASE_URL}/profile/versions", headers=headers)
        versions = versions_res.json()
        print(f"  Total Versions Detected: {len(versions)}")
        if len(versions) >= 2:
            print("  Versioning Logic - PASS")
        else:
            print(f"  Versioning Logic - FAIL (Count: {len(versions)})")

        # 6. RESTORE CHECK
        if len(versions) >= 2:
            print("\n[5] Testing Version Restore...")
            v1_id = versions[-1]["id"] # oldest
            r_res = await client.post(f"{BASE_URL}/profile/version/{v1_id}/restore", headers=headers)
            if r_res.status_code == 200:
                # Check if restored
                res_check = await client.get(f"{BASE_URL}/profile/me", headers=headers)
                if res_check.json()["erp_data"]["headline"] == "Auditor V1":
                    print("  Version Restore - PASS")
                else:
                    print("  Version Restore - FAIL (Data mismatch)")

        # 7. METRICS CHECK
        print("\n[6] Checking Completeness Engine...")
        comp = v_check.json()["meta"]["completeness"]
        print(f"  Calculated Completeness: {comp['score']}%")
        if comp["score"] > 0:
            print("  Metrics Engine - PASS")
        else:
            print("  Metrics Engine - FAIL")

        print("\n--- ERP AUDIT COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(run_erp_audit())
