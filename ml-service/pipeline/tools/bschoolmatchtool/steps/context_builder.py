# ml-service/pipeline/tools/bschoolmatchtool/steps/context_builder.py
from __future__ import annotations
from typing import Dict, Any, Optional

def build_context(user_profile: Dict[str, Any], resume_text: Optional[str] = None) -> Dict[str, Any]:
    """
    Build context from user answers and optional resume.
    
    Returns structured context for AI matching logic.
    """
    context = {
        # Goals
        "target_role": user_profile.get("target_role", ""),
        "target_industry": user_profile.get("target_industry", ""),
        "work_location": user_profile.get("preferred_work_location", ""),
        "school_location": user_profile.get("preferred_school_location", ""),
        
        # Academics
        "gmat_gre_status": user_profile.get("test_status", ""),
        "test_type": user_profile.get("test_type", ""),
        "test_score": user_profile.get("actual_score"),
        "gpa": user_profile.get("gpa"),
        
        # Professional
        "years_experience": user_profile.get("total_experience", 0),
        "current_industry": user_profile.get("current_industry", ""),
        "current_role": user_profile.get("current_role", ""),
        "has_leadership": user_profile.get("leadership_experience", ""),
        
        # Demographics
        "nationality": user_profile.get("nationality", ""),
        "career_switch": user_profile.get("career_switch", False),
        
        # Preferences
        "program_type": user_profile.get("preferred_program_type", ""),
        "budget": user_profile.get("budget_consideration", ""),
        "class_size": user_profile.get("class_size_preference", ""),
        "learning_style": user_profile.get("learning_style_preference", ""),
        "risk_tolerance": user_profile.get("risk_tolerance", "balanced"),
        
        # Optional
        "schools_considering": user_profile.get("schools_already_considering", ""),
        "post_mba_goal": user_profile.get("post_mba_goal", ""),
        "why_mba_now": user_profile.get("why_mba_now", ""),
        
        # Resume (optional)
        "resume_text": resume_text or "",
    }
    
    return context


def extract_key_profile_data(context: Dict[str, Any]) -> Dict[str, Any]:
    """Extract the most critical profile data for matching."""
    
    # Normalize test score
    test_score = context.get("test_score")
    test_type = str(context.get("test_type", "")).lower()
    
    normalized_score = None
    if test_score:
        if "gmat" in test_type:
            normalized_score = int(test_score) if 200 <= int(test_score) <= 800 else None
        elif "gre" in test_type:
            # Convert GRE to rough GMAT equivalent (simplified)
            gre_score = int(test_score)
            if 260 <= gre_score <= 340:
                normalized_score = int((gre_score - 260) * 7.5 + 200)
    
    # Normalize GPA
    gpa = context.get("gpa")
    normalized_gpa = None
    if gpa:
        try:
            gpa_val = float(gpa)
            if gpa_val <= 4.0:
                normalized_gpa = gpa_val
            elif gpa_val <= 10.0:
                # Convert 10-point to 4-point
                normalized_gpa = (gpa_val / 10.0) * 4.0
        except:
            normalized_gpa = None
    
    return {
        "test_score_normalized": normalized_score,
        "gpa_normalized": normalized_gpa,
        "years_experience": int(context.get("years_experience", 0)),
        "target_role": context.get("target_role", ""),
        "target_industry": context.get("target_industry", ""),
        "work_location": context.get("work_location", ""),
        "current_industry": context.get("current_industry", ""),
        "career_switch": bool(context.get("career_switch", False)),
        "nationality": context.get("nationality", ""),
        "risk_tolerance": context.get("risk_tolerance", "balanced"),
    }


def format_context_for_prompt(context: Dict[str, Any]) -> str:
    """Format context into a readable string for AI prompts."""
    
    lines = ["=== CANDIDATE PROFILE ==="]
    
    # Goals
    if context.get("target_role"):
        lines.append(f"Target Role: {context['target_role']}")
    if context.get("target_industry"):
        lines.append(f"Target Industry: {context['target_industry']}")
    if context.get("work_location"):
        lines.append(f"Work Location Preference: {context['work_location']}")
    
    # Academics
    if context.get("test_score"):
        test_type = context.get("test_type", "Test")
        lines.append(f"{test_type} Score: {context['test_score']}")
    if context.get("gpa"):
        lines.append(f"GPA: {context['gpa']}")
    
    # Professional
    if context.get("years_experience"):
        lines.append(f"Work Experience: {context['years_experience']} years")
    if context.get("current_role"):
        lines.append(f"Current Role: {context['current_role']}")
    if context.get("current_industry"):
        lines.append(f"Current Industry: {context['current_industry']}")
    
    # Additional context
    if context.get("career_switch"):
        lines.append("Career Switch: Yes")
    if context.get("nationality"):
        lines.append(f"Nationality: {context['nationality']}")
    
    return "\n".join(lines)