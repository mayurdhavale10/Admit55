# ml-service/pipeline/tools/bschoolmatchtool/steps/context_builder.py
from __future__ import annotations

import re
from typing import Any, Dict, Optional


# ----------------------------
# Helpers: safe normalization
# ----------------------------
def _safe_str(value: Any, default: str = "") -> str:
    if value is None:
        return default
    s = str(value).strip()
    if s.lower() in {"none", "null", "na", "n/a"}:
        return default
    return s


def _safe_bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    s = str(value).strip().lower()
    if s in {"true", "yes", "y", "1"}:
        return True
    if s in {"false", "no", "n", "0"}:
        return False
    return default


def _safe_int(value: Any, default: int = 0) -> int:
    """
    Convert value to int safely.
    Handles None, numeric, and strings like "3 years", "24 months", "3.5", etc.
    """
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
        # take the first number in the string
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


def _safe_float(value: Any, default: Optional[float] = None) -> Optional[float]:
    if value is None:
        return default
    if isinstance(value, bool):
        return float(int(value))
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip()
    if not s or s.lower() in {"none", "null", "na", "n/a"}:
        return default
    m = re.search(r"[-+]?\d*\.?\d+", s)
    if not m:
        return default
    try:
        return float(m.group(0))
    except Exception:
        return default


# ----------------------------
# Core builders
# ----------------------------
def build_context(user_profile: Dict[str, Any], resume_text: Optional[str] = None) -> Dict[str, Any]:
    """
    Build context from user answers and optional resume.

    Returns structured context for AI matching logic.
    """
    # Experience can come as total_experience, years_experience, or None
    raw_years = user_profile.get("years_experience", None)
    if raw_years is None:
        raw_years = user_profile.get("total_experience", None)

    context: Dict[str, Any] = {
        # Goals
        "target_role": _safe_str(user_profile.get("target_role")),
        "target_industry": _safe_str(user_profile.get("target_industry")),
        "work_location": _safe_str(user_profile.get("preferred_work_location")),
        "school_location": _safe_str(user_profile.get("preferred_school_location")),

        # Academics
        "gmat_gre_status": _safe_str(user_profile.get("test_status")),
        "test_type": _safe_str(user_profile.get("test_type")),
        "test_score": user_profile.get("actual_score", None),  # keep raw; normalize later
        "gpa": user_profile.get("gpa", None),                  # keep raw; normalize later

        # Professional
        "years_experience": raw_years,  # keep raw; normalize later
        "current_industry": _safe_str(user_profile.get("current_industry")),
        "current_role": _safe_str(user_profile.get("current_role")),
        # Your incoming key is "has_leadership" but older code used "leadership_experience"
        "has_leadership": user_profile.get("has_leadership", user_profile.get("leadership_experience", "")),

        # Demographics
        "nationality": _safe_str(user_profile.get("nationality")),
        "career_switch": _safe_bool(user_profile.get("career_switch"), default=False),

        # Preferences
        "program_type": _safe_str(user_profile.get("preferred_program_type")),
        "budget": _safe_str(user_profile.get("budget_consideration")),
        "class_size": _safe_str(user_profile.get("class_size_preference")),
        "learning_style": _safe_str(user_profile.get("learning_style_preference")),
        "risk_tolerance": _safe_str(user_profile.get("risk_tolerance"), default="balanced") or "balanced",

        # Optional
        "schools_considering": user_profile.get("schools_already_considering", ""),
        "post_mba_goal": _safe_str(user_profile.get("post_mba_goal")),
        "why_mba_now": _safe_str(user_profile.get("why_mba_now")),

        # Resume (optional)
        "resume_text": (resume_text or "").strip(),
    }

    return context


