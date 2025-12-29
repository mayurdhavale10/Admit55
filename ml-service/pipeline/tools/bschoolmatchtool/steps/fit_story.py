# ml-service/pipeline/tools/bschoolmatchtool/steps/fit_story.py
from __future__ import annotations
from typing import Dict, Any, List
import json
from ..prompts.fit_story import build_fit_story_prompt

def generate_fit_story(
    context: Dict[str, Any],
    tiered_schools: Dict[str, List[Dict[str, Any]]],
    settings: Any,
    fallback: Any = None
) -> Dict[str, List[str]]:
    """
    Generate fit story analysis: strengths, concerns, improvements.
    
    Returns dict with keys: strengths, concerns, improvements
    """
    
    from pipeline.core.llm_router import call_llm
    
    prompt = build_fit_story_prompt(context, tiered_schools)
    
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
        
        fit_story = json.loads(cleaned)
        
        return {
            "strengths": fit_story.get("strengths", [])[:4],
            "concerns": fit_story.get("concerns", [])[:4],
            "improvements": fit_story.get("improvements", [])[:5],
        }
        
    except Exception as e:
        print(f"[FitStory] AI generation failed: {e}")
        return _fallback_fit_story(context)


def _fallback_fit_story(context: Dict[str, Any]) -> Dict[str, List[str]]:
    """Fallback fit story if AI fails."""
    
    strengths = []
    concerns = []
    improvements = []
    
    # Strengths
    years_exp = context.get("years_experience", 0)
    if years_exp >= 4:
        strengths.append(f"{years_exp} years of experience shows career progression and maturity")
    
    test_score = context.get("test_score_normalized", 0)
    if test_score >= 720:
        strengths.append(f"Strong {test_score} test score demonstrates academic readiness")
    
    if context.get("target_role"):
        strengths.append(f"Clear career goal: {context['target_role']}")
    
    if context.get("has_leadership"):
        strengths.append("Demonstrated leadership experience")
    
    # Concerns
    gpa = context.get("gpa_normalized", 3.5)
    if gpa < 3.5:
        concerns.append(f"GPA {gpa:.1f} is below median at top schools")
    
    if "india" in context.get("nationality", "").lower():
        concerns.append("Indian male tech → consulting is overrepresented; need strong differentiation")
    
    if years_exp < 2:
        concerns.append("Limited work experience (most admits have 4-6 years)")
    elif years_exp > 10:
        concerns.append("Longer work experience may be better suited for EMBA programs")
    
    if not context.get("has_leadership"):
        concerns.append("Limited leadership examples may weaken application")
    
    # Improvements
    if test_score < 730:
        improvements.append(f"Retake GMAT/GRE (target 730+) to strengthen ambitious tier applications")
    
    if gpa < 3.5:
        improvements.append("Take online quant courses to demonstrate academic ability")
    
    improvements.append("Highlight unique extracurriculars or side projects to differentiate")
    improvements.append("Get recommendations from senior leaders who can speak to impact")
    improvements.append("In essays, focus on specific 'why MBA, why now' beyond salary increase")
    
    return {
        "strengths": strengths[:4] if strengths else ["Review your profile to identify key strengths"],
        "concerns": concerns[:4] if concerns else ["No major concerns identified"],
        "improvements": improvements[:5],
    }