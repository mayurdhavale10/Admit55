# ml-service/pipeline/tools/bschoolmatchtool/steps/tier_classification.py
from __future__ import annotations
from typing import Dict, Any, List

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
    
    test_score = context.get("test_score_normalized", 700)
    gpa = context.get("gpa_normalized", 3.5)
    years_exp = context.get("years_experience", 4)
    risk_tolerance = context.get("risk_tolerance", "balanced")
    
    ambitious = []
    target = []
    safe = []
    
    for school in schools:
        school_gmat = school.get("median_gmat", 700)
        school_gpa = school.get("median_gpa", 3.5)
        acceptance_rate = school.get("acceptance_rate", 25)
        
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
        
        # Add probability to school data
        school["admission_probability"] = probability
        
        # Classify into tiers
        if probability < 30:
            ambitious.append(school)
        elif probability >= 30 and probability < 65:
            target.append(school)
        else:
            safe.append(school)
    
    # Adjust based on risk tolerance
    if risk_tolerance == "aggressive":
        # Move some targets to ambitious
        if len(target) > 4:
            ambitious.extend(target[:2])
            target = target[2:]
    elif risk_tolerance == "safe":
        # Move some targets to safe
        if len(target) > 4:
            safe.extend(target[-2:])
            target = target[:-2]
    
    # Limit to reasonable numbers
    ambitious = ambitious[:4]
    target = target[:5]
    safe = safe[:3]
    
    return {
        "ambitious": ambitious,
        "target": target,
        "safe": safe,
    }


def _calculate_admission_probability(
    user_gmat: int,
    school_gmat: int,
    user_gpa: float,
    school_gpa: float,
    acceptance_rate: int,
    years_exp: int,
    context: Dict[str, Any]
) -> int:
    """
    Calculate admission probability (0-100).
    
    Simplified model based on:
    - GMAT comparison
    - GPA comparison
    - Base acceptance rate
    - Diversity factors
    """
    
    # Base probability from acceptance rate
    base_prob = acceptance_rate
    
    # GMAT adjustment
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
    
    # GPA adjustment
    gpa_diff = user_gpa - school_gpa
    if gpa_diff >= 0.2:
        gpa_boost = 10
    elif gpa_diff >= 0:
        gpa_boost = 5
    elif gpa_diff >= -0.2:
        gpa_boost = 0
    else:
        gpa_boost = -10
    
    # Work experience adjustment
    if years_exp < 2:
        exp_boost = -15
    elif years_exp >= 2 and years_exp <= 7:
        exp_boost = 5
    else:
        exp_boost = -5  # Too senior
    
    # Diversity factors
    diversity_boost = 0
    nationality = context.get("nationality", "").lower()
    
    # Overrepresented: Indian male tech
    if "india" in nationality:
        diversity_boost = -5
    
    # Career switch
    if context.get("career_switch"):
        diversity_boost += 5
    
    # Calculate final probability
    final_prob = base_prob + gmat_boost + gpa_boost + exp_boost + diversity_boost
    
    # Clamp to 5-95 range
    return max(5, min(95, final_prob))