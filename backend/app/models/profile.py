from sqlalchemy import Column, String, Text, ForeignKey, Date, JSON, Float, Boolean, Integer, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base_class import Base

class Profile(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), unique=True, nullable=False)
    
    # 1. Personal Info (Singular)
    headline = Column(String, nullable=True) # e.g., "Full Stack Engineer | AI Enthusiast"
    summary = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    
    # 2. Social Links (Stored as JSON for flexibility)
    # { "github": "...", "linkedin": "...", "leetcode": "...", "portfolio": "..." }
    social_links = Column(JSON, default={})
    
    # 3. Skills (Categorized)
    # { "technical": ["Python", "React"], "interpersonal": ["Leadership"], "intrapersonal": ["Resilience"] }
    skills = Column(JSON, default={})

    # 4. Other ERP Sections (Singular/Simple)
    achievements = Column(JSON, default=[]) # List of strings
    interests = Column(JSON, default=[]) 
    languages = Column(JSON, default=[]) # [{lang: "English", level: "Native"}]
    
    # 5. Additional ERP Sections
    volunteer = Column(JSON, default=[]) 
    extracurricular = Column(JSON, default=[])
    recommendations = Column(JSON, default=[]) # Metadata for uploaded files
    
    # Relationships to Many-to-One tables
    user = relationship("User", back_populates="profile")
    education = relationship("Education", back_populates="profile", cascade="all, delete-orphan")
    experience = relationship("Experience", back_populates="profile", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="profile", cascade="all, delete-orphan")
    certifications = relationship("Certification", back_populates="profile", cascade="all, delete-orphan")
    versions = relationship("ProfileVersion", back_populates="profile", cascade="all, delete-orphan")

class Experience(Base):
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profile.id"))
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    location = Column(String, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_current = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    is_deleted = Column(Boolean, default=False)
    profile = relationship("Profile", back_populates="experience")

class Education(Base):
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profile.id"))
    institution = Column(String, nullable=False)
    degree = Column(String, nullable=False)
    field_of_study = Column(String, nullable=True)
    gpa = Column(Float, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_deleted = Column(Boolean, default=False)
    profile = relationship("Profile", back_populates="education")

class Project(Base):
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profile.id"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    link = Column(String, nullable=True)
    technologies = Column(JSON, default=[])
    is_deleted = Column(Boolean, default=False)
    profile = relationship("Profile", back_populates="projects")

class Certification(Base):
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profile.id"))
    name = Column(String, nullable=False)
    issuer = Column(String, nullable=False)
    issue_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    is_deleted = Column(Boolean, default=False)
    profile = relationship("Profile", back_populates="certifications")

class ProfileVersion(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profile.id"))
    data = Column(JSON, nullable=False) # JSON snapshot of erp_data
    version_number = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    version_label = Column(String, nullable=True)
    
    profile = relationship("Profile", back_populates="versions")
