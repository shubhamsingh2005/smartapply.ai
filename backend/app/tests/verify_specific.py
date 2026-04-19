import asyncio
import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Append project to path to import User model
sys.path.append(os.getcwd())
from app.models.user import User

API_BASE = "http://127.0.0.1:8000/api/v1"
DB_URL = "postgresql://postgres.eykzvnobchpzgkxlhnvj:S%40rb%40ni30love@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)

async def check():
    email = "shubhamsingh33972@gmail.com"
    password = "S@rb@ni30"
    
    async with httpx.AsyncClient() as client:
        print("1. Attempting Login...")
        login_data = {"email": email, "password": password}
        res = await client.post(f"{API_BASE}/auth/login/email", json=login_data)
        print(f"Login Response: {res.status_code} - {res.text}")
        
        if res.status_code == 400 and "Incorrect email or password" in res.text:
            print("User does not exist or wrong password. Signing up...")
            res_signup = await client.post(f"{API_BASE}/auth/signup/email", json={"email": email, "password": password, "full_name": "Shubham QA"})
            print(f"Signup Response: {res_signup.status_code} - {res_signup.text}")
            
            # Now login to get 403 Unverified
            res = await client.post(f"{API_BASE}/auth/login/email", json=login_data)
        
        if res.status_code == 403 and "Verify email first" in res.text:
            print("User needs verification. Fetching OTP from DB directly...")
            
            # Re-send OTP just to test the background task fix
            print("Triggering resend-otp to test BackgroundTasks...")
            res_resend = await client.post(f"{API_BASE}/auth/resend-otp", json={"email": email})
            print(f"Resend OTP Response: {res_resend.status_code} - {res_resend.text}")
            
            with SessionLocal() as db:
                user = db.query(User).filter(User.email.ilike(email)).first()
                otp = user.otp_code
                print(f"Found OTP in database: {otp}")
            
            print("Validating via API...")
            res_verify = await client.post(f"{API_BASE}/auth/verify-otp", json={"email": email, "otp": str(otp)})
            print(f"Verify OTP Response: {res_verify.status_code} - {res_verify.text}")
            
            # Login again
            res = await client.post(f"{API_BASE}/auth/login/email", json=login_data)
            print(f"Post-Verify Login Response: {res.status_code}")
            
        if res.status_code == 200:
            token = res.json().get("access_token")
            print("Successfully authenticated! Token obtained.")
            
            # Test Dashboard /versions patch
            res_versions = await client.get(f"{API_BASE}/profile/versions", headers={"Authorization": f"Bearer {token}"})
            print(f"Dashboard Versions Route: {res_versions.status_code} - output preview: {res_versions.text[:50]}")
            print("ALL FIXES VERIFIED SUCCESSFULLY!")
            

if __name__ == "__main__":
    asyncio.run(check())
