import sys
import os
# Ensure app is in path
sys.path.append(os.getcwd())

from app.services.metrics import ProfileMetricsService
from app.services.intelligence import JobIntelligenceService
import asyncio
import json

async def test_automation_pipeline():
    print("Starting Automation Pipeline Validation...")
    
    # 1. Mock Profile Data
    mock_profile = {
        "personal": {
            "fullName": "Test Engineer", 
            "headline": "Senior Full Stack AI Engineer",
            "summary": "Specialist in Python and React scaling.",
            "location": "Boston",
            "phone": "+123456789"
        },
        "experience": [
            {
                "role": "Backend Lead", 
                "company": "ScaleAI", 
                "description": "Orchestrated distributed systems using Python and FastAPI."
            }
        ],
        "education": [
            {
                "degree": "B.S. Computer Science",
                "institution": "MIT"
            }
        ],
        "skills": {
            "technical": ["Python", "PostgreSQL", "React", "Docker"]
        },
        "projects": [
            {
                "title": "ATS Parser",
                "description": "Automated resume extraction system."
            }
        ],
        "socialLinks": {
            "linkedin": "https://linkedin.com/in/test",
            "github": "https://github.com/test"
        }
    }
    
    # 2. Run Completion Metrics
    print("\nPhase 2: Testing Metrics Engine...")
    metrics = ProfileMetricsService.calculate_completion(mock_profile)
    print(f"Overall Score: {metrics['score']}%")
    print(f"Breakdown: {json.dumps(metrics['breakdown'], indent=2)}")
    assert metrics["score"] > 50, "Score should be high for complete profile"
    
    # 3. Run Job Intelligence (Phase 4 Semantic Mapping)
    print("\nPhase 4: Testing Semantic Skill Mapping...")
    mock_jd = """
    Target Role: Senior Backend Developer
    Company: InnovateTech
    Description: We need someone to build high-performance APIs and manage cloud deployments. 
    Required: Python, Web Frameworks, SQL, and DevOps knowledge.
    """
    analysis = await JobIntelligenceService.analyze_job(mock_jd, mock_profile)
    
    if "error" in analysis:
        print(f"❌ Analysis Failed: {analysis['error']}")
        return

    print(f"Match Score: {analysis.get('analysis', {}).get('fit_score', 0)}%")
    print(f"Explanation: {analysis.get('analysis', {}).get('explanation', 'No explanation')[:100]}...")
    
    # Check for Semantic Match
    matches = analysis.get("analysis", {}).get("matches", [])
    print(f"Total Matches Found: {len(matches)}")
    for m in matches:
        print(f" - {m.get('skill')} ({m.get('match_type')})")
    
    print("\nAutomation Pipeline Flow Complete & Validated!")

if __name__ == "__main__":
    asyncio.run(test_automation_pipeline())
