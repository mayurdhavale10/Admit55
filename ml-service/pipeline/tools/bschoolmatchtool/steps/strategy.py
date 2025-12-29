# ml-service/pipeline/tools/bschoolmatchtool/steps/strategy.py
from __future__ import annotations
from typing import Dict, Any, List
import json
from ..prompts.strategy import build_strategy_prompt

def generate_strategy(
    context: Dict[str, Any],
    tiered_schools: Dict[str, List[Dict[str, Any]]],
    settings: Any,
    fallback: Any = None
) -> Dict[str, Any]:
    """
    Generate application strategy.
    
    Returns dict with: portfolio, essayTheme, focusAreas, timeline
    """
    
    from pipeline.core.llm_router import call_llm
    
    prompt = build_strategy_prompt(context, tiered_schools)
    
    try:
        response = call_llm(
            prompt=prompt,
            settings=settings,
            fallback=fallback,
            max_tokens=600,
            temperature=0.7
        )
        
        # Parse JSON
        cleaned = response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        strategy = json.loads(cleaned)
        
        return {
            "portfolio": strategy.get("portfolio", [])[:3],
            "essayTheme": strategy.get("essayTheme", ""),
            "focusAreas": strategy.get("focusAreas", [])[:4],
            "timeline": strategy.get("timeline", ""),
        }
        
    except Exception as e:
        print(f"[Strategy] AI generation failed: {e}")
        return _fallback_strategy(context, tiered_schools)


def _fallback_strategy(
    context: Dict[str, Any],
    tiered: Dict[str, List[Dict[str, Any]]]
) -> Dict[str, Any]:
    """Fallback strategy if AI fails."""
    
    # Portfolio
    ambitious = tiered.get("ambitious", [])
    target = tiered.get("target", [])
    safe = tiered.get("safe", [])
    
    portfolio = []
    if ambitious:
        names = [s["school_name"] for s in ambitious[:2]]
        portfolio.append(f"2 Ambitious ({', '.join(names)})")
    
    if target:
        names = [s["school_name"] for s in target[:4]]
        portfolio.append(f"4 Target ({', '.join(names)})")
    
    if safe:
        names = [s["school_name"] for s in safe[:2]]
        portfolio.append(f"2 Safe ({', '.join(names)})")
    
    # Essay theme
    target_role = context.get("target_role", "")
    target_industry = context.get("target_industry", "")
    current_industry = context.get("current_industry", "")
    
    if target_role and target_industry:
        essay_theme = f"{current_industry} professional transitioning to {target_role} in {target_industry}"
    else:
        essay_theme = "Experienced professional seeking to scale impact through MBA"
    
    # Focus areas
    focus_areas = [
        "Leadership experience and measurable impact",
        "Clear post-MBA goals with specific companies/roles",
        "Unique differentiators (extracurriculars, side projects)",
    ]
    
    if context.get("career_switch"):
        focus_areas.append("Transferable skills and compelling career switch rationale")
    
    # Timeline
    timeline = "R1 Deadline: September 15 • Prepare over summer • Target 6-8 schools"
    
    return {
        "portfolio": portfolio,
        "essayTheme": essay_theme,
        "focusAreas": focus_areas,
        "timeline": timeline,
    }