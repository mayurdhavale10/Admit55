# ml-service/pipeline/tools/profileresumetool/steps/context_builder.py
"""
Context Builder for MBA Profile Analysis
Converts discovery Q&A answers into consultant-grade context for LLM prompts.
"""

from typing import Dict, Optional


def build_consultant_context(discovery_answers: Optional[Dict[str, str]]) -> Dict[str, str]:
    """
    Transform discovery Q&A into LLM-readable context.
    
    Args:
        discovery_answers: Dictionary of question_id -> answer
        
    Returns:
        Dictionary with structured context for prompts
    """
    if not discovery_answers:
        return {}
    
    context = {}
    
    # Goal Type
    if "goal_type" in discovery_answers:
        context["goal"] = discovery_answers["goal_type"]
    
    # Target Schools / Tier
    if "target_schools" in discovery_answers:
        tier = discovery_answers["target_schools"]
        context["target_tier"] = tier
        
        # Extract tier category for easier prompt logic
        if "M7" in tier or "Harvard" in tier or "Stanford" in tier:
            context["tier_category"] = "M7"
        elif "Top 15" in tier or "Kellogg" in tier or "Booth" in tier:
            context["tier_category"] = "Top 15"
        elif "Top 25" in tier or "Darden" in tier or "Stern" in tier:
            context["tier_category"] = "Top 25"
        elif "ISB" in tier or "IIM" in tier:
            context["tier_category"] = "Indian B-Schools"
        else:
            context["tier_category"] = "Not specified"
    
    # Timeline (with urgency detection)
    if "timeline" in discovery_answers:
        timeline = discovery_answers["timeline"]
        context["timeline"] = timeline
        
        # Detect urgency level
        timeline_lower = timeline.lower()
        if "r1" in timeline_lower and "2025" in timeline_lower:
            context["timeline_urgency"] = "URGENT"
            context["timeline_months"] = "6 months"
        elif "r2" in timeline_lower and ("2025" in timeline_lower or "2026" in timeline_lower):
            context["timeline_urgency"] = "MODERATE"
            context["timeline_months"] = "9-12 months"
        elif "2026" in timeline_lower:
            context["timeline_urgency"] = "RELAXED"
            context["timeline_months"] = "12-18 months"
        elif "2027" in timeline_lower or "exploring" in timeline_lower:
            context["timeline_urgency"] = "EXPLORATORY"
            context["timeline_months"] = "18+ months"
        else:
            context["timeline_urgency"] = "MODERATE"
            context["timeline_months"] = "Unknown"
    
    # Test Status
    if "test_status" in discovery_answers:
        test = discovery_answers["test_status"]
        context["test_status"] = test
        
        # Flag test readiness
        test_lower = test.lower()
        if "not started" in test_lower:
            context["test_ready"] = "false"
            context["test_priority"] = "HIGH"
        elif "studying" in test_lower:
            context["test_ready"] = "false"
            context["test_priority"] = "MEDIUM"
        elif "730+" in test_lower or "330+" in test_lower:
            context["test_ready"] = "true"
            context["test_priority"] = "LOW"
        elif "700-730" in test_lower or "320-330" in test_lower:
            context["test_ready"] = "partial"
            context["test_priority"] = "MEDIUM"
        else:
            context["test_ready"] = "unknown"
            context["test_priority"] = "MEDIUM"
    
    # Work Experience
    if "work_experience" in discovery_answers:
        exp = discovery_answers["work_experience"]
        context["experience_level"] = exp
        
        # Extract years for prompt logic
        exp_lower = exp.lower()
        if "less than 3" in exp_lower or "< 3" in exp_lower:
            context["experience_years"] = "< 3"
            context["experience_flag"] = "Early career - may need to justify MBA timing"
        elif "3-5" in exp_lower:
            context["experience_years"] = "3-5"
            context["experience_flag"] = "Ideal range for top MBA programs"
        elif "5-7" in exp_lower:
            context["experience_years"] = "5-7"
            context["experience_flag"] = "Strong experience - highlight leadership growth"
        elif "7+" in exp_lower:
            context["experience_years"] = "7+"
            context["experience_flag"] = "Experienced applicant - emphasize career acceleration need"
        else:
            context["experience_years"] = "Unknown"
            context["experience_flag"] = ""
    
    # Biggest Concern
    if "biggest_concern" in discovery_answers:
        concern = discovery_answers["biggest_concern"]
        context["concern"] = concern
        
        # Map concern to focus area
        concern_lower = concern.lower()
        if "test" in concern_lower or "gmat" in concern_lower or "gre" in concern_lower:
            context["focus_area"] = "Test Preparation"
        elif "brand" in concern_lower or "company" in concern_lower or "college" in concern_lower:
            context["focus_area"] = "Resume Reframing & Impact Stories"
        elif "leadership" in concern_lower:
            context["focus_area"] = "Leadership Evidence & Team Management"
        elif "extracurricular" in concern_lower:
            context["focus_area"] = "Community Involvement & Extracurriculars"
        elif "goal" in concern_lower or "unclear" in concern_lower:
            context["focus_area"] = "Post-MBA Goal Clarity"
        elif "international" in concern_lower:
            context["focus_area"] = "Global Exposure & Perspective"
        else:
            context["focus_area"] = "General Profile Strengthening"
    
    # Commitment Level (if you add this question later)
    if "commitment_level" in discovery_answers:
        context["weekly_hours"] = discovery_answers["commitment_level"]
    
    # Budget (if you add this question later)
    if "budget" in discovery_answers:
        context["budget"] = discovery_answers["budget"]
    
    return context


