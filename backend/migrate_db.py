from sqlalchemy import text
from app.db.session import engine

def migrate():
    cols_to_add = [
        ("volunteer", "JSON", "[]"),
        ("extracurricular", "JSON", "[]"),
        ("recommendations", "JSON", "[]"),
        ("social_links", "JSON", "{}"),
        ("skills", "JSON", "{}"),
        ("achievements", "JSON", "[]"),
        ("interests", "JSON", "[]"),
        ("languages", "JSON", "[]"),
    ]
    
    with engine.connect() as conn:
        # Get existing columns
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'profile';"))
        existing_cols = [r[0] for r in res]
        print(f"Current columns: {existing_cols}")
        
        for col, type_, default in cols_to_add:
            if col not in existing_cols:
                print(f"Adding {col}...")
                try:
                    conn.execute(text(f"ALTER TABLE profile ADD COLUMN {col} {type_} DEFAULT '{default}'::json;"))
                    conn.commit()
                except Exception as e:
                    print(f"Failed to add {col}: {e}")
        
        print("Migration check complete.")

if __name__ == "__main__":
    migrate()
