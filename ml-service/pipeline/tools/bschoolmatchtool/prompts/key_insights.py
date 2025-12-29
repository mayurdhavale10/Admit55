# ml-service/pipeline/tools/bschoolmatchtool/prompts/key_insights.py

def build_key_insights_prompt(context: dict, tiered_schools: dict) -> str:
    """Build prompt for generating 3-4 key insights."""
    
    context_str = _format_context(context)
    schools_str = _format_tiered_schools(tiered_schools)
    
    return f"""You are a top MBA admissions consultant. Generate 3-4 KEY INSIGHTS for this candidate's B-school match.

{context_str}

MATCHED SCHOOLS:
{schools_str}

Generate exactly 3-4 concise, actionable insights (1-2 sentences each) that:
1. Highlight their competitive positioning
2. Point out strategic advantages or gaps
3. Give specific school/application guidance
4. Are direct and consultative (no fluff)

Return ONLY a JSON array of strings:
["insight 1", "insight 2", "insight 3", "insight 4"]

Examples:
- "Your 720 GMAT + tech background make you competitive at top 15 programs, especially those with strong tech placement like Ross and Fuqua."
- "Indian male tech → consulting is overrepresented; differentiate through unique extracurriculars or non-profit leadership."
- "Consider retaking GMAT (target 740+) to strengthen ambitious tier applications at HBS and Stanford."
"""


def _format_context(context: dict) -> str:
    lines = ["CANDIDATE PROFILE:"]
    if context.get("target_role"):
        lines.append(f"- Goal: {context['target_role']} in {context.get('target_industry', 'N/A')}")
    if context.get("test_score_normalized"):
        lines.append(f"- GMAT/GRE: {context['test_score_normalized']}")
    if context.get("gpa_normalized"):
        lines.append(f"- GPA: {context['gpa_normalized']:.1f}")
    if context.get("years_experience"):
        lines.append(f"- Experience: {context['years_experience']} years in {context.get('current_industry', 'N/A')}")
    if context.get("nationality"):
        lines.append(f"- Background: {context['nationality']}")
    return "\n".join(lines)


def _format_tiered_schools(tiered: dict) -> str:
    lines = []
    for tier in ["ambitious", "target", "safe"]:
        schools = tiered.get(tier, [])
        if schools:
            names = [s["school_name"] for s in schools[:3]]
            lines.append(f"{tier.upper()}: {', '.join(names)}")
    return "\n".join(lines)