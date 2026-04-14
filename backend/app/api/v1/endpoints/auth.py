from datetime import datetime, timedelta, timezone
from typing import Any, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, Token, OTPVerify, OTPResend
from app.core import security
from app.core.config import settings
from app.utils.otp import generate_otp, get_otp_expiration
from app.utils.email import send_otp_email, send_reset_email
from app.services.audit import AuditLogger


router = APIRouter()
reusable_oauth2 = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login/email")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=403, detail="Could not validate credentials")
    except JWTError:
        raise HTTPException(status_code=403, detail="Could not validate credentials")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/signup/email", response_model=UserOut)
def signup_by_email(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    otp = generate_otp()
    new_user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        otp_code=otp,
        otp_expires_at=get_otp_expiration()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Send real email
    send_otp_email(new_user.email, otp)
    
    AuditLogger.log(db, "AUTHENTICATION", "SIGNUP_INITIATED", user_id=new_user.id, metadata={"email": new_user.email})
    
    print(f"DEBUG: OTP for {new_user.email} is {otp}")
    return new_user


@router.post("/verify-otp")
def verify_otp(otp_in: OTPVerify, db: Session = Depends(get_db)) -> Any:
    user = db.query(User).filter(User.email == otp_in.email).first()
    if not user or user.otp_code != otp_in.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    user.is_verified = True
    user.otp_code = None
    db.commit()
    
    # Generate token for auto-login
    access_token = security.create_access_token(user.id)
    AuditLogger.log(db, "AUTHENTICATION", "OTP_VERIFIED", user_id=user.id)
    return {"message": "Verified", "access_token": access_token, "token_type": "bearer"}


@router.post("/login/email", response_model=Token)
def login_by_email(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not security.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_verified:
        AuditLogger.log(db, "AUTHENTICATION", "LOGIN_FAILED_UNVERIFIED", user_id=user.id, status="FAILURE")
        raise HTTPException(status_code=403, detail="Verify email first")
    
    AuditLogger.log(db, "AUTHENTICATION", "LOGIN_SUCCESS", user_id=user.id)
    return {"access_token": security.create_access_token(user.id), "token_type": "bearer"}


@router.post("/resend-otp")
def resend_otp(resend_in: OTPResend, db: Session = Depends(get_db)) -> Any:
    user = db.query(User).filter(User.email == resend_in.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    otp = generate_otp()
    user.otp_code = otp
    user.otp_expires_at = get_otp_expiration()
    db.commit()
    
    # Send real email
    send_otp_email(user.email, otp)
    
    print(f"DEBUG: Resent OTP for {user.email} is {otp}")
    return {"message": "OTP Resent"}

from app.schemas.user import ForgotPassword, ResetPassword

@router.post("/forgot-password")
def forgot_password(forgot_in: ForgotPassword, db: Session = Depends(get_db)) -> Any:
    user = db.query(User).filter(User.email == forgot_in.email).first()
    if not user:
        # For security, don't reveal if user exists. 
        # But in development, we'll return an error for now to help the user.
        raise HTTPException(status_code=404, detail="User with this email not found")
    
    otp = generate_otp()
    user.otp_code = otp
    user.otp_expires_at = get_otp_expiration()
    db.commit()
    
    # Send real email
    send_reset_email(user.email, otp)
    
    print(f"DEBUG: Reset OTP for {user.email} is {otp}")
    return {"message": "Password reset code sent to email"}

@router.post("/reset-password")
def reset_password(reset_in: ResetPassword, db: Session = Depends(get_db)) -> Any:
    user = db.query(User).filter(User.email == reset_in.email).first()
    if not user or user.otp_code != reset_in.otp:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    if user.otp_expires_at and user.otp_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset code expired")
    
    user.hashed_password = security.get_password_hash(reset_in.new_password)
    user.otp_code = None
    user.is_verified = True # Resetting password also confirms email ownership
    db.commit()
    return {"message": "Password reset successfully"}

@router.get("/oauth/google/login")
def google_login():
    url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={settings.GOOGLE_CLIENT_ID}&response_type=code&scope=openid%20email%20profile&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
    print(f"DEBUG: Redirecting to Google Auth URL: {url}")
    return RedirectResponse(url=url)

@router.get("/oauth/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    print(f"DEBUG: Received Google callback code: {code[:10]}...")
    async with httpx.AsyncClient() as client:
        # Step 1: Exchange code for access token
        print("DEBUG: Attempting to exchange code for token...")
        token_data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        t_res = await client.post("https://oauth2.googleapis.com/token", data=token_data)
        
        if t_res.status_code != 200:
            print(f"DEBUG: Token exchange failed with status {t_res.status_code}")
            print(f"DEBUG: Error response: {t_res.text}")
            raise HTTPException(status_code=400, detail=f"Google token exchange failed: {t_res.text}")

        token_json = t_res.json()
        token = token_json.get("access_token")
        print(f"DEBUG: Successfully obtained access token: {token[:10]}...")

        # Step 2: Get user information
        print("DEBUG: Attempting to fetch user info from Google...")
        u_res = await client.get("https://www.googleapis.com/oauth2/v3/userinfo", headers={"Authorization": f"Bearer {token}"})
        
        if u_res.status_code != 200:
            print(f"DEBUG: User info fetch failed with status {u_res.status_code}")
            print(f"DEBUG: Error response: {u_res.text}")
            raise HTTPException(status_code=400, detail=f"Google user info fetch failed: {u_res.text}")

        info = u_res.json()
        print(f"DEBUG: Successfully fetched user info for email: {info.get('email')}")

    # Step 3: Find or create user
    user = db.query(User).filter(User.email == info["email"]).first()
    if not user:
        print(f"DEBUG: Creating new user for {info['email']}")
        user = User(
            email=info["email"], 
            full_name=info.get("name"), 
            google_id=info.get("sub"), 
            profile_image=info.get("picture"), 
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        print(f"DEBUG: Existing user found for {info['email']}")
    
    jwt_token = security.create_access_token(user.id)
    redirect_url = f"http://localhost:5173/login?token={jwt_token}"
    print(f"DEBUG: Redirecting back to frontend: {redirect_url[:40]}...")
    return RedirectResponse(url=redirect_url)
