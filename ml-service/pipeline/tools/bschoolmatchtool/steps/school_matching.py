# ml-service/pipeline/tools/bschoolmatchtool/steps/school_matching.py
from __future__ import annotations
from typing import Dict, Any, List
import json

def match_schools(
    context: Dict[str, Any],
    settings: Any,
    fallback: Any = None
) -> List[Dict[str, Any]]:
    """
    Match user profile to schools from database.
    
    Returns list of schools with fit scores.
    """
    
    # TODO: Replace with actual database query
    # For now, return mock schools based on context
    
    profile_data = context
    work_location = profile_data.get("work_location", "").lower()
    target_industry = profile_data.get("target_industry", "").lower()
    test_score = profile_data.get("test_score_normalized", 700)
    
    # Mock school database (replace with real DB query)
    all_schools = _get_mock_schools()
    
    # Filter by location preference
    if work_location and work_location != "no preference":
        filtered_schools = [
            s for s in all_schools 
            if work_location in s.get("region", "").lower()
        ]
    else:
        filtered_schools = all_schools
    
    # Calculate fit scores for each school
    matched_schools = []
    for school in filtered_schools:
        fit_score = _calculate_fit_score(school, profile_data)
        
        matched_schools.append({
            "school_name": school["name"],
            "program_name": school.get("program", "MBA"),
            "region": school.get("region", "US"),
            "program_type": school.get("program_type", "2-year MBA"),
            "overall_match_score": fit_score["overall"],
            "fit_scores": {
                "academic_fit": fit_score["academic"],
                "career_outcomes_fit": fit_score["career"],
                "geography_fit": fit_score["geography"],
                "brand_prestige": fit_score["brand"],
                "roi_affordability": fit_score["roi"],
                "culture_personal_fit": fit_score["culture"],
            },
            "median_gmat": school.get("median_gmat", 700),
            "median_gpa": school.get("median_gpa", 3.5),
            "acceptance_rate": school.get("acceptance_rate", 20),
            "reasons": [],  # Will be filled by AI
            "risks": "",    # Will be filled by AI
            "notes": "",    # Will be filled by AI
        })
    
    # Sort by overall match score
    matched_schools.sort(key=lambda x: x["overall_match_score"], reverse=True)
    
    # Return top 20 schools
    return matched_schools[:20]


def _calculate_fit_score(school: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, int]:
    """Calculate fit scores (0-10 scale) for a school."""
    
    test_score = profile.get("test_score_normalized", 700)
    gpa = profile.get("gpa_normalized", 3.5)
    years_exp = profile.get("years_experience", 4)
    
    # Academic fit
    school_gmat = school.get("median_gmat", 700)
    school_gpa = school.get("median_gpa", 3.5)
    
    gmat_diff = test_score - school_gmat
    academic_fit = 5  # baseline
    if gmat_diff >= 20:
        academic_fit = 8
    elif gmat_diff >= 0:
        academic_fit = 7
    elif gmat_diff >= -20:
        academic_fit = 6
    else:
        academic_fit = 4
    
    # Career fit (simplified)
    target_industry = profile.get("target_industry", "").lower()
    school_strengths = school.get("industry_strengths", [])
    career_fit = 7
    if any(target_industry in s.lower() for s in school_strengths):
        career_fit = 9
    
    # Geography fit
    work_location = profile.get("work_location", "").lower()
    school_region = school.get("region", "").lower()
    geography_fit = 8 if work_location in school_region else 6
    
    # Brand prestige (based on ranking)
    rank = school.get("rank", 30)
    if rank <= 10:
        brand = 10
    elif rank <= 20:
        brand = 8
    elif rank <= 30:
        brand = 7
    else:
        brand = 6
    
    # ROI (simplified)
    roi_fit = 7
    
    # Culture fit (simplified)
    culture_fit = 7
    
    # Overall (weighted average)
    overall = int(
        (academic_fit * 0.3 +
         career_fit * 0.25 +
         geography_fit * 0.15 +
         brand * 0.15 +
         roi_fit * 0.1 +
         culture_fit * 0.05) * 10
    )
    
    return {
        "overall": min(100, max(0, overall)),
        "academic": academic_fit,
        "career": career_fit,
        "geography": geography_fit,
        "brand": brand,
        "roi": roi_fit,
        "culture": culture_fit,
    }


def _get_mock_schools() -> List[Dict[str, Any]]:
    """Mock school database. Replace with real DB."""
    
    return [
        # M7
        {"name": "Harvard Business School", "rank": 1, "region": "US - East Coast", "median_gmat": 730, "median_gpa": 3.7, "acceptance_rate": 11, "industry_strengths": ["Consulting", "Finance", "Entrepreneurship"], "program_type": "2-year MBA"},
        {"name": "Stanford GSB", "rank": 2, "region": "US - West Coast", "median_gmat": 738, "median_gpa": 3.8, "acceptance_rate": 6, "industry_strengths": ["Tech", "Entrepreneurship", "VC"], "program_type": "2-year MBA"},
        {"name": "Wharton", "rank": 3, "region": "US - East Coast", "median_gmat": 733, "median_gpa": 3.6, "acceptance_rate": 20, "industry_strengths": ["Finance", "Consulting", "Tech"], "program_type": "2-year MBA"},
        {"name": "Booth", "rank": 4, "region": "US - Midwest", "median_gmat": 730, "median_gpa": 3.6, "acceptance_rate": 22, "industry_strengths": ["Finance", "Consulting", "Analytics"], "program_type": "2-year MBA"},
        {"name": "Kellogg", "rank": 5, "region": "US - Midwest", "median_gmat": 728, "median_gpa": 3.6, "acceptance_rate": 24, "industry_strengths": ["Marketing", "Consulting", "Tech"], "program_type": "2-year MBA"},
        {"name": "Columbia", "rank": 6, "region": "US - East Coast", "median_gmat": 729, "median_gpa": 3.6, "acceptance_rate": 18, "industry_strengths": ["Finance", "Consulting", "Media"], "program_type": "2-year MBA"},
        {"name": "Sloan (MIT)", "rank": 7, "region": "US - East Coast", "median_gmat": 728, "median_gpa": 3.6, "acceptance_rate": 14, "industry_strengths": ["Tech", "Finance", "Operations"], "program_type": "2-year MBA"},
        
        # Top 15
        {"name": "Haas (Berkeley)", "rank": 8, "region": "US - West Coast", "median_gmat": 726, "median_gpa": 3.7, "acceptance_rate": 14, "industry_strengths": ["Tech", "Entrepreneurship", "Social Impact"], "program_type": "2-year MBA"},
        {"name": "Tuck (Dartmouth)", "rank": 9, "region": "US - East Coast", "median_gmat": 725, "median_gpa": 3.5, "acceptance_rate": 23, "industry_strengths": ["Consulting", "Finance", "General Management"], "program_type": "2-year MBA"},
        {"name": "Yale SOM", "rank": 10, "region": "US - East Coast", "median_gmat": 724, "median_gpa": 3.7, "acceptance_rate": 23, "industry_strengths": ["Consulting", "Finance", "Non-profit"], "program_type": "2-year MBA"},
        {"name": "Ross (Michigan)", "rank": 11, "region": "US - Midwest", "median_gmat": 720, "median_gpa": 3.5, "acceptance_rate": 26, "industry_strengths": ["Consulting", "Tech", "Operations"], "program_type": "2-year MBA"},
        {"name": "Fuqua (Duke)", "rank": 12, "region": "US - South", "median_gmat": 718, "median_gpa": 3.5, "acceptance_rate": 25, "industry_strengths": ["Consulting", "Healthcare", "Finance"], "program_type": "2-year MBA"},
        {"name": "Darden (Virginia)", "rank": 13, "region": "US - South", "median_gmat": 718, "median_gpa": 3.5, "acceptance_rate": 26, "industry_strengths": ["Consulting", "Finance", "General Management"], "program_type": "2-year MBA"},
        
        # Top 30
        {"name": "Anderson (UCLA)", "rank": 14, "region": "US - West Coast", "median_gmat": 716, "median_gpa": 3.6, "acceptance_rate": 25, "industry_strengths": ["Entertainment", "Tech", "Real Estate"], "program_type": "2-year MBA"},
        {"name": "Cornell Johnson", "rank": 15, "region": "US - East Coast", "median_gmat": 715, "median_gpa": 3.5, "acceptance_rate": 30, "industry_strengths": ["Consulting", "Tech", "Finance"], "program_type": "2-year MBA"},
        {"name": "Tepper (CMU)", "rank": 18, "region": "US - Midwest", "median_gmat": 710, "median_gpa": 3.5, "acceptance_rate": 32, "industry_strengths": ["Tech", "Analytics", "Finance"], "program_type": "2-year MBA"},
        {"name": "McCombs (Texas)", "rank": 20, "region": "US - South", "median_gmat": 705, "median_gpa": 3.5, "acceptance_rate": 35, "industry_strengths": ["Energy", "Consulting", "Tech"], "program_type": "2-year MBA"},
        {"name": "Foster (Washington)", "rank": 22, "region": "US - West Coast", "median_gmat": 700, "median_gpa": 3.5, "acceptance_rate": 35, "industry_strengths": ["Tech", "Consulting", "Operations"], "program_type": "2-year MBA"},
        {"name": "Marshall (USC)", "rank": 23, "region": "US - West Coast", "median_gmat": 702, "median_gpa": 3.5, "acceptance_rate": 30, "industry_strengths": ["Entertainment", "Tech", "Entrepreneurship"], "program_type": "2-year MBA"},
        
        # International
        {"name": "INSEAD", "rank": 3, "region": "Europe", "median_gmat": 710, "median_gpa": 3.5, "acceptance_rate": 25, "industry_strengths": ["Consulting", "Finance", "International"], "program_type": "1-year MBA"},
        {"name": "London Business School", "rank": 4, "region": "Europe", "median_gmat": 708, "median_gpa": 3.6, "acceptance_rate": 25, "industry_strengths": ["Finance", "Consulting", "Tech"], "program_type": "2-year MBA"},
        {"name": "ISB (Hyderabad)", "rank": 25, "region": "India", "median_gmat": 690, "median_gpa": 3.4, "acceptance_rate": 15, "industry_strengths": ["Consulting", "Tech", "Finance"], "program_type": "1-year MBA"},
    ]