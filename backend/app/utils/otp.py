import random
import string
from datetime import datetime, timedelta, timezone

def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP."""
    return "".join(random.choices(string.digits, k=length))

def get_otp_expiration(minutes: int = 10) -> datetime:
    """Get expiration time for OTP."""
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)
