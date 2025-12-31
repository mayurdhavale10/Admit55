# ml-service/pipeline/tools/bschoolmatchtool/steps/fit_story.py
from __future__ import annotations

from typing import Dict, Any, List
import json
import re

from ..llm_wrapper import call_llm  # ✅ correct import (module exists)


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
    prompt = build_fit_story_prompt(context, tiered_schools)

    try:
        response = call_llm(
            prompt=prompt,
            settings=settings,
            fallback=fallback,
            max_tokens=800,
            temperature=0.7
        )

        fit_story = _safe_parse_json_object(response)

        return {
            "strengths": list(fit_story.get("strengths", []))[:4],
            "concerns": list(fit_story.get("concerns", []))[:4],
            "improvements": list(fit_story.get("improvements", []))[:5],
        }

    except Exception as e:
        print(f"[FitStory] AI generation failed: {e}")
        return _fallback_fit_story(context)


def build_fit_story_prompt(
    context: Dict[str, Any],
    tiered_schools: Dict[str, List[Dict[str, Any]]]
) -> str:
    """Build the prompt for fit story generation."""
    ambitious = [s.get("school_name") or s.get("name") for s in tiered_schools.get("ambitious", [])]
    target = [s.get("school_name") or s.get("name") for s in tiered_schools.get("target", [])]
    safe = [s.get("school_name") or s.get("name") for s in tiered_schools.get("safe", [])]

    def _join(xs: List[Any]) -> str:
        xs = [str(x).strip() for x in xs if x]
        return ", ".join(xs) if xs else "N/A"

    return f"""
You are an MBA admissions consultant. Analyze the candidate profile and the school tiers.
Return ONLY valid JSON object with keys: strengths, concerns, improvements (arrays of short strings).

CANDIDATE CONTEXT:
- Target role: {context.get("target_role", "")}
- Target industry: {context.get("target_industry", "")}
- Work location: {context.get("work_location", "")}
- Years experience: {context.get("years_experience", "")}
- Test score normalized: {context.get("test_score_normalized", "")}
- GPA normalized: {context.get("gpa_normalized", "")}
- Career switch: {context.get("career_switch", False)}
- Nationality: {context.get("nationality", "")}
- Leadership: {context.get("has_leadership", "")}

SCHOOL TIERS:
- Ambitious: {_join(ambitious)}
- Target: {_join(target)}
- Safe: {_join(safe)}

OUTPUT FORMAT (JSON only):
{{
  "strengths": ["...", "..."],
  "concerns": ["...", "..."],
  "improvements": ["...", "..."]
}}
""".strip()


def _safe_parse_json_object(text: str) -> Dict[str, Any]:
    """
    Parses an LLM response into a JSON object robustly.
    - strips ```json fences
    - extracts first {...} block if extra text exists
    """
    cleaned = (text or "").strip()

    # Strip code fences
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    # If response contains extra text, extract first JSON object
    if not cleaned.startswith("{"):
        m = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if m:
            cleaned = m.group(0).strip()

    obj = json.loads(cleaned)
    if not isinstance(obj, dict):
        raise ValueError("Fit story response is not a JSON object")
    return obj


def _fallback_fit_story(context: Dict[str, Any]) -> Dict[str, List[str]]:
    """Fallback fit story if AI fails."""

    strengths: List[str] = []
    concerns: List[str] = []
    improvements: List[str] = []

    # Strengths
    years_exp = context.get("years_experience", 0) or 0
    try:
        years_exp_num = int(years_exp)
    except Exception:
        years_exp_num = 0

    if years_exp_num >= 4:
        strengths.append(f"{years_exp_num} years of experience shows career progression and maturity")

    test_score = context.get("test_score_normalized", 0)
    try:
        test_score_num = int(test_score) if test_score is not None else 0
    except Exception:
        test_score_num = 0

    if test_score_num >= 720:
        strengths.append(f"Strong {test_score_num} test score demonstrates academic readiness")

    if context.get("target_role"):
        strengths.append(f"Clear career goal: {context['target_role']}")

    if context.get("has_leadership"):
        strengths.append("Demonstrated leadership experience")

    # Concerns
    gpa = context.get("gpa_normalized", None)
    try:
        gpa_num = float(gpa) if gpa is not None else None
    except Exception:
        gpa_num = None

    if gpa_num is not None and gpa_num < 3.5:
        concerns.append(f"GPA {gpa_num:.1f} is below median at top schools")

    if "india" in str(context.get("nationality", "")).lower():
        concerns.append("Indian applicant pools can be competitive; differentiation matters")

    if years_exp_num < 2:
        concerns.append("Limited work experience (many admits have ~4-6 years)")
    elif years_exp_num > 10:
        concerns.append("Longer work experience may be better suited for EMBA programs")

    if not context.get("has_leadership"):
        concerns.append("Limited leadership examples may weaken application")

    # Improvements
    if test_score_num and test_score_num < 730:
        improvements.append("Retake GMAT/GRE (target higher score) to strengthen ambitious tier applications")
    elif not test_score_num:
        improvements.append("Take/submit a competitive test score (or build a strong test-waiver alternative)")

    if gpa_num is not None and gpa_num < 3.5:
        improvements.append("Take online quant/analytics courses to demonstrate academic ability")

    improvements.append("Highlight unique extracurriculars or side projects to differentiate")
    improvements.append("Get recommendations from senior leaders who can speak to impact")
    improvements.append("In essays, write a specific 'why MBA, why now' tied to your story and goals")

    return {
        "strengths": strengths[:4] if strengths else ["Review your profile to identify key strengths"],
        "concerns": concerns[:4] if concerns else ["No major concerns identified"],
        "improvements": improvements[:5],
    }
