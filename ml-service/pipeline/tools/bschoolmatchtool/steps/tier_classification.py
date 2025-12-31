# ml-service/pipeline/tools/bschoolmatchtool/steps/tier_classification.py
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional


# ----------------------------
# Helpers
# ----------------------------
def _safe_int(value: Any, default: int = 0) -> int:
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


def _safe_float(value: Any, default: Optional[float] = None) -> Optional[float]:
    if value is None:
        return default
    if isinstance(value, bool):
        return float(int(value))
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        s = value.strip()
        if not s or s.lower() in {"none", "null", "na", "n/a"}:
            return default
        m = re.search(r"[-+]?\d*\.?\d+", s)
        if not m:
            return default
        try:
            return float(m.group(0))
        except Exception:
            return default
    try:
        return float(value)
    except Exception:
        return default


def _safe_str(value: Any, default: str = "") -> str:
    if value is None:
        return default
    s = str(value).strip()
    if s.lower() in {"none", "null", "na", "n/a"}:
        return default
    return s


# ----------------------------
# Main API
# ----------------------------
def classify_tiers(
    schools: List[Dict[str, Any]],
    context: Dict[str, Any],
    settings: Any
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Classify schools into Ambitious/Target/Safe tiers.

    Based on:
    - User's test scores vs school median
    - GPA comparison
    - Acceptance rates
    - Diversity factors
    """

    # IMPORTANT: these can be None depending on user inputs
    test_score = _safe_int(context.get("test_score_normalized"), default=0)  # 0 means "unknown"
    gpa = _safe_float(context.get("gpa_normalized"), default=None)          # None means "unknown"
    years_exp = _safe_int(context.get("years_experience"), default=0)
    risk_tolerance = _safe_str(context.get("risk_tolerance"), default="balanced") or "balanced"

    ambitious: List[Dict[str, Any]] = []
    target: List[Dict[str, Any]] = []
    safe: List[Dict[str, Any]] = []

    for school in schools:
        school_gmat = _safe_int(school.get("median_gmat"), default=700)
        school_gpa = _safe_float(school.get("median_gpa"), default=3.5)
        acceptance_rate = _safe_int(school.get("acceptance_rate"), default=25)

        # Calculate admission probability
        probability = _calculate_admission_probability(
            user_gmat=test_score,
            school_gmat=school_gmat,
            user_gpa=gpa,
            school_gpa=school_gpa,
            acceptance_rate=acceptance_rate,
            years_exp=years_exp,
            context=context
        )

        school["admission_probability"] = probability

        # Classify into tiers
        if probability < 30:
            ambitious.append(school)
        elif probability < 65:
            target.append(school)
        else:
            safe.append(school)

    # Adjust based on risk tolerance
    if risk_tolerance == "aggressive":
        if len(target) > 4:
            ambitious.extend(target[:2])
            target = target[2:]
    elif risk_tolerance == "safe":
        if len(target) > 4:
            safe.extend(target[-2:])
            target = target[:-2]

    ambitious = ambitious[:4]
    target = target[:5]
    safe = safe[:3]

    return {
        "ambitious": ambitious,
        "target": target,
        "safe": safe,
    }


def _calculate_admission_probability(
    user_gmat: int,                 # 0 means "unknown"
    school_gmat: int,
    user_gpa: Optional[float],      # None means "unknown"
    school_gpa: Optional[float],
    acceptance_rate: int,
    years_exp: int,
    context: Dict[str, Any]
) -> int:
    """
    Calculate admission probability (0-100).

    Robust to missing GMAT/GPA (treat as neutral).
    """

    base_prob = acceptance_rate

    # ----------------------------
    # GMAT adjustment (neutral if unknown)
    # ----------------------------
    if not user_gmat or user_gmat <= 0:
        gmat_boost = 0  # neutral if user hasn't provided a score
    else:
        gmat_diff = user_gmat - school_gmat
        if gmat_diff >= 20:
            gmat_boost = 20
        elif gmat_diff >= 0:
            gmat_boost = 10
        elif gmat_diff >= -20:
            gmat_boost = 0
        elif gmat_diff >= -40:
            gmat_boost = -15
        else:
            gmat_boost = -25

    # ----------------------------
    # GPA adjustment (neutral if unknown)
    # ----------------------------
    if user_gpa is None or school_gpa is None:
        gpa_boost = 0  # neutral when missing
    else:
        gpa_diff = float(user_gpa) - float(school_gpa)
        if gpa_diff >= 0.2:
            gpa_boost = 10
        elif gpa_diff >= 0:
            gpa_boost = 5
        elif gpa_diff >= -0.2:
            gpa_boost = 0
        else:
            gpa_boost = -10

    # ----------------------------
    # Work experience adjustment
    # ----------------------------
    if years_exp < 2:
        exp_boost = -15
    elif 2 <= years_exp <= 7:
        exp_boost = 5
    else:
        exp_boost = -5  # Too senior

    # ----------------------------
    # Diversity factors
    # ----------------------------
    diversity_boost = 0
    nationality = _safe_str(context.get("nationality", "")).lower()

    if "india" in nationality:
        diversity_boost -= 5

    if bool(context.get("career_switch")):
        diversity_boost += 5

    final_prob = base_prob + gmat_boost + gpa_boost + exp_boost + diversity_boost

    return max(5, min(95, int(final_prob)))