def format_context_for_prompt(context: Dict[str, str]) -> str:
    """
    Format context dictionary into human-readable text for LLM prompts.
    
    Args:
        context: Dictionary from build_consultant_context()
        
    Returns:
        Formatted string suitable for prompt injection
    """
    if not context:
        return "No specific context provided. Analyze profile generically."
    
    lines = []
    
    # Goal
    if "goal" in context:
        lines.append(f"PRIMARY GOAL: {context['goal']}")
    
    # Target Tier
    if "target_tier" in context:
        lines.append(f"TARGET SCHOOLS: {context['target_tier']}")
        if "tier_category" in context:
            lines.append(f"  → Tier Category: {context['tier_category']}")
    
    # Timeline
    if "timeline" in context:
        urgency = context.get("timeline_urgency", "")
        months = context.get("timeline_months", "")
        lines.append(f"TIMELINE: {context['timeline']}")
        if urgency:
            lines.append(f"  → Urgency: {urgency} ({months})")
    
    # Test Status
    if "test_status" in context:
        priority = context.get("test_priority", "")
        lines.append(f"TEST STATUS: {context['test_status']}")
        if priority:
            lines.append(f"  → Priority: {priority}")
    
    # Work Experience
    if "experience_level" in context:
        flag = context.get("experience_flag", "")
        lines.append(f"WORK EXPERIENCE: {context['experience_level']}")
        if flag:
            lines.append(f"  → Note: {flag}")
    
    # Biggest Concern
    if "concern" in context:
        focus = context.get("focus_area", "")
        lines.append(f"BIGGEST CONCERN: {context['concern']}")
        if focus:
            lines.append(f"  → Focus Area: {focus}")
    
    # Additional fields
    if "weekly_hours" in context:
        lines.append(f"WEEKLY COMMITMENT: {context['weekly_hours']}")
    
    if "budget" in context:
        lines.append(f"PREP BUDGET: {context['budget']}")
    
    return "\n".join(lines)


def get_recommendation_distribution(context: Dict[str, str]) -> Dict[str, int]:
    """
    Calculate how to distribute recommendations across timeframes based on urgency.
    
    Args:
        context: Dictionary from build_consultant_context()
        
    Returns:
        Dictionary with counts for each timeframe
    """
    urgency = context.get("timeline_urgency", "MODERATE")
    
    # Distribution logic based on urgency
    if urgency == "URGENT":
        # Front-load actions: 70% in next 1-3 weeks
        return {
            "next_1_3_weeks": 7,
            "next_3_6_weeks": 3,
            "next_3_months": 2,
        }
    elif urgency == "MODERATE":
        # Balanced distribution
        return {
            "next_1_3_weeks": 4,
            "next_3_6_weeks": 4,
            "next_3_months": 3,
        }
    elif urgency == "RELAXED":
        # Even distribution with more long-term actions
        return {
            "next_1_3_weeks": 3,
            "next_3_6_weeks": 4,
            "next_3_months": 4,
        }
    else:  # EXPLORATORY
        # Focus on foundational work
        return {
            "next_1_3_weeks": 3,
            "next_3_6_weeks": 3,
            "next_3_months": 5,
        }


def should_prioritize_test_prep(context: Dict[str, str]) -> bool:
    """
    Determine if test prep should be a high priority based on context.
    
    Args:
        context: Dictionary from build_consultant_context()
        
    Returns:
        True if test prep should be prioritized
    """
    test_ready = context.get("test_ready", "unknown")
    urgency = context.get("timeline_urgency", "MODERATE")
    test_priority = context.get("test_priority", "MEDIUM")
    
    # High priority if: not started + urgent timeline
    if test_ready == "false" and urgency == "URGENT":
        return True
    
    # High priority if test_priority explicitly HIGH
    if test_priority == "HIGH":
        return True
    
    # Medium priority if not started + moderate timeline
    if test_ready == "false" and urgency == "MODERATE":
        return True
    
    return False


def get_tier_expectations(context: Dict[str, str]) -> Dict[str, str]:
    """
    Get expected benchmarks based on target tier.
    
    Args:
        context: Dictionary from build_consultant_context()
        
    Returns:
        Dictionary with tier-specific expectations
    """
    tier = context.get("tier_category", "Top 25")
    
    expectations = {
        "M7": {
            "gmat": "730+ (ideally 740+)",
            "work_impact": "Revenue/cost impact >$1M or strategic",
            "leadership": "Managed 3+ direct reports or led cross-functional teams",
            "brand": "FAANG/MBB/Unicorn/Fortune 500",
            "extracurriculars": "Founded or led major initiative (2+ years)",
        },
        "Top 15": {
            "gmat": "710-730+",
            "work_impact": "Measurable outcomes with quantified impact",
            "leadership": "Team lead roles or cross-team influence",
            "brand": "Well-known companies or Series B+ startups",
            "extracurriculars": "Consistent involvement (2+ years)",
        },
        "Top 25": {
            "gmat": "690-710+",
            "work_impact": "Clear contributions to team/company goals",
            "leadership": "Some team collaboration or project leadership",
            "brand": "Solid companies with growth trajectory",
            "extracurriculars": "Regular volunteering or community involvement",
        },
        "Indian B-Schools": {
            "gmat": "680+ (or CAT 99%ile)",
            "work_impact": "Strong work experience in Indian/global companies",
            "leadership": "Team management or project ownership",
            "brand": "Top Indian companies or MNCs",
            "extracurriculars": "Community service or leadership outside work",
        },
    }
    
    return expectations.get(tier, expectations["Top 25"])


# Convenience function for backwards compatibility
def build_context(discovery_answers: Optional[Dict[str, str]]) -> Dict[str, str]:
    """Alias for build_consultant_context"""
    return build_consultant_context(discovery_answers)