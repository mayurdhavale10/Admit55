# ml-service/pipeline/tools/bschoolmatchtool/steps/strategy.py
from __future__ import annotations

from typing import Dict, Any, List
import json
import re

from ..prompts.strategy import build_strategy_prompt
from ..llm_wrapper import call_llm  # ✅ correct import


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
    prompt = build_strategy_prompt(context, tiered_schools)

    try:
        response = call_llm(
            prompt=prompt,
            settings=settings,
            fallback=fallback,
            max_tokens=600,
            temperature=0.7
        )

        strategy = _safe_parse_json_object(response)

        return {
            "portfolio": list(strategy.get("portfolio", []))[:3],
            "essayTheme": str(strategy.get("essayTheme", "")),
            "focusAreas": list(strategy.get("focusAreas", []))[:4],
            "timeline": str(strategy.get("timeline", "")),
        }

    except Exception as e:
        print(f"[Strategy] AI generation failed: {e}")
        return _fallback_strategy(context, tiered_schools)


def _safe_parse_json_object(text: str) -> Dict[str, Any]:
    """
    Robust JSON object parsing from LLM outputs:
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

    # Extract first JSON object if the model added extra text
    if not cleaned.startswith("{"):
        m = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if m:
            cleaned = m.group(0).strip()

    obj = json.loads(cleaned)
    if not isinstance(obj, dict):
        raise ValueError("Strategy response is not a JSON object")
    return obj


def _fallback_strategy(
    context: Dict[str, Any],
    tiered: Dict[str, List[Dict[str, Any]]]
) -> Dict[str, Any]:
    """Fallback strategy if AI fails."""

    ambitious = tiered.get("ambitious", []) or []
    target = tiered.get("target", []) or []
    safe = tiered.get("safe", []) or []

    portfolio: List[str] = []

    if ambitious:
        names = [str(s.get("school_name") or s.get("name") or "Unknown") for s in ambitious[:2]]
        portfolio.append(f"2 Ambitious ({', '.join(names)})")

    if target:
        names = [str(s.get("school_name") or s.get("name") or "Unknown") for s in target[:4]]
        portfolio.append(f"4 Target ({', '.join(names)})")

    if safe:
        names = [str(s.get("school_name") or s.get("name") or "Unknown") for s in safe[:2]]
        portfolio.append(f"2 Safe ({', '.join(names)})")

    target_role = context.get("target_role", "") or ""
    target_industry = context.get("target_industry", "") or ""
    current_industry = context.get("current_industry", "") or ""

    if target_role and target_industry:
        essay_theme = f"{current_industry} professional transitioning to {target_role} in {target_industry}".strip()
    else:
        essay_theme = "Experienced professional seeking to scale impact through MBA"

    focus_areas = [
        "Leadership experience and measurable impact",
        "Clear post-MBA goals with specific companies/roles",
        "Unique differentiators (extracurriculars, side projects)",
    ]

    if bool(context.get("career_switch")):
        focus_areas.append("Transferable skills and compelling career switch rationale")

    timeline = "R1 Deadline: September 15 • Prepare over summer • Target 6-8 schools"

    return {
        "portfolio": portfolio,
        "essayTheme": essay_theme,
        "focusAreas": focus_areas,
        "timeline": timeline,
    }
