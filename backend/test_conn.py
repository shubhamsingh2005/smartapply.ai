
import sys
import os
from sqlalchemy import create_engine, text

# Get the database URL from .env or hardcoded
database_url = "postgresql://postgres.eykzvnobchpzgkxlhnvj:S%40rb%40ni30love@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"

print(f"Testing connection to: {database_url.split('@')[1]}")

try:
    engine = create_engine(database_url, connect_args={"connect_timeout": 5})
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        print(f"SUCCESS! DB Version: {result.fetchone()[0]}")
except Exception as e:
    print(f"FAILURE! Could not connect to database.")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    sys.exit(1)
