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


# ✅ OPTIMIZED: Reduced to 8-10 recommendations + stronger JSON instructions
RECOMMENDATIONS_PROMPT = """You are a ₹90,000 MBA consultant creating an ACTION PLAN.

CLIENT CONTEXT:
{context}

Resume (excerpt):
{resume}

Scores:
{scores}

Top Strengths:
{strengths}

Key Gaps:
{gaps}

Based on the client's GOAL, TARGET TIER, and TIMELINE, create 8-10 specific, prioritized action items.

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

Return ONLY valid JSON. No preamble, no explanation, no markdown:
{{
  "recommendations": [
    {{
      "area": "...",
      "action": "...",
      "current_score": 3,
      "target_score": 7,
      "priority": "critical",
      "timeframe": "next_1_3_weeks",
      "why": "..."
    }}
  ],
  "consultant_summary": "2-3 sentence EXECUTIVE summary: What's the biggest priority? What's the unlock? What's the risk if they don't act?"
}}

CRITICAL: Your response must start with {{ and end with }}. No text before or after. No ```json markdown. Just pure JSON.
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
    
    Returns:
        Dict with keys: recommendations (list), consultant_summary (str), meta (dict)
    """
    
    # ✅ Use proper context formatting
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
    
    # ✅ Build prompt with truncated inputs to save tokens
    prompt = _prompt_prefix(PIPELINE_VERSION) + RECOMMENDATIONS_PROMPT.format(
        context=context_str,
        resume=(resume_text or "")[:800],  # ✅ Limit resume excerpt to 800 chars
        scores=str(scores),
        strengths=str(strengths[:3]) if strengths else "None",  # Top 3 only
        gaps=str(improvements[:3]) if improvements else "None",  # Top 3 only
        distribution=distribution_str,
    )

    try:
        # ✅ CRITICAL FIX: Increased max_tokens to 3500 (from 2000)
        # This ensures Groq has enough tokens to complete the JSON response
        raw = call_llm(
            prompt=prompt,
            max_tokens=3500,  # ✅ Increased from 2000
            temperature=0.25,
            response_format=response_format_for(getattr(settings, "provider", "")),
        )
        
        # ✅ DEBUG: Log what we got back
        print(f"[RECOMMENDATIONS] Raw response length: {len(raw)} chars")
        print(f"[RECOMMENDATIONS] First 200 chars: {raw[:200]}")
        print(f"[RECOMMENDATIONS] Last 100 chars: {raw[-100:]}")
        
        # ✅ Parse JSON
        data = parse_json_strictish(raw)
        print("[RECOMMENDATIONS] ✅ JSON parsed successfully")
        
        # ✅ Extract and clean recommendations
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
        
        print(f"[RECOMMENDATIONS] ✅ Parsed {len(recommendations)} recommendations")
        
        # ✅ Validation: Warn if we got too few recommendations
        if len(recommendations) < 6:
            print(f"[RECOMMENDATIONS] ⚠️ Only got {len(recommendations)} recommendations (expected 8-10)")
        
        return {
            "recommendations": recommendations,
            "consultant_summary": consultant_summary,
            "meta": {
                "parse_ok": True,
                "count": len(recommendations),
                "response_length": len(raw),
            },
        }
        
    except Exception as e:
        print(f"[RECOMMENDATIONS] ❌ Failed: {e}")
        
        # ✅ Enhanced error logging
        import traceback
        traceback.print_exc()
        
        # ✅ Try to show what we got if parsing failed
        try:
            if 'raw' in locals():
                print(f"[RECOMMENDATIONS] Raw response that failed:")
                print(f"  Length: {len(raw)}")
                print(f"  Starts with: {raw[:100]}")
                print(f"  Ends with: {raw[-100:]}")
        except Exception:
            pass
        
        return {
            "recommendations": [],
            "consultant_summary": None,
            "meta": {
                "parse_ok": False,
                "error": str(e),
                "response_length": len(raw) if 'raw' in locals() else 0,
            },
        }