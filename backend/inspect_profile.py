from sqlalchemy import text
from app.db.session import engine
import json

def debug_profile():
    with engine.connect() as conn:
        try:
            # Check for the latest user
            user_res = conn.execute(text("SELECT id, email FROM \"user\" ORDER BY created_at DESC LIMIT 1;"))
            user = user_res.fetchone()
            if not user:
                print("No users found.")
                return
            
            user_id, email = user
            print(f"Checking profile for user: {email} ({user_id})")
            
            # Check profile
            prof_res = conn.execute(text(f"SELECT * FROM profile WHERE user_id = '{user_id}';"))
            profile = prof_res.fetchone()
            if not profile:
                print("No profile found for this user.")
                return
            
            # Print columns and values
            cols = prof_res.keys()
            for col, val in zip(cols, profile):
                print(f"{col}: {val}")
                
            # Check related tables
            for table in ['experience', 'education', 'project', 'certification']:
                count_res = conn.execute(text(f"SELECT COUNT(*) FROM {table} WHERE profile_id = '{profile.id}';"))
                count = count_res.scalar()
                print(f"Table '{table}' row count: {count}")
                
        except Exception as e:
            print(f"Debug failed: {e}")

if __name__ == "__main__":
    debug_profile()
