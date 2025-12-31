# ml-service/pipeline/tools/bschoolmatchtool/steps/school_matching.py
from __future__ import annotations

from typing import Dict, Any, List, Optional
import json
import re

from ..llm_wrapper import call_llm


# ----------------------------
# Helpers
# ----------------------------
def _safe_int(value: Any, default: Optional[int] = None) -> Optional[int]:
    if value is None:
        return default
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        s = value.strip()
        if not s or s.lower() in {"none", "null", "na", "n/a"}:
            return default
        m = re.search(r"[-+]?\d*\.?\d+", s)
        if not m:
            return default
        try:
            return int(float(m.group(0)))
        except Exception:
            return default
    try:
        return int(value)
    except Exception:
        return default


def _safe_str(value: Any, default: str = "") -> str:
    if value is None:
        return default
    s = str(value).strip()
    if s.lower() in {"none", "null", "na", "n/a"}:
        return default
    return s


def _clean_json_response(text: str) -> str:
    cleaned = (text or "").strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()


# ----------------------------
# Public API
# ----------------------------
def match_schools(
    context: Dict[str, Any],
    settings: Any,
    fallback: Any = None
) -> List[Dict[str, Any]]:
    """
    Match user profile to schools using LLM + web search.
    Falls back to static database if search fails.
    """
    profile_data = context

    print("[School Matching] Starting dynamic school search with web search...")

    # Try LLM + web search first
    try:
        schools = _search_schools_with_web(profile_data, settings, fallback)
        print(f"[School Matching] ✅ Found {len(schools)} schools via web search")

        if len(schools) >= 8:
            return schools[:20]
        else:
            print(f"[School Matching] ⚠️ Only {len(schools)} schools found, trying LLM-only...")

    except Exception as e:
        print(f"[School Matching] ❌ Web search failed: {e}")

    # Fallback to LLM-only (no web search)
    try:
        schools = _search_schools_with_llm_only(profile_data, settings, fallback)
        print(f"[School Matching] ✅ Found {len(schools)} schools via LLM")

        if len(schools) >= 8:
            return schools[:20]

    except Exception as e2:
        print(f"[School Matching] ❌ LLM search failed: {e2}")

    # Final fallback: static database
    print("[School Matching] Using static database fallback")
    return _match_schools_static(profile_data)


def _search_schools_with_web(
    profile: Dict[str, Any],
    settings: Any,
    fallback: Any = None
) -> List[Dict[str, Any]]:
    """
    Use LLM with web search tool to find latest MBA programs.
    This requires Anthropic API with web search enabled.
    """
    location = profile.get("work_location", "No preference")
    industry = profile.get("target_industry", "General")
    test_score = profile.get("test_score_normalized", "N/A")

    provider = getattr(settings, "provider", "").lower() if not isinstance(settings, dict) else settings.get("provider", "").lower()
    if provider not in ["anthropic", "claude"]:
        print(f"[Web Search] Provider {provider} doesn't support web search, using LLM-only")
        raise ValueError("Web search requires Anthropic/Claude provider")

    prompt = f"""Search the web for the best MBA programs for this candidate profile. Use current 2024-2025 data.

CANDIDATE PROFILE:
- Location Preference: {location}
- Target Industry: {industry}
- Test Score: {test_score} GMAT/GRE

TASK:
1. Search for "top MBA programs in {location} 2024" or similar queries
2. Search for "MBA programs for {industry}" if industry is specific
3. Find 15-20 accredited MBA programs that match the profile
4. Get current acceptance rates, median GMAT, and rankings

Return ONLY a valid JSON array:
[
  {{
    "name": "School Name",
    "region": "Specific location",
    "median_gmat": 700,
    "median_gpa": 3.5,
    "rank": 15,
    "acceptance_rate": 25,
    "industry_strengths": ["Consulting", "Tech"],
    "program_type": "1-year MBA or 2-year MBA"
  }},
  ...
]
"""
    response = call_llm(
        prompt=prompt,
        settings=settings,
        fallback=fallback,
        max_tokens=3000,
        temperature=0.3,
    )
    return _parse_school_response(response, profile)


