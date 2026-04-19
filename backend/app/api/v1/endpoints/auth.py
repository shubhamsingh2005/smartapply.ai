from datetime import datetime, timedelta, timezone
from typing import Any, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from app.core.limiter import limiter
from app.core.exceptions import AuthenticationError, DatabaseIntegrityError
from app.core.logging import get_logger

logger = get_logger(__name__)
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
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

async def get_current_user(db: AsyncSession = Depends(get_db), token: str = Depends(reusable_oauth2)) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=403, detail="Could not validate credentials")
    except JWTError:
        raise HTTPException(status_code=403, detail="Could not validate credentials")
    
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/signup/email", response_model=UserOut)
@limiter.limit("5/minute")
async def signup_by_email(request: Request, user_in: UserCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)) -> Any:
    logger.info(f"Signup attempt initiated for IP: {request.client.host}")
    clean_email = user_in.email.strip().lower()
    result = await db.execute(select(User).filter(User.email.ilike(clean_email)))
    user = result.scalars().first()
    if user:
        raise DatabaseIntegrityError(detail="User already exists")
    
    otp = generate_otp()
    new_user = User(
        email=clean_email,
        hashed_password=security.get_password_hash(user_in.password),
        otp_code=otp,
        otp_expires_at=get_otp_expiration()
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Send real email via background task
    background_tasks.add_task(send_otp_email, new_user.email, otp)
    
    await AuditLogger.log(db, "AUTHENTICATION", "SIGNUP_INITIATED", user_id=new_user.id, metadata={"email": new_user.email})
    
    print(f"DEBUG: OTP for {new_user.email} is {otp}")
    return new_user


@router.post("/verify-otp")
@limiter.limit("10/minute")
async def verify_otp(request: Request, otp_in: OTPVerify, db: AsyncSession = Depends(get_db)) -> Any:
    clean_email = otp_in.email.strip().lower()
    result = await db.execute(select(User).filter(User.email.ilike(clean_email)))
    user = result.scalars().first()
    if not user or str(user.otp_code).strip() != str(otp_in.otp).strip():
        raise AuthenticationError(detail="Invalid OTP")
    
    user.is_verified = True
    user.otp_code = None
    await db.commit()
    
    # Generate token for auto-login
    access_token = security.create_access_token(user.id)
    await AuditLogger.log(db, "AUTHENTICATION", "OTP_VERIFIED", user_id=user.id)
    return {"message": "Verified", "access_token": access_token, "token_type": "bearer"}


@router.post("/login/email", response_model=Token)
@limiter.limit("10/minute")
async def login_by_email(request: Request, user_in: UserCreate, db: AsyncSession = Depends(get_db)) -> Any:
    clean_email = user_in.email.strip().lower()
    result = await db.execute(select(User).filter(User.email.ilike(clean_email)))
    user = result.scalars().first()
    if not user or not security.verify_password(user_in.password, user.hashed_password):
        raise AuthenticationError(detail="Incorrect email or password")
    if not user.is_verified:
        await AuditLogger.log(db, "AUTHENTICATION", "LOGIN_FAILED_UNVERIFIED", user_id=user.id, status="FAILURE")
        raise AuthenticationError(detail="Verify email first")
    
    await AuditLogger.log(db, "AUTHENTICATION", "LOGIN_SUCCESS", user_id=user.id)
    return {"access_token": security.create_access_token(user.id), "token_type": "bearer"}


@router.post("/resend-otp")
async def resend_otp(resend_in: OTPResend, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)) -> Any:
    clean_email = resend_in.email.strip().lower()
    result = await db.execute(select(User).filter(User.email.ilike(clean_email)))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    otp = generate_otp()
    user.otp_code = otp
    user.otp_expires_at = get_otp_expiration()
    await db.commit()
    
    # Send real email via background task
    background_tasks.add_task(send_otp_email, user.email, otp)
    
    print(f"DEBUG: Resent OTP for {user.email} is {otp}")
    return {"message": "OTP Resent"}

from app.schemas.user import ForgotPassword, ResetPassword

@router.post("/forgot-password")
async def forgot_password(forgot_in: ForgotPassword, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)) -> Any:
    clean_email = forgot_in.email.strip().lower()
    result = await db.execute(select(User).filter(User.email.ilike(clean_email)))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")
    
    otp = generate_otp()
    user.otp_code = otp
    user.otp_expires_at = get_otp_expiration()
    await db.commit()
    
    background_tasks.add_task(send_reset_email, user.email, otp)
    return {"message": "Password reset code sent to email"}

@router.post("/reset-password")
async def reset_password(reset_in: ResetPassword, db: AsyncSession = Depends(get_db)) -> Any:
    clean_email = reset_in.email.strip().lower()
    result = await db.execute(select(User).filter(User.email.ilike(clean_email)))
    user = result.scalars().first()
    if not user or str(user.otp_code).strip() != str(reset_in.otp).strip():
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    if user.otp_expires_at and user.otp_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset code expired")
    
    user.hashed_password = security.get_password_hash(reset_in.new_password)
    user.otp_code = None
    user.is_verified = True
    await db.commit()
    return {"message": "Password reset successfully"}

@router.get("/oauth/google/login")
async def google_login():
    url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={settings.GOOGLE_CLIENT_ID}&response_type=code&scope=openid%20email%20profile&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
    return RedirectResponse(url=url)

@router.get("/oauth/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        token_data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        t_res = await client.post("https://oauth2.googleapis.com/token", data=token_data)
        if t_res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Google token exchange failed: {t_res.text}")

        token_json = t_res.json()
        token = token_json.get("access_token")
        u_res = await client.get("https://www.googleapis.com/oauth2/v3/userinfo", headers={"Authorization": f"Bearer {token}"})
        if u_res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Google user info fetch failed: {u_res.text}")

        info = u_res.json()

    result = await db.execute(select(User).filter(User.email == info["email"]))
    user = result.scalars().first()
    if not user:
        user = User(
            email=info["email"], 
            full_name=info.get("name"), 
            google_id=info.get("sub"), 
            profile_image=info.get("picture"), 
            is_verified=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    jwt_token = security.create_access_token(user.id)
    return RedirectResponse(url=f"http://localhost:5173/login?token={jwt_token}")
