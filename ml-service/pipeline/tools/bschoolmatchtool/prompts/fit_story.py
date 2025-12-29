# ml-service/pipeline/tools/bschoolmatchtool/prompts/fit_story.py

def build_fit_story_prompt(context: dict, tiered_schools: dict) -> str:
    """Build prompt for generating fit story analysis."""
    
    context_str = _format_context(context)
    
    return f"""You are a top MBA admissions consultant analyzing a candidate's application story.

{context_str}

Generate a FIT STORY analysis with 3 sections:

1. WHAT ADMISSIONS COMMITTEES WILL LIKE (strengths)
   - 3-4 specific strengths that make them attractive
   - Focus on leadership, impact, differentiation
   
2. WHAT RAISES QUESTIONS (concerns)
   - 3-4 potential red flags or weaknesses
   - Be honest and specific
   
3. HOW TO STRENGTHEN (improvements)
   - 4-5 actionable steps to address concerns
   - Specific, tactical advice

Return ONLY valid JSON:
{{
  "strengths": ["strength 1", "strength 2", ...],
  "concerns": ["concern 1", "concern 2", ...],
  "improvements": ["fix 1", "fix 2", ...]
}}

Be direct, consultative, and specific. No fluff.
"""


def _format_context(context: dict) -> str:
    lines = ["CANDIDATE PROFILE:"]
    
    if context.get("target_role"):
        lines.append(f"Goal: {context['target_role']} in {context.get('target_industry', 'N/A')}")
    
    if context.get("test_score_normalized"):
        lines.append(f"GMAT/GRE: {context['test_score_normalized']}")
    
    if context.get("gpa_normalized"):
        lines.append(f"GPA: {context['gpa_normalized']:.1f}")
    
    if context.get("years_experience"):
        lines.append(f"Experience: {context['years_experience']} years in {context.get('current_industry', 'N/A')}")
    
    if context.get("current_role"):
        lines.append(f"Current Role: {context['current_role']}")
    
    if context.get("has_leadership"):
        lines.append(f"Leadership: {context['has_leadership']}")
    
    if context.get("nationality"):
        lines.append(f"Background: {context['nationality']}")
    
    if context.get("career_switch"):
        lines.append("Career Switch: Yes")
    
    if context.get("resume_text"):
        lines.append(f"\nRESUME EXCERPT:\n{context['resume_text'][:1000]}")
    
    return "\n".join(lines)