def _search_schools_with_llm_only(
    profile: Dict[str, Any],
    settings: Any,
    fallback: Any = None
) -> List[Dict[str, Any]]:
    """Use LLM knowledge only (no web search)."""

    location = profile.get("work_location", "No preference")
    industry = profile.get("target_industry", "General")
    test_score = profile.get("test_score_normalized", "N/A")

    prompt = f"""You are an MBA admissions expert with knowledge of global business schools. List 15-20 MBA programs for this profile.

CANDIDATE:
- Location: {location}
- Industry: {industry}
- Test Score: {test_score}

REQUIREMENTS:
1. Focus on {location} if specified (India → IIMs/ISB, US → M7/Top 30, etc.)
2. Include ambitious/target/safe schools based on test score
3. Match industry strengths (Tech candidates → tech schools)
4. Include only real, accredited programs

Return ONLY valid JSON:
[
  {{
    "name": "School Name",
    "region": "Location",
    "median_gmat": 700,
    "median_gpa": 3.5,
    "rank": 15,
    "acceptance_rate": 25,
    "industry_strengths": ["Consulting", "Tech"],
    "program_type": "1-year MBA"
  }},
  ...
]
"""
    response = call_llm(
        prompt=prompt,
        settings=settings,
        fallback=fallback,
        max_tokens=3000,
        temperature=0.3,
    )
    return _parse_school_response(response, profile)


def _parse_school_response(response: str, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Parse LLM response and calculate fit scores."""
    cleaned = _clean_json_response(response)

    schools_data = json.loads(cleaned)
    if not isinstance(schools_data, list):
        raise ValueError("Response is not a list")

    matched_schools: List[Dict[str, Any]] = []
    for school in schools_data:
        if not isinstance(school, dict):
            continue
        if not school.get("name"):
            continue

        fit_score = _calculate_fit_score(school, profile)

        matched_schools.append({
            "school_name": school.get("name", "Unknown"),
            "program_name": school.get("program", "MBA"),
            "region": school.get("region", "Unknown"),
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
            "acceptance_rate": school.get("acceptance_rate", 25),
            "reasons": [],
            "risks": "",
            "notes": "",
        })

    matched_schools.sort(key=lambda x: x["overall_match_score"], reverse=True)
    return matched_schools


def _match_schools_static(profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Static database fallback."""

    work_location = _safe_str(profile.get("work_location", "")).lower().strip()
    all_schools = _get_static_schools()

    # Filter by location
    if work_location and work_location not in ["no preference", "no_preference", ""]:
        location_map = {
            "india": ["india"],
            "us": ["us", "east coast", "west coast", "midwest", "south"],
            "united states": ["us", "east coast", "west coast", "midwest", "south"],
            "europe": ["europe", "uk"],
            "uk": ["uk", "europe"],
            "canada": ["canada"],
            "asia": ["asia", "singapore", "hong kong"],
            "asia (ex-india)": ["asia", "singapore", "hong kong"],
            "middle east": ["middle east", "dubai"],
        }

        valid_regions = location_map.get(work_location, [work_location])

        filtered_schools = [
            s for s in all_schools
            if any(region in _safe_str(s.get("region", "")).lower() for region in valid_regions)
        ]

        print(f"[Static] Filtered to {len(filtered_schools)} schools for {work_location}")
    else:
        filtered_schools = all_schools

    matched_schools = []
    for school in filtered_schools:
        fit_score = _calculate_fit_score(school, profile)
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
            "reasons": [],
            "risks": "",
            "notes": "",
        })

    matched_schools.sort(key=lambda x: x["overall_match_score"], reverse=True)
    return matched_schools[:20]


