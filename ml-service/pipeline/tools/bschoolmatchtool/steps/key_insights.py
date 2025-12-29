# ml-service/pipeline/tools/bschoolmatchtool/steps/key_insights.py
from __future__ import annotations
from typing import Dict, Any, List
import json
from ..prompts.key_insights import build_key_insights_prompt

def generate_insights(
    context: Dict[str, Any],
    tiered_schools: Dict[str, List[Dict[str, Any]]],
    settings: Any,
    fallback: Any = None
) -> List[str]:
    """
    Generate 3-4 key insights using AI.
    
    Returns list of insight strings.
    """
    
    from ..llm_wrapper import call_llm
    
    prompt = build_key_insights_prompt(context, tiered_schools)
    
    try:
        response = call_llm(
            prompt=prompt,
            settings=settings,
            fallback=fallback,
            max_tokens=500,
            temperature=0.7
        )
        
        # Parse JSON response
        cleaned = response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        insights = json.loads(cleaned)
        
        if isinstance(insights, list) and len(insights) >= 3:
            return insights[:4]
        else:
            return _fallback_insights(context, tiered_schools)
            
    except Exception as e:
        print(f"[KeyInsights] AI generation failed: {e}")
        return _fallback_insights(context, tiered_schools)


def _fallback_insights(context: Dict[str, Any], tiered: Dict[str, List]) -> List[str]:
    """Fallback insights if AI fails."""
    
    insights = []
    
    # Insight 1: Competitive positioning
    test_score = context.get("test_score_normalized", 700)
    ambitious_count = len(tiered.get("ambitious", []))
    target_count = len(tiered.get("target", []))
    
    if test_score >= 730:
        insights.append(f"Your {test_score} GMAT makes you competitive at top 10 programs. Focus on differentiating your story in essays.")
    elif test_score >= 710:
        insights.append(f"Your {test_score} GMAT is strong for top 15-20 programs. Consider retaking for ambitious tier schools.")
    else:
        insights.append(f"Your {test_score} GMAT is solid. Focus on target tier schools where you're above median.")
    
    # Insight 2: School portfolio
    total = ambitious_count + target_count + len(tiered.get("safe", []))
    insights.append(f"We've identified {total} schools across 3 tiers. Apply to 6-8 schools with a 2-4-2 distribution (Ambitious-Target-Safe).")
    
    # Insight 3: Industry alignment
    target_industry = context.get("target_industry", "")
    if target_industry:
        insights.append(f"Focus on schools with strong {target_industry} placement. Your target schools are well-aligned with this goal.")
    
    # Insight 4: Differentiation
    nationality = context.get("nationality", "")
    if "india" in nationality.lower():
        insights.append("Indian male tech → consulting is common. Differentiate through unique extracurriculars, leadership, or non-profit work.")
    elif context.get("career_switch"):
        insights.append("Career switchers should emphasize transferable skills and clear post-MBA goals in essays.")
    else:
        insights.append("Leverage your unique experiences and clear goals to stand out in the applicant pool.")
    
    return insights[:4]