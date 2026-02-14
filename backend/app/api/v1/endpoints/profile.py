from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.user import User
from app.models.profile import Profile, Experience, Education, Project, Certification
from app.api.v1.endpoints.auth import get_current_user
from app.services.linkedin_parser import LinkedInParser
from app.services.ai_parser import AIResumeParser
from datetime import datetime

router = APIRouter()

def parse_date(date_str):
    if not date_str or date_str.lower() in ["present", "current"]:
        return None
    try:
        # Try common formats
        for fmt in ("%Y-%m-%d", "%Y-%m", "%B %Y", "%b %Y"):
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        return None
    except:
        return None

@router.get("/me")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    try:
        profile = db.query(Profile).filter(Profile.user_id == current_user.id)\
            .options(
                joinedload(Profile.experience),
                joinedload(Profile.education),
                joinedload(Profile.projects),
                joinedload(Profile.certifications)
            ).first()

        if not profile:
            profile = Profile(user_id=current_user.id)
            db.add(profile)
            db.commit()
            db.refresh(profile)
        
        # Manually serialize the profile and its relationships
        return {
            "user_info": {
                "email": current_user.email,
                "full_name": current_user.full_name,
                "profile_image": current_user.profile_image
            },
            "erp_data": {
                "id": str(profile.id),
                "headline": profile.headline,
                "summary": profile.summary,
                "phone": profile.phone,
                "location": profile.location,
                "website": profile.website,
                "skills": profile.skills,
                "social_links": profile.social_links,
                "achievements": profile.achievements,
                "interests": profile.interests,
                "languages": profile.languages,
                "experience": [
                    {
                        "company": exp.company,
                        "role": exp.role,
                        "location": exp.location,
                        "startDate": str(exp.start_date) if exp.start_date else None,
                        "endDate": str(exp.end_date) if exp.end_date else None,
                        "isCurrent": exp.is_current,
                        "description": exp.description
                    } for exp in profile.experience
                ],
                "education": [
                    {
                        "institution": edu.institution,
                        "degree": edu.degree,
                        "fieldOfStudy": edu.field_of_study,
                        "gpa": edu.gpa,
                        "startDate": str(edu.start_date) if edu.start_date else None,
                        "endDate": str(edu.end_date) if edu.end_date else None
                    } for edu in profile.education
                ],
                "projects": [
                    {
                        "title": proj.title,
                        "description": proj.description,
                        "link": proj.link,
                        "technologies": proj.technologies
                    } for proj in profile.projects
                ],
                "certifications": [
                    {
                        "name": cert.name,
                        "issuer": cert.issuer,
                        "date": str(cert.issue_date) if cert.issue_date else None
                    } for cert in profile.certifications
                ]
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR fetching profile for {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/parse/linkedin")
async def parse_linkedin_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Loosen content type check as some browsers/OS send different strings
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")
    
    print(f"DEBUG: Starting LinkedIn parse for file: {file.filename}")
    try:
        contents = await file.read()
        print(f"DEBUG: File read successful, size: {len(contents)} bytes")
        result = await LinkedInParser.parse(contents)
        print(f"DEBUG: Parser result: {result}")
        if "error" in result:
            print(f"DEBUG: Parser returned error: {result['error']}")
            raise HTTPException(status_code=500, detail=f"LinkedIn Parser Error: {result['error']}")
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"CRITICAL ERROR in parse_linkedin_pdf: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error during LinkedIn parsing: {str(e)}")

@router.post("/parse/resume")
async def parse_resume_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
) -> Any:
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")
    
    try:
        contents = await file.read()
        result = await AIResumeParser.parse(contents)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"CRITICAL ERROR in parse_resume_pdf: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error during Resume parsing: {str(e)}")

@router.put("/me")
def update_profile(
    profile_data: Dict[str, Any], 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    print(f"DEBUG: Updating profile for user {current_user.email}")
    try:
        # 1. Get or create base profile
        profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
        if not profile:
            print("DEBUG: Creating new profile record")
            profile = Profile(user_id=current_user.id)
            db.add(profile)
            db.commit()
            db.refresh(profile)

        # 2. Update Personal Info
        personal = profile_data.get("personal", {})
        profile.headline = personal.get("headline")
        profile.summary = personal.get("summary")
        profile.phone = personal.get("phone")
        profile.location = personal.get("location")
        profile.website = personal.get("website")
        
        # Update User full_name if provided
        if personal.get("fullName"):
            current_user.full_name = personal.get("fullName")
            db.add(current_user)
        
        # 3. Update JSON fields
        profile.skills = profile_data.get("skills", {})
        profile.social_links = profile_data.get("socialLinks", {})
        profile.achievements = profile_data.get("achievements", [])
        
        # Merge hobbies/interests
        interests = profile_data.get("hobbies", [])
        if not interests:
            interests = profile_data.get("interests", [])
        profile.interests = interests
        
        profile.languages = profile_data.get("languages", [])
        profile.volunteer = profile_data.get("volunteer", [])
        profile.extracurricular = profile_data.get("extracurricular", [])
        profile.recommendations = profile_data.get("recommendations", [])

        print("DEBUG: Syncing related career sections...")
        
        # 4. Handle Experience
        db.query(Experience).filter(Experience.profile_id == profile.id).delete()
        for exp in profile_data.get("experience", []):
            new_exp = Experience(
                profile_id=profile.id,
                company=exp.get("company") or "Unknown",
                role=exp.get("role") or "Unknown",
                location=exp.get("location"),
                start_date=parse_date(exp.get("startDate")),
                end_date=parse_date(exp.get("endDate")),
                is_current=exp.get("isCurrent", False),
                description=exp.get("description")
            )
            db.add(new_exp)

        # 5. Handle Education
        db.query(Education).filter(Education.profile_id == profile.id).delete()
        for edu in profile_data.get("education", []):
            new_edu = Education(
                profile_id=profile.id,
                institution=edu.get("institution") or "Unknown",
                degree=edu.get("degree") or "Unknown",
                field_of_study=edu.get("fieldOfStudy"),
                start_date=parse_date(edu.get("startDate")),
                end_date=parse_date(edu.get("endDate"))
            )
            db.add(new_edu)

        # 6. Handle Projects
        db.query(Project).filter(Project.profile_id == profile.id).delete()
        for proj in profile_data.get("projects", []):
            new_proj = Project(
                profile_id=profile.id,
                title=proj.get("title") or "Untitled Project",
                description=proj.get("description"),
                link=proj.get("link"),
                technologies=proj.get("technologies", [])
            )
            db.add(new_proj)

        # 7. Handle Certifications
        db.query(Certification).filter(Certification.profile_id == profile.id).delete()
        for cert in profile_data.get("certifications", []):
            new_cert = Certification(
                profile_id=profile.id,
                name=cert.get("name") or "Unnamed Certification",
                issuer=cert.get("issuer") or "Unknown",
                issue_date=parse_date(cert.get("date")),
            )
            db.add(new_cert)

        db.commit()
        print("DEBUG: Profile update successful")
        return {"message": "Career Identity ERP Finalized"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.rollback()
        error_msg = str(e)
        print(f"ERROR: Profile update failed: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)