def _calculate_fit_score(school: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, int]:
    """Calculate fit scores (0-10 scale). Robust to missing test score."""

    # IMPORTANT: this can be None (e.g. no test taken yet)
    test_score = _safe_int(profile.get("test_score_normalized"), default=None)
    gpa = profile.get("gpa_normalized", 3.5)

    school_gmat = _safe_int(school.get("median_gmat"), default=700) or 700

    # Academic fit (if no test score, use neutral score)
    if test_score is None:
        academic_fit = 6  # neutral/default when test score not provided
    else:
        gmat_diff = test_score - school_gmat
        if gmat_diff >= 20:
            academic_fit = 8
        elif gmat_diff >= 0:
            academic_fit = 7
        elif gmat_diff >= -20:
            academic_fit = 6
        else:
            academic_fit = 4

    # Career fit
    target_industry = _safe_str(profile.get("target_industry", "")).lower()
    school_strengths = school.get("industry_strengths", [])
    career_fit = 7
    if target_industry and any(target_industry in _safe_str(s).lower() for s in school_strengths):
        career_fit = 9

    # Geography fit
    work_location = _safe_str(profile.get("work_location", "")).lower()
    school_region = _safe_str(school.get("region", "")).lower()
    geography_fit = 8 if (work_location and work_location in school_region) else 6

    # Brand prestige
    rank = _safe_int(school.get("rank"), default=30) or 30
    if rank <= 10:
        brand = 10
    elif rank <= 20:
        brand = 8
    elif rank <= 30:
        brand = 7
    else:
        brand = 6

    roi_fit = 7
    culture_fit = 7

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


