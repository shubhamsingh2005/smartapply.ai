import os
import redis.asyncio as redis
import asyncio
from typing import Optional, Any
from app.core.logging import get_logger

logger = get_logger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

class SafeCache:
    def __init__(self, url: str):
        self.redis = redis.from_url(url, encoding="utf-8", decode_responses=True, socket_timeout=2.0)

    async def get(self, key: str, retries: int = 1) -> Optional[str]:
        for attempt in range(retries + 1):
            try:
                return await self.redis.get(key)
            except Exception as e:
                if attempt == retries:
                    logger.warning(f"CACHE_MISS_FAIL: Redis GET failed after {retries} retries: {e}")
                    return None
                await asyncio.sleep(0.1)

    async def setex(self, key: str, seconds: int, value: str, retries: int = 1) -> bool:
        for attempt in range(retries + 1):
            try:
                await self.redis.setex(key, seconds, value)
                return True
            except Exception as e:
                if attempt == retries:
                    logger.warning(f"CACHE_SET_FAIL: Redis SETEX failed after {retries} retries: {e}")
                    return False
                await asyncio.sleep(0.1)

    async def delete(self, key: str, retries: int = 1) -> bool:
        for attempt in range(retries + 1):
            try:
                await self.redis.delete(key)
                return True
            except Exception as e:
                if attempt == retries:
                    logger.warning(f"CACHE_DEL_FAIL: Redis DELETE failed after {retries} retries: {e}")
                    return False
                await asyncio.sleep(0.1)

    async def ping(self) -> bool:
        try:
            return await self.redis.ping()
        except:
            return False

# Initialize Global Safe Cache Instance
cache = SafeCache(REDIS_URL)
async_redis = cache # For backward compatibility in code if needed

async def init_redis():
    if await cache.ping():
        logger.info("Successfully connected to Redis cache strategy.")
    else:
        logger.error("Failed to connect to Redis caching layer. Enabling graceful degradation.")
