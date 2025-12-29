# ml-service/pipeline/tools/bschoolmatchtool/steps/action_plan.py
from __future__ import annotations
from typing import Dict, Any, List
import json
from ..prompts.action_plan import build_action_plan_prompt

def generate_action_plan(
    context: Dict[str, Any],
    strategy: Dict[str, Any],
    settings: Any,
    fallback: Any = None
) -> Dict[str, List[Dict[str, str]]]:
    """
    Generate 12-week action plan.
    
    Returns dict with: weeks_1_2, weeks_3_6, weeks_7_12
    """
    
    from ..llm_wrapper import call_llm
    
    prompt = build_action_plan_prompt(context, strategy)
    
    try:
        response = call_llm(
            prompt=prompt,
            settings=settings,
            fallback=fallback,
            max_tokens=800,
            temperature=0.7
        )
        
        # Parse JSON
        cleaned = response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        plan = json.loads(cleaned)
        
        return {
            "weeks_1_2": plan.get("weeks_1_2", [])[:3],
            "weeks_3_6": plan.get("weeks_3_6", [])[:4],
            "weeks_7_12": plan.get("weeks_7_12", [])[:4],
        }
        
    except Exception as e:
        print(f"[ActionPlan] AI generation failed: {e}")
        return _fallback_action_plan(context)


def _fallback_action_plan(context: Dict[str, Any]) -> Dict[str, List[Dict[str, str]]]:
    """Fallback action plan if AI fails."""
    
    weeks_1_2 = [
        {"title": "Finalize school list", "description": "Select 6-8 schools across Ambitious/Target/Safe tiers"},
        {"title": "Order transcripts", "description": "Request official transcripts from all universities"},
        {"title": "Identify recommenders", "description": "Choose 2-3 recommenders and brief them on your goals"},
    ]
    
    weeks_3_6 = [
        {"title": "GMAT/GRE preparation", "description": "Target 740+ GMAT or equivalent GRE score"},
        {"title": "Attend info sessions", "description": "Join virtual events for target schools"},
        {"title": "Connect with alumni", "description": "Reach out to 2-3 alumni per school via LinkedIn"},
        {"title": "Research essay prompts", "description": "Analyze past year essays and start brainstorming"},
    ]
    
    weeks_7_12 = [
        {"title": "Draft essays", "description": "First drafts for all schools (3-4 weeks)"},
        {"title": "Request recommendations", "description": "Give recommenders 4-week notice minimum"},
        {"title": "Finalize applications", "description": "Review, proofread, and polish all materials"},
        {"title": "Submit Round 1", "description": "Submit all applications before R1 deadline"},
    ]
    
    # Adjust if they need to retake test
    test_score = context.get("test_score_normalized", 0)
    if test_score and test_score < 720:
        weeks_3_6.insert(0, {
            "title": "Retake GMAT/GRE", 
            "description": "Schedule retake for 8-10 weeks out, target 730+"
        })
    
    return {
        "weeks_1_2": weeks_1_2,
        "weeks_3_6": weeks_3_6[:4],
        "weeks_7_12": weeks_7_12,
    }