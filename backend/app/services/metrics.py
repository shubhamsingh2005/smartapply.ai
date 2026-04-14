from typing import Dict, Any

class ProfileMetricsService:
    @staticmethod
    def calculate_completion(profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Computes section-level and field-level completeness.
        """
        weights = {
            "personal": 0.25,
            "experience": 0.25,
            "education": 0.20,
            "skills": 0.15,
            "projects": 0.10,
            "social": 0.05
        }
        
        # Field definitions
        fields = {
            "personal": ["fullName", "headline", "summary", "location", "phone"],
            "social": ["linkedin", "github"]
        }
        
        scores = {}
        
        # 1. Personal
        personal = profile_data.get("personal", {})
        p_filled = sum(1 for f in fields["personal"] if personal.get(f))
        scores["personal"] = (p_filled / len(fields["personal"])) * 100
        
        # 2. Experience
        exp = profile_data.get("experience", [])
        scores["experience"] = min(len(exp) * 33.4, 100) # 3 items for 100%
        
        # 3. Education
        edu = profile_data.get("education", [])
        scores["education"] = min(len(edu) * 50, 100) # 2 items for 100%
        
        # 4. Skills
        skills = profile_data.get("skills", {})
        tech_skills = skills.get("technical", [])
        scores["skills"] = min(len(tech_skills) * 10, 100) # 10 skills for 100%
        
        # 5. Projects
        proj = profile_data.get("projects", [])
        scores["projects"] = min(len(proj) * 33.4, 100)
        
        # 6. Social
        social = profile_data.get("socialLinks", {})
        s_filled = sum(1 for f in fields["social"] if social.get(f))
        scores["social"] = (s_filled / len(fields["social"])) * 100
        
        # Weighted Overall
        overall = sum(scores[k] * weights[k] for k in weights)
        
        return {
            "score": round(overall, 1),
            "breakdown": {k: round(v, 1) for k, v in scores.items()}
        }
