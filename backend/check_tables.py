from sqlalchemy import text
from app.db.session import engine

def check_all_tables():
    tables = ['experience', 'education', 'project', 'certification']
    with engine.connect() as conn:
        for table in tables:
            res = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}';"))
            existing_cols = [r[0] for r in res]
            print(f"Table '{table}' columns: {existing_cols}")
            
            if table == 'education' and 'gpa' not in existing_cols:
                print("Adding gpa to education...")
                conn.execute(text("ALTER TABLE education ADD COLUMN gpa FLOAT;"))
                conn.commit()

if __name__ == "__main__":
    check_all_tables()
