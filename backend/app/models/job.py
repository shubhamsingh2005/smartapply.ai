from sqlalchemy import Column, String, Text, ForeignKey, JSON, Integer, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.sql import func
from app.db.base_class import Base

class JobAnalysis(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    
    # Raw Data
    company_name = Column(String, nullable=True)
    job_title = Column(String, nullable=False)
    raw_description = Column(Text, nullable=False)
    
    # Intelligence (Parsed by AI)
    # { "skills": {"required": [], "preferred": []}, "experience_years": 0, "role_type": "" }
    parsed_requirements = Column(JSON, default={})
    
    # Comparison Analysis (Fit/Gap)
    # { "fit_score": 85, "matching_skills": [], "missing_skills": [], "explanation": "" }
    analysis_results = Column(JSON, default={})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="job_analyses")
