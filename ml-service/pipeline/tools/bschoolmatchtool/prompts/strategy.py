# ml-service/pipeline/tools/bschoolmatchtool/prompts/strategy.py

def build_strategy_prompt(context: dict, tiered_schools: dict) -> str:
    """Build prompt for application strategy."""
    
    context_str = _format_context(context)
    schools_str = _format_schools(tiered_schools)
    
    return f"""You are a top MBA admissions consultant. Create an APPLICATION STRATEGY for this candidate.

{context_str}

{schools_str}

Generate a strategy with:

1. PORTFOLIO: Which schools to apply to (2 ambitious, 4 target, 2 safe)
2. ESSAY_THEME: One-sentence positioning statement for essays
3. FOCUS_AREAS: 3-4 things to emphasize in applications
4. TIMELINE: Brief timeline note (e.g., "R1 deadline Sept 15, retake GMAT by June")

Return ONLY valid JSON:
{{
  "portfolio": ["2 Ambitious (Harvard, Booth)", "4 Target (...)", "2 Safe (...)"],
  "essayTheme": "Tech PM scaling impact through strategy consulting",
  "focusAreas": ["Product launches", "Team leadership", "Non-profit board"],
  "timeline": "R1 Sept 15 • GMAT by June • Essays July-Aug"
}}

Be specific and tactical.
"""


def _format_context(context: dict) -> str:
    lines = ["CANDIDATE:"]
    if context.get("target_role"):
        lines.append(f"- Goal: {context['target_role']} in {context.get('target_industry', '')}")
    if context.get("test_score_normalized"):
        lines.append(f"- Score: {context['test_score_normalized']}")
    if context.get("years_experience"):
        lines.append(f"- Experience: {context['years_experience']} years")
    return "\n".join(lines)


def _format_schools(tiered: dict) -> str:
    lines = ["MATCHED SCHOOLS:"]
    for tier in ["ambitious", "target", "safe"]:
        schools = tiered.get(tier, [])
        if schools:
            names = [s["school_name"] for s in schools[:4]]
            lines.append(f"{tier.upper()}: {', '.join(names)}")
    return "\n".join(lines)