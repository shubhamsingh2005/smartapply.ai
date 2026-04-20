import asyncio
import httpx
import json
from jose import jwt

BASE_URL = "http://localhost:8000/api/v1"
SECRET_KEY = "super-secret" # Matching settings.SECRET_KEY in code
ALGORITHM = "HS256"

async def validate_session():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("--- VALIDATING 10/10 AUTH UPGRADE ---")
        
        # 1. Signup / Verification simulated to get tokens
        # We'll use the user from previous audit
        email = "audit_161068@test.com"
        password = "SecurityAudit!123"
        
        print("\n[1] Testing Login for Dual Tokens...")
        l_res = await client.post(f"{BASE_URL}/auth/login/email", json={"email": email, "password": password})
        print(f"  Login Debug: {l_res.status_code} - {l_res.text}")
        if l_res.status_code == 200:
            tokens = l_res.json()
            access = tokens["access_token"]
            refresh = tokens["refresh_token"]
            print("  Dual tokens issued - PASS")
            
            # Check JTI in access
            payload = jwt.decode(access, SECRET_KEY, options={"verify_signature": False})
            if "jti" in payload and payload.get("type") == "access":
                 print(f"  Access JTI: {payload['jti']} - PASS")
            
            # 2. Testing Refresh
            print("\n[2] Testing Token Refresh (Rotation)...")
            r_res = await client.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": refresh})
            if r_res.status_code == 200:
                new_tokens = r_res.json()
                print("  Refresh success - PASS")
                
                # Verify rotation - Old refresh should now be blacklisted
                print("\n[3] Testing Refresh Token Rotation (Reuse prevention)...")
                ru_res = await client.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": refresh})
                if ru_res.status_code == 401 or "revoked" in ru_res.text:
                    print("  Old refresh token reuse blocked - PASS")
                else:
                    print(f"  VULNERABILITY: Old refresh token still worked! {ru_res.status_code}")
            
            # 4. Testing Logout Invalidation
            print("\n[4] Testing Logout Invalidation...")
            new_access = new_tokens["access_token"]
            logout_res = await client.post(f"{BASE_URL}/auth/logout", headers={"Authorization": f"Bearer {new_access}"})
            if logout_res.status_code == 200:
                print("  Logout success.")
                # Try to use same token again
                print("  Testing blacklisted token access...")
                a_res = await client.get(f"{BASE_URL}/profile/me", headers={"Authorization": f"Bearer {new_access}"})
                if a_res.status_code == 403 or "revoked" in a_res.text:
                    print("  Blacklisted token rejected - PASS")
                else:
                    print(f"  VULNERABILITY: Logged out token still worked! {a_res.status_code}")

        print("\n--- UPGRADE VALIDATION COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(validate_session())
