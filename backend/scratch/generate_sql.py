import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.base_class import Base
from app.models.user import User
from app.models.profile import Profile, Education, Experience, Project, Certification, ProfileVersion
from app.models.job import JobAnalysis
from app.models.audit import AuditLog
from sqlalchemy.schema import CreateTable
from sqlalchemy import create_engine

# Mock engine for SQL generation
engine = create_engine('postgresql://')

def generate_sql():
    # Sort tables by dependency
    for table in Base.metadata.sorted_tables:
        print(f"-- Table: {table.name}")
        print(CreateTable(table).compile(engine))
        print(";")

if __name__ == "__main__":
    generate_sql()
