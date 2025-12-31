# ml-service/pipeline/tools/profileresumetool/steps/recommendations.py
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pipeline.core.llm.retry import call_llm
from pipeline.core.parsing.json_parse import parse_json_strictish

# ✅ Import context tools
from .context_builder import (
    format_context_for_prompt,
    get_recommendation_distribution,
    should_prioritize_test_prep,
)

from ..version import PIPELINE_VERSION, TOKENS
from . import as_list, as_str, clamp_int, normalize_timeframe_to_key, response_format_for


# ✅ You need to create this prompt file with consultant-aware template
RECOMMENDATIONS_PROMPT = """You are a ₹90,000 MBA consultant creating an ACTION PLAN.

CLIENT CONTEXT:
{context}

Resume:
{resume}

Scores:
{scores}

Strengths:
{strengths}

Gaps:
{gaps}

Based on the client's GOAL, TARGET TIER, and TIMELINE, create 10-12 specific action items.

DISTRIBUTION (based on urgency):
{distribution}

PRIORITIZATION RULES:
- If timeline = URGENT: Front-load test prep + essays
- If test_readiness < 5: Test prep is TOP priority
- If target_tier = M7: Every action must be "M7-caliber" (not generic advice)
- If concern = "weak brands": Focus on reframing work impact narratives

Each action must be:
1. SPECIFIC to their resume (not generic advice)
2. ACHIEVABLE in the timeframe
3. MEASURABLE (clear outcome)

GOOD EXAMPLE:
{{
  "area": "GMAT Prep - Quant Foundation",
  "action": "Complete Official Guide Quant sections 1-10 (200 questions). Track error log by topic. Target: 85%+ accuracy on algebra/geometry by Week 3.",
  "current_score": 3,
  "target_score": 7,
  "priority": "critical",
  "timeframe": "next_1_3_weeks",
  "why": "No test prep started + R1 2025 deadline = 6 months to reach 730+ for M7. Must lock fundamentals first."
}}

BAD EXAMPLE:
{{
  "area": "Improve GMAT",
  "action": "Study for GMAT",
  "priority": "high",
  "timeframe": "next_3_months"
}}

Return JSON:
{{
  "recommendations": [
    {{
      "area": "...",
      "action": "...",
      "current_score": <0-10>,
      "target_score": <0-10>,
      "priority": "critical|high|medium|low",
      "timeframe": "next_1_3_weeks|next_3_6_weeks|next_3_months",
      "why": "..."
    }}
  ],
  "consultant_summary": "2-3 sentence EXECUTIVE summary of the plan: What's the biggest priority? What's the unlock? What's the risk if they don't act?"
}}
"""


def _prompt_prefix(version: str) -> str:
    return f"[ProfileResumeTool v{version}]\n\n"


def run_recommendations(
    resume_text: str,
    scores: Dict[str, Any],
    strengths: List[Dict[str, Any]],
    improvements: List[Dict[str, Any]],
    settings,
    fallback,
    context: Optional[Dict[str, str]],
) -> Dict[str, Any]:
    """
    Generate consultant-aware action plan with CONTEXT-DRIVEN prioritization.
    """
    
    # ✅ CRITICAL: Use proper context formatting
    context_str = format_context_for_prompt(context) if context else "Generic mode."
    
    # ✅ Get recommendation distribution based on urgency
    distribution = get_recommendation_distribution(context) if context else {
        "next_1_3_weeks": 4,
        "next_3_6_weeks": 4,
        "next_3_months": 3,
    }
    
    distribution_str = "\n".join([f"- {k}: {v} actions" for k, v in distribution.items()])
    
    # ✅ DEBUG
    print(f"[RECOMMENDATIONS] Context:\n{context_str}\n")
    print(f"[RECOMMENDATIONS] Distribution: {distribution}")
    if context and should_prioritize_test_prep(context):
        print("[RECOMMENDATIONS] 🚨 TEST PREP PRIORITY DETECTED")
    
    prompt = _prompt_prefix(PIPELINE_VERSION) + RECOMMENDATIONS_PROMPT.format(
        context=context_str,
        resume=resume_text or "",
        scores=str(scores),
        strengths=str(strengths[:3]) if strengths else "None",
        gaps=str(improvements[:3]) if improvements else "None",
        distribution=distribution_str,
    )

    try:
        raw = call_llm(
            settings=settings,
            prompt=prompt,
            max_tokens=TOKENS.get("recommendations", 2000),
            temperature=0.25,
            response_format=response_format_for(getattr(settings, "provider", "")),
            fallback=fallback,
            retries=1,
        )
        data = parse_json_strictish(raw)
        print("[RECOMMENDATIONS] ✅ Generated successfully")
        
        recommendations = []
        for r in as_list(data.get("recommendations")):
            if not isinstance(r, dict):
                continue
            recommendations.append({
                "area": as_str(r.get("area")) or "Action",
                "action": as_str(r.get("action")) or "",
                "current_score": clamp_int(r.get("current_score"), 0, 10, None),
                "target_score": clamp_int(r.get("target_score"), 0, 10, None),
                "priority": as_str(r.get("priority")) or "medium",
                "timeframe": normalize_timeframe_to_key(r.get("timeframe")),
                "why": as_str(r.get("why")) or "",
            })
        
        consultant_summary = as_str(data.get("consultant_summary")) or None
        
        return {
            "recommendations": recommendations,
            "consultant_summary": consultant_summary,
            "meta": {"parse_ok": True},
        }
        
    except Exception as e:
        print(f"[RECOMMENDATIONS] ❌ Failed: {e}")
        return {
            "recommendations": [],
            "consultant_summary": None,
            "meta": {"parse_ok": False, "error": str(e)},
        }