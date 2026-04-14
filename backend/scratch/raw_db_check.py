import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def raw_check():
    url = os.getenv("DATABASE_URL")
    try:
        conn = psycopg2.connect(url)
        print("Raw connection successful!")
        conn.close()
    except Exception as e:
        print(f"Raw connection failed: {e}")

if __name__ == "__main__":
    raw_check()
