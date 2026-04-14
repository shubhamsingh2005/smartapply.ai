from typing import Dict, Any

class RelevanceScoringService:
    @staticmethod
    def calculate_relevance(analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Computes the final Job Relevance Score using a hybrid 
        Rule-Based + AI context engine (Phase 5).
        """
        # Weights for Phase 5 scoring
        WEIGHTS = {
            "skill_overlap": 0.45,
            "experience_alignment": 0.35,
            "contextual_fit": 0.20
        }
        
        # 1. Skill Overlap (0-100)
        # Based on explicit matches vs gaps extracted by AI
        matches = len(analysis_data.get("analysis", {}).get("matches", []))
        gaps = len(analysis_data.get("analysis", {}).get("gaps", {}).get("explicit", []))
        total_skills = matches + gaps
        skill_score = (matches / total_skills * 100) if total_skills > 0 else 50 # Neutral if no data
        
        # 2. Experience Alignment (0-100)
        # Derived from AI's initial fit score and confidence mapping
        exp_score = analysis_data.get("analysis", {}).get("fit_score", 0)
        
        # 3. Contextual Fit (0-100)
        # Based on implied gaps. Implied gaps represent 'higher dimension' misses.
        implied_gaps = len(analysis_data.get("analysis", {}).get("gaps", {}).get("implied", []))
        context_score = max(100 - (implied_gaps * 10), 0)
        
        # Weighted Aggregation
        final_score = (
            (skill_score * WEIGHTS["skill_overlap"]) +
            (exp_score * WEIGHTS["experience_alignment"]) +
            (context_score * WEIGHTS["contextual_fit"])
        )
        
        # Threshold Interpretation
        level = "LOW"
        color = "#cf222e" # Red
        if final_score >= 85:
            level = "EXCEPTIONAL"
            color = "#238636" # Deep Green
        elif final_score >= 70:
            level = "STRONG"
            color = "#2da44e" # Green
        elif final_score >= 45:
            level = "MODERATE"
            color = "#d29922" # Orange/Gold
            
        return {
            "relevance_score": round(final_score, 1),
            "level": level,
            "color": color,
            "breakdown": {
                "skill_overlap": round(skill_score, 1),
                "experience_alignment": round(exp_score, 1),
                "contextual_fit": round(context_score, 1)
            }
        }
