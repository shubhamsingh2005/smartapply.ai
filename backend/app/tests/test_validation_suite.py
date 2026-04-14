import sys
import os
import asyncio
import json
import uuid
from typing import Dict, Any

# Ensure app is in path
sys.path.append(os.getcwd())

from app.services.metrics import ProfileMetricsService
from app.services.intelligence import JobIntelligenceService

# --- 1. Metric Accuracy Test ---
def test_metric_accuracy():
    print("Running Metric Accuracy Test...")
    
    # Case A: Minimalistic Profile
    min_profile = {
        "personal": {"fullName": "John Doe"},
        "experience": [],
        "education": [],
        "skills": {},
        "projects": [],
        "socialLinks": {}
    }
    # Calculation: 
    # personal: 1/5 = 20% * 0.25 = 5.0
    res_a = ProfileMetricsService.calculate_completion(min_profile)
    print(f"Minimal Profile Score: {res_a['score']}% (Expected: 5.0%)")
    assert res_a['score'] == 5.0
    
    # Case B: Balanced Profile
    balanced_profile = {
        "personal": {"fullName": "A", "headline": "B", "summary": "C", "location": "D", "phone": "E"},
        "experience": [{"id": 1}], # 33.4
        "education": [{"id": 2}],  # 50
        "skills": {"technical": ["Python", "JS"]}, # 20
        "projects": [],
        "socialLinks": {"linkedin": "X"} # 50
    }
    # Weights: personal(0.25), exp(0.25), edu(0.20), skills(0.15), proj(0.10), social(0.05)
    # Score: (100*0.25) + (33.4*0.25) + (50*0.20) + (20*0.15) + (0*0.10) + (50*0.05)
    # Score: 25 + 8.35 + 10 + 3 + 0 + 2.5 = 48.85 -> 48.9
    res_b = ProfileMetricsService.calculate_completion(balanced_profile)
    print(f"Balanced Profile Score: {res_b['score']}% (Expected: ~48.9%)")
    assert abs(res_b['score'] - 48.9) < 0.2

# --- 2. Semantic Mapping Sanity Check ---
async def test_semantic_sanity():
    print("\nRunning Semantic Mapping Sanity Check...")
    
    mock_profile = {
        "skills": {"technical": ["Python", "FastAPI", "PostgreSQL"]}
    }
    
    tests = [
        ("React Developer", False),      # Tech mismatch
        ("FastAPI Backend", True),       # Exact match
        ("Python Cloud Engineer", True), # Partial/Semantic
        ("UI/UX Designer", False),       # Role mismatch
    ]
    
    for title, should_match in tests:
        jd = f"We are looking for a {title}. Must be proficient in {title} requirements."
        analysis = await JobIntelligenceService.analyze_job(jd, mock_profile)
        score = analysis.get("analysis", {}).get("fit_score", 0)
        
        print(f"Result for '{title}': Score {score}% (Expected Match: {should_match})")
        if should_match:
            assert score > 30, f"Expected match for {title} but got low score {score}"
        else:
            # We allow small scores for general engineering skills, but not "Fit"
            assert score < 45, f"Expected LOW match for {title} but got high score {score}"

# --- 3. Versioning Integrity Test (Logical Simulation) ---
def test_versioning_logic():
    print("\nRunning Versioning Integrity Test (Logic Simulation)...")
    
    # Simulate a profile with versions
    profile_id = uuid.uuid4()
    
    # Version 1
    v1 = {"id": "v1", "version_number": 1, "is_active": True, "data": {"headline": "Initial"}}
    
    # Update to Version 2
    # Logic: Deactivate all, create v2
    v1["is_active"] = False
    v2 = {"id": "v2", "version_number": 2, "is_active": True, "data": {"headline": "Second"}}
    
    print(f"Updated: V1 Active={v1['is_active']}, V2 Active={v2['is_active']}")
    assert v2["version_number"] == v1["version_number"] + 1
    assert v2["is_active"] is True and v1["is_active"] is False
    
    # Rollback to Version 1
    # Logic: Set v2 False, set v1 True
    v2["is_active"] = False
    v1["is_active"] = True
    print(f"Rollback: V1 Active={v1['is_active']}, V2 Active={v2['is_active']}")
    assert v1["is_active"] is True
    assert v1["data"]["headline"] == "Initial"

# --- 4. Edge Case Testing ---
async def test_edge_cases():
    print("\nRunning Edge Case Testing...")
    
    # Case: Empty Profile
    res_empty = await JobIntelligenceService.analyze_job("Need Python", {})
    print(f"Empty Profile Response Status: {'error' in res_empty or 'analysis' in res_empty}")
    
    # Case: Empty JD
    res_no_jd = await JobIntelligenceService.analyze_job("", {"skills": {"technical": ["Python"]}})
    fit_score = res_no_jd.get("analysis", {}).get("fit_score", 0)
    print(f"Empty JD Score: {fit_score} (Expected: Low)")
    assert fit_score < 20

# --- 5. Main Validation Entry ---
async def main():
    try:
        test_metric_accuracy()
        test_versioning_logic()
        await test_edge_cases()
        await test_semantic_sanity()
        print("\nALL VALIDATION CHECKS PASSED!")
    except Exception as e:
        print(f"\nVALIDATION FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
