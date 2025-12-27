# ml-service/pipeline/tools/profileresumetool/steps/recommendations.py
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from pipeline.core.llm.retry import call_llm
from pipeline.core.parsing.json_parse import parse_json_strictish

from ..version import PIPELINE_VERSION, TOKENS
from ..prompts import context_block, prompt_prefix
from ..prompts.recommendations import RECOMMENDATIONS_PROMPT
from . import as_list, as_str, clamp_int, normalize_timeframe_to_key, response_format_for

VALID_TF = {"next_1_3_weeks", "next_3_6_weeks", "next_3_months"}

def _default_recs() -> List[Dict[str, Any]]:
    return [
        {
            "id": "rec_1",
            "type": "resume",
            "area": "Quantify impact bullets",
            "priority": "high",
            "timeframe": "next_1_3_weeks",
            "action": "Rewrite top 6 bullets to include metrics (%, ₹/$, scale, time saved). Create: updated 1-page resume PDF + proof-note per bullet.",
            "estimated_impact": "Quantified impact is a high-signal MBA admissions marker for results + leadership.",
            "score": 70,
            "current_score": 60,
        },
        {
            "id": "rec_2",
            "type": "networking",
            "area": "Leadership story bank",
            "priority": "high",
            "timeframe": "next_3_6_weeks",
            "action": "Build 6 STAR stories (Leadership, Failure, Conflict, Innovation, Team, Ethics). Create: 6 one-page story docs + 90-sec spoken version each.",
            "estimated_impact": "Stronger essays/interviews and clearer 'why MBA/why now'.",
            "score": 72,
            "current_score": 62,
        },
        {
            "id": "rec_3",
            "type": "career",
            "area": "Post-MBA goal clarity",
            "priority": "medium",
            "timeframe": "next_3_months",
            "action": "Draft a 1-page career hypothesis (target roles/industries + 3 reasons + 3 proof points). Create: 1-pager + 10 networking Qs.",
            "estimated_impact": "Clear goals reduce AdCom risk and improves narrative coherence.",
            "score": 68,
            "current_score": 58,
        },
    ]

def _normalize_recs(items: Any) -> List[Dict[str, Any]]:
    recs = as_list(items)
    out: List[Dict[str, Any]] = []
    for i, r in enumerate(recs, start=1):
        if not isinstance(r, dict):
            continue

        score_int = clamp_int(r.get("score", r.get("current_score", 70)), 0, 100, 70)
        current_int = clamp_int(r.get("current_score", score_int), 0, 100, score_int)

        tf = normalize_timeframe_to_key(r.get("timeframe"))
        if tf not in VALID_TF:
            tf = "unknown"

        out.append({
            "id": as_str(r.get("id")) or f"rec_{i}",
            "type": as_str(r.get("type")) or "other",
            "area": as_str(r.get("area")) or "General",
            "priority": (as_str(r.get("priority")) or "medium").lower(),
            "timeframe": tf,
            "action": as_str(r.get("action")) or "Create one concrete output artifact that improves this area.",
            "estimated_impact": as_str(r.get("estimated_impact")) or "Improves overall competitiveness.",
            "score": score_int,
            "current_score": current_int,
        })

    if not out:
        out = _default_recs()

    # ensure all TF valid keys
    for r in out:
        r["timeframe"] = normalize_timeframe_to_key(r.get("timeframe"))
        if r["timeframe"] not in VALID_TF:
            r["timeframe"] = "next_3_6_weeks"

    # ensure at least 2 per bucket
    buckets = {"next_1_3_weeks": 0, "next_3_6_weeks": 0, "next_3_months": 0}
    for r in out:
        buckets[r["timeframe"]] += 1

    # add defaults to missing buckets
    if buckets["next_1_3_weeks"] < 2:
        out.append({
            "id": "rec_fill_urgent",
            "type": "resume",
            "area": "Fix top-of-resume positioning",
            "priority": "high",
            "timeframe": "next_1_3_weeks",
            "action": "Rewrite summary + top 3 bullets to align to target MBA goals. Create: v2 resume + a 6-line positioning statement.",
            "estimated_impact": "Improves first-impression clarity and AdCom comprehension.",
            "score": 70,
            "current_score": 60,
        })
    if buckets["next_3_6_weeks"] < 2:
        out.append({
            "id": "rec_fill_mid",
            "type": "networking",
            "area": "School/role validation calls",
            "priority": "medium",
            "timeframe": "next_3_6_weeks",
            "action": "Do 6 informational calls (2 per target function). Create: call-notes + 1-page insights doc + updated goal rationale.",
            "estimated_impact": "Stronger goal credibility and better essays/interviews.",
            "score": 70,
            "current_score": 60,
        })
    if buckets["next_3_months"] < 2:
        out.append({
            "id": "rec_fill_long",
            "type": "career",
            "area": "Application system build",
            "priority": "low",
            "timeframe": "next_3_months",
            "action": "Create a school tracker + essay outline bank. Create: spreadsheet + 10 essay bullets per school (why us, goals, leadership).",
            "estimated_impact": "Reduces application chaos and improves consistency.",
            "score": 70,
            "current_score": 60,
        })

    return out

def run_recommendations(
    resume_text: str,
    scores: Dict[str, float],
    strengths: List[Dict[str, Any]],
    improvements: List[Dict[str, Any]],
    settings,
    fallback,
    context: Optional[Dict[str, str]],
) -> List[Dict[str, Any]]:
    prompt = prompt_prefix(PIPELINE_VERSION) + RECOMMENDATIONS_PROMPT.format(
        resume=resume_text or "",
        scores=json.dumps(scores, indent=2),
        strengths=json.dumps(strengths, indent=2),
        improvements=json.dumps(improvements, indent=2),
        context=context_block(context),
    )

    try:
        raw = call_llm(
            settings=settings,
            prompt=prompt,
            max_tokens=TOKENS["recommendations"],
            temperature=0.3,
            response_format=response_format_for(getattr(settings, "provider", "")),
            fallback=fallback,
            retries=1,
        )
        data = parse_json_strictish(raw)
        return _normalize_recs(data.get("recommendations"))
    except Exception:
        return _normalize_recs([])
