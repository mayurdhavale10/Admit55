# ml-service/pipeline/core/normalization/recommendations.py

from typing import Any, Dict, List
from ..parsing.coercion import as_list, as_str, clamp_int
from .timeframe import normalize_timeframe_key


def normalize_recommendations(raw_recs: Any) -> List[Dict]:
    recs = as_list(raw_recs)
    out: List[Dict] = []

    for i, r in enumerate(recs, start=1):
        if not isinstance(r, dict):
            continue

        score_int = clamp_int(r.get("score", r.get("rating", 70)), 0, 100, 70)
        current_int = clamp_int(r.get("current_score", score_int), 0, 100, score_int)

        tf = normalize_timeframe_key(r.get("timeframe"))
        if tf == "unknown":
            tf = normalize_timeframe_key(r.get("action"))

        out.append(
            {
                "id": as_str(r.get("id")) or f"rec_{i}",
                "type": as_str(r.get("type")) or "other",
                "area": as_str(r.get("area")) or "General",
                "priority": (as_str(r.get("priority")) or "medium").lower(),
                "timeframe": tf,
                "action": as_str(r.get("action")) or "Create one concrete output artifact that improves this area.",
                "estimated_impact": as_str(r.get("estimated_impact")) or "Improves overall competitiveness.",
                "score": score_int,
                "current_score": current_int,
            }
        )

    # Ensure non-empty defaults
    if not out:
        out = [
            {
                "id": "rec_1",
                "type": "resume",
                "area": "Quantify impact bullets",
                "priority": "high",
                "timeframe": "next_4_6_weeks",
                "action": "Rewrite top 6 bullets with metrics (%, ₹/$, time saved, scale). Output: updated 1-page resume PDF + a proof-note per metric.",
                "estimated_impact": "Quantified impact is a strong MBA signal and improves credibility instantly.",
                "score": 70,
                "current_score": 60,
            },
            {
                "id": "rec_2",
                "type": "networking",
                "area": "Story bank for essays/interviews",
                "priority": "high",
                "timeframe": "next_4_6_weeks",
                "action": "Write 3 STAR stories (Leadership, Failure, Conflict). Output: 3 one-page story docs + 90-second spoken version for each.",
                "estimated_impact": "Stronger essays/interviews and clearer narrative for AdCom.",
                "score": 72,
                "current_score": 62,
            },
            {
                "id": "rec_3",
                "type": "career",
                "area": "Goal clarity + school fit",
                "priority": "medium",
                "timeframe": "next_3_months",
                "action": "Draft a 1-page career hypothesis (target roles/industries + proof points). Output: 1-page doc + 10 networking questions tailored to path.",
                "estimated_impact": "Clear goals reduce AdCom risk and improve essay coherence.",
                "score": 68,
                "current_score": 58,
            },
        ]

    # Enforce valid timeframes
    for r in out:
        r["timeframe"] = normalize_timeframe_key(r.get("timeframe"))

    # Optional: ensure both buckets have at least 2 items
    b1 = [x for x in out if x["timeframe"] == "next_4_6_weeks"]
    b2 = [x for x in out if x["timeframe"] == "next_3_months"]
    if len(b1) < 2 and out:
        out[0]["timeframe"] = "next_4_6_weeks"
    if len(b2) < 2 and len(out) > 1:
        out[-1]["timeframe"] = "next_3_months"

    return out
