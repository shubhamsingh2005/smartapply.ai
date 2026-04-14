import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def test_connection():
    url = os.getenv("DATABASE_URL")
    print(f"Testing connection to: {url.split('@')[1] if '@' in url else url}")
    
    # Try with sslmode=require if it fails
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("Connection successful! Result:", result.fetchone())
    except Exception as e:
        print(f"Standard connection failed: {e}")
        
        if "ssl" in str(e).lower():
            print("Detected SSL issue, trying with sslmode=require...")
            if "?" in url:
                url += "&sslmode=require"
            else:
                url += "?sslmode=require"
            
            try:
                engine = create_engine(url)
                with engine.connect() as conn:
                    result = conn.execute(text("SELECT 1"))
                    print("Connection successful with sslmode=require! Result:", result.fetchone())
            except Exception as e2:
                print(f"Connection with sslmode=require also failed: {e2}")

if __name__ == "__main__":
    test_connection()
