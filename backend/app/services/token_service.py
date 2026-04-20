from typing import Optional, Tuple
from jose import jwt, JWTError
from app.core import security
from app.core.config import settings
from app.core.redis_client import cache
from app.core.logging import get_logger

logger = get_logger(__name__)

class TokenService:
    @staticmethod
    async def create_session_tokens(user_id: str) -> dict:
        """Creates both access and refresh tokens."""
        access_token, a_jti = security.create_access_token(user_id)
        refresh_token, r_jti = security.create_refresh_token(user_id)
        
        # We don't necessarily need to store the JTI in Redis on creation, 
        # only on blacklist. But for refresh rotation, we track the refresh JTI.
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    @staticmethod
    async def blacklist_token(jti: str, exp_seconds: int):
        """Adds a JTI to the blacklist."""
        await cache.set(f"blacklist:{jti}", "1", exp=exp_seconds)
        logger.info(f"Token blacklisted: {jti}")

    @staticmethod
    async def is_blacklisted(jti: str) -> bool:
        """Checks if a JTI is blacklisted."""
        return await cache.get(f"blacklist:{jti}") is not None

    @staticmethod
    async def rotate_refresh_token(refresh_token: str) -> dict:
        """Validates old refresh token, invalidates it, and issues new ones."""
        try:
            payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != "refresh":
                raise ValueError("Invalid token type")
            
            user_id = payload.get("sub")
            jti = payload.get("jti")
            exp = payload.get("exp")
            
            if await TokenService.is_blacklisted(jti):
                logger.warning(f"Refresh token reuse attempt detected for user {user_id}")
                raise ValueError("Token has been revoked")
            
            # Invalidate old refresh token (Rotation)
            # Calculate remaining time for blacklist
            import time
            rem = int(exp - time.time())
            if rem > 0:
                await TokenService.blacklist_token(jti, rem)
            
            # Issue new ones
            return await TokenService.create_session_tokens(user_id)
            
        except JWTError:
            raise ValueError("Invalid refresh token")