def extract_key_profile_data(context: Dict[str, Any]) -> Dict[str, Any]:
    """Extract the most critical profile data for matching."""

    # ----------------------------
    # Normalize test score
    # ----------------------------
    raw_score = context.get("test_score")
    test_type = _safe_str(context.get("test_type")).lower()

    score_int = _safe_int(raw_score, default=0)
    normalized_score: Optional[int] = None

    # Only attempt normalization if we have a non-zero numeric score
    if score_int > 0:
        if "gmat" in test_type:
            # GMAT classic range
            normalized_score = score_int if 200 <= score_int <= 800 else None
        elif "gre" in test_type:
            # GRE total is usually 260–340; map to a rough GMAT-like score
            if 260 <= score_int <= 340:
                normalized_score = int((score_int - 260) * 7.5 + 200)
        else:
            # If type unknown, do a best-effort: treat 200-800 as GMAT, 260-340 as GRE
            if 200 <= score_int <= 800:
                normalized_score = score_int
            elif 260 <= score_int <= 340:
                normalized_score = int((score_int - 260) * 7.5 + 200)

    # ----------------------------
    # Normalize GPA
    # ----------------------------
    raw_gpa = context.get("gpa")
    gpa_val = _safe_float(raw_gpa, default=None)
    normalized_gpa: Optional[float] = None

    if gpa_val is not None:
        if 0.0 < gpa_val <= 4.0:
            normalized_gpa = gpa_val
        elif 0.0 < gpa_val <= 10.0:
            # Convert 10-point GPA to 4-point scale
            normalized_gpa = (gpa_val / 10.0) * 4.0
        else:
            normalized_gpa = None

    # ----------------------------
    # Normalize years experience (fixes your crash)
    # ----------------------------
    years_experience = _safe_int(context.get("years_experience", None), default=0)

    return {
        "test_score_normalized": normalized_score,
        "gpa_normalized": normalized_gpa,
        "years_experience": years_experience,
        "target_role": _safe_str(context.get("target_role")),
        "target_industry": _safe_str(context.get("target_industry")),
        "work_location": _safe_str(context.get("work_location")),
        "current_industry": _safe_str(context.get("current_industry")),
        "career_switch": _safe_bool(context.get("career_switch"), default=False),
        "nationality": _safe_str(context.get("nationality")),
        "risk_tolerance": _safe_str(context.get("risk_tolerance"), default="balanced") or "balanced",
    }


def format_context_for_prompt(context: Dict[str, Any]) -> str:
    """Format context into a readable string for AI prompts."""

    lines = ["=== CANDIDATE PROFILE ==="]

    # Goals
    if _safe_str(context.get("target_role")):
        lines.append(f"Target Role: {_safe_str(context.get('target_role'))}")
    if _safe_str(context.get("target_industry")):
        lines.append(f"Target Industry: {_safe_str(context.get('target_industry'))}")
    if _safe_str(context.get("work_location")):
        lines.append(f"Work Location Preference: {_safe_str(context.get('work_location'))}")

    # Academics
    raw_score = context.get("test_score")
    if raw_score is not None and _safe_str(raw_score):
        test_type = _safe_str(context.get("test_type"), default="Test")
        lines.append(f"{test_type} Score: {_safe_str(raw_score)}")

    raw_gpa = context.get("gpa")
    if raw_gpa is not None and _safe_str(raw_gpa):
        lines.append(f"GPA: {_safe_str(raw_gpa)}")

    # Professional
    years = _safe_int(context.get("years_experience", None), default=0)
    if years > 0:
        lines.append(f"Work Experience: {years} years")

    if _safe_str(context.get("current_role")):
        lines.append(f"Current Role: {_safe_str(context.get('current_role'))}")
    if _safe_str(context.get("current_industry")):
        lines.append(f"Current Industry: {_safe_str(context.get('current_industry'))}")

    # Additional context
    if _safe_bool(context.get("career_switch"), default=False):
        lines.append("Career Switch: Yes")
    if _safe_str(context.get("nationality")):
        lines.append(f"Nationality: {_safe_str(context.get('nationality'))}")

    return "\n".join(lines)
