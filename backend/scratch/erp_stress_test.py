import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

async def stress_test():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("--- STARTING ERP STRESS TEST 2.0 ---")
        
        # 1. AUTH
        login_res = await client.post(f"{BASE_URL}/auth/login/email", json={"email": "audit_161068@test.com", "password": "SecurityAudit!123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # --- 1. VERSION RACE CONDITION ---
        print("\n[1] Testing Version Race Condition...")
        tasks = [
            client.put(f"{BASE_URL}/profile/me", json={"personal": {"headline": f"RACE_{i}"}}, headers=headers)
            for i in range(5)
        ]
        results = await asyncio.gather(*tasks)
        print(f"  Concurrency Responses: {[r.status_code for r in results]}")
        
        v_res = await client.get(f"{BASE_URL}/profile/versions", headers=headers)
        versions = v_res.json()
        print(f"  Versions count after race: {len(versions)}")

        # --- 2. RESTORE + UPDATE COLLISION ---
        print("\n[2] Testing Restore + Update Collision...")
        v_old_id = versions[-1]["id"]
        r_task = client.post(f"{BASE_URL}/profile/version/{v_old_id}/restore", headers=headers)
        u_task = client.put(f"{BASE_URL}/profile/me", json={"personal": {"headline": "COLLISION_WINNER"}}, headers=headers)
        res = await asyncio.gather(r_task, u_task)
        print(f"  Final State Headline: {(await client.get(f'{BASE_URL}/profile/me', headers=headers)).json()['erp_data']['headline']}")

        # --- 3. MULTI-SOURCE MERGE ---
        print("\n[3] Testing Multi-Source Merge (No Duplicates)...")
        # Simulate simultaneous Resume Import and Manual Edit with overlapping data
        # Note: Both use PUT /profile/me
        data_a = {"experience": [{"company": "Google", "role": "SWE"}]}
        data_b = {"experience": [{"company": "Google", "role": "Senior SWE"}]} # same company, update
        
        await client.put(f"{BASE_URL}/profile/me", json=data_a, headers=headers)
        # Manually verify or simulate update
        p_data = (await client.get(f"{BASE_URL}/profile/me", headers=headers)).json()["erp_data"]
        exp_id = p_data["experience"][0]["id"]
        
        data_b["experience"][0]["id"] = exp_id # Simulate user editing existing entry
        await client.put(f"{BASE_URL}/profile/me", json=data_b, headers=headers)
        
        check_merge = (await client.get(f"{BASE_URL}/profile/me", headers=headers)).json()["erp_data"]
        print(f"  Exp count: {len(check_merge['experience'])}")
        print(f"  Role: {check_merge['experience'][0]['role']}")

        # --- 4. SOFT DELETE + DEEP RESTORE ---
        print("\n[4] Testing Soft Delete + Deep Restore...")
        await client.put(f"{BASE_URL}/profile/me", json={"experience": [{"company": "DEEP_TEST", "role": "RESTORE_ME"}]}, headers=headers)
        v_list = (await client.get(f"{BASE_URL}/profile/versions", headers=headers)).json()
        v_deep_id = v_list[0]["id"] # Latest after add
        
        await client.put(f"{BASE_URL}/profile/me", json={"experience": []}, headers=headers)
        print(f"  Exp count after delete: {len((await client.get(f'{BASE_URL}/profile/me', headers=headers)).json()['erp_data']['experience'])}")
        
        await client.post(f"{BASE_URL}/profile/version/{v_deep_id}/restore", headers=headers)
        reappear = (await client.get(f"{BASE_URL}/profile/me", headers=headers)).json()["erp_data"]["experience"]
        print(f"  Exp count after deep restore: {len(reappear)}")
        if len(reappear) > 0:
            print(f"  Restored Company: {reappear[0]['company']}")

        print("\n--- STRESS TEST 2.0 COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(stress_test())