def _get_static_schools() -> List[Dict[str, Any]]:
    """Minimal static fallback (36 schools across all regions)."""
    return [
        # US M7
        {"name": "Harvard Business School", "rank": 1, "region": "US - East Coast", "median_gmat": 730, "median_gpa": 3.7, "acceptance_rate": 11, "industry_strengths": ["Consulting", "Finance", "Entrepreneurship"], "program_type": "2-year MBA"},
        {"name": "Stanford GSB", "rank": 2, "region": "US - West Coast", "median_gmat": 738, "median_gpa": 3.8, "acceptance_rate": 6, "industry_strengths": ["Tech", "Entrepreneurship", "VC"], "program_type": "2-year MBA"},
        {"name": "Wharton", "rank": 3, "region": "US - East Coast", "median_gmat": 733, "median_gpa": 3.6, "acceptance_rate": 20, "industry_strengths": ["Finance", "Consulting", "Tech"], "program_type": "2-year MBA"},
        {"name": "Booth", "rank": 4, "region": "US - Midwest", "median_gmat": 730, "median_gpa": 3.6, "acceptance_rate": 22, "industry_strengths": ["Finance", "Consulting", "Analytics"], "program_type": "2-year MBA"},
        {"name": "Kellogg", "rank": 5, "region": "US - Midwest", "median_gmat": 728, "median_gpa": 3.6, "acceptance_rate": 24, "industry_strengths": ["Marketing", "Consulting", "Tech"], "program_type": "2-year MBA"},
        {"name": "Columbia", "rank": 6, "region": "US - East Coast", "median_gmat": 729, "median_gpa": 3.6, "acceptance_rate": 18, "industry_strengths": ["Finance", "Consulting", "Media"], "program_type": "2-year MBA"},
        {"name": "Sloan (MIT)", "rank": 7, "region": "US - East Coast", "median_gmat": 728, "median_gpa": 3.6, "acceptance_rate": 14, "industry_strengths": ["Tech", "Finance", "Operations"], "program_type": "2-year MBA"},

        # US Top 15
        {"name": "Haas (Berkeley)", "rank": 8, "region": "US - West Coast", "median_gmat": 726, "median_gpa": 3.7, "acceptance_rate": 14, "industry_strengths": ["Tech", "Entrepreneurship"], "program_type": "2-year MBA"},
        {"name": "Ross (Michigan)", "rank": 11, "region": "US - Midwest", "median_gmat": 720, "median_gpa": 3.5, "acceptance_rate": 26, "industry_strengths": ["Consulting", "Tech"], "program_type": "2-year MBA"},
        {"name": "Fuqua (Duke)", "rank": 12, "region": "US - South", "median_gmat": 718, "median_gpa": 3.5, "acceptance_rate": 25, "industry_strengths": ["Consulting", "Healthcare"], "program_type": "2-year MBA"},

        # India (Enhanced)
        {"name": "ISB (Hyderabad)", "rank": 25, "region": "India", "median_gmat": 690, "median_gpa": 3.4, "acceptance_rate": 15, "industry_strengths": ["Consulting", "Tech", "Finance"], "program_type": "1-year MBA"},
        {"name": "IIM Ahmedabad", "rank": 28, "region": "India", "median_gmat": 680, "median_gpa": 3.3, "acceptance_rate": 12, "industry_strengths": ["Consulting", "Finance"], "program_type": "2-year MBA"},
        {"name": "IIM Bangalore", "rank": 30, "region": "India", "median_gmat": 675, "median_gpa": 3.3, "acceptance_rate": 15, "industry_strengths": ["Consulting", "Tech"], "program_type": "2-year MBA"},
        {"name": "IIM Calcutta", "rank": 32, "region": "India", "median_gmat": 670, "median_gpa": 3.2, "acceptance_rate": 18, "industry_strengths": ["Finance", "Consulting"], "program_type": "2-year MBA"},
        {"name": "IIM Lucknow", "rank": 35, "region": "India", "median_gmat": 660, "median_gpa": 3.2, "acceptance_rate": 20, "industry_strengths": ["Finance", "Operations"], "program_type": "2-year MBA"},
        {"name": "XLRI Jamshedpur", "rank": 38, "region": "India", "median_gmat": 650, "median_gpa": 3.1, "acceptance_rate": 22, "industry_strengths": ["HR", "Marketing"], "program_type": "2-year MBA"},
        {"name": "SP Jain (Mumbai)", "rank": 40, "region": "India", "median_gmat": 650, "median_gpa": 3.2, "acceptance_rate": 25, "industry_strengths": ["Family Business", "Finance"], "program_type": "2-year MBA"},
        {"name": "MDI Gurgaon", "rank": 42, "region": "India", "median_gmat": 640, "median_gpa": 3.1, "acceptance_rate": 28, "industry_strengths": ["Marketing", "Finance"], "program_type": "2-year MBA"},

        # Europe
        {"name": "INSEAD", "rank": 3, "region": "Europe", "median_gmat": 710, "median_gpa": 3.5, "acceptance_rate": 25, "industry_strengths": ["Consulting", "Finance"], "program_type": "1-year MBA"},
        {"name": "London Business School", "rank": 4, "region": "Europe", "median_gmat": 708, "median_gpa": 3.6, "acceptance_rate": 25, "industry_strengths": ["Finance", "Consulting"], "program_type": "2-year MBA"},
        {"name": "HEC Paris", "rank": 18, "region": "Europe", "median_gmat": 690, "median_gpa": 3.4, "acceptance_rate": 30, "industry_strengths": ["Consulting", "Luxury"], "program_type": "1-year MBA"},
        {"name": "IESE (Barcelona)", "rank": 20, "region": "Europe", "median_gmat": 680, "median_gpa": 3.3, "acceptance_rate": 35, "industry_strengths": ["Consulting", "Family Business"], "program_type": "2-year MBA"},

        # Asia
        {"name": "NUS Business School", "rank": 26, "region": "Asia - Singapore", "median_gmat": 680, "median_gpa": 3.4, "acceptance_rate": 20, "industry_strengths": ["Finance", "Tech"], "program_type": "1-year MBA"},
        {"name": "NTU Nanyang", "rank": 28, "region": "Asia - Singapore", "median_gmat": 670, "median_gpa": 3.3, "acceptance_rate": 25, "industry_strengths": ["Tech", "Entrepreneurship"], "program_type": "1-year MBA"},
        {"name": "HKUST", "rank": 30, "region": "Asia - Hong Kong", "median_gmat": 680, "median_gpa": 3.4, "acceptance_rate": 22, "industry_strengths": ["Finance", "Tech"], "program_type": "1-year MBA"},
    ]
