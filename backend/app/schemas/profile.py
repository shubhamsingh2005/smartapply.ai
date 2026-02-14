from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import date

class ExperienceBase(BaseModel):
    company: str
    role: str
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    description: Optional[str] = None

class EducationBase(BaseModel):
    institution: str
    degree: str
    field_of_study: Optional[str] = None
    gpa: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    link: Optional[str] = None
    technologies: List[str] = []

class ProfileUpdate(BaseModel):
    # Personal
    headline: Optional[str] = None
    summary: Optional[Text] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    
    # Complex Fields
    social_links: Dict[str, str] = {}
    skills: Dict[str, List[str]] = {}
    achievements: List[str] = []
    interests: List[str] = []
    languages: List[Dict[str, str]] = []
    
    # Relationships
    experience: List[ExperienceBase] = []
    education: List[EducationBase] = []
    projects: List[ProjectBase] = []
