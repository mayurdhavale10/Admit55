# ml-service/pipeline/tools/profileresumetool/orchestrator.py
from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional, Union

from .version import PIPELINE_VERSION

# Steps (your modular pipeline)
from .steps import normalize_timeframe_to_key
from .steps.scoring import run_scoring
from .steps.header_summary import run_header_summary
from .steps.strengths import run_strengths
from .steps.improvements import run_improvements
from .steps.adcom_panel import run_adcom_panel
from .steps.recommendations import run_recommendations

# Consultant context builder (NEW)
from .steps.context_builder import (
    build_consultant_context,
    format_context_for_prompt,
    should_prioritize_test_prep,
    get_recommendation_distribution,
)


# ---------------------------------------------------------------------
# Settings (robust: accepts dict OR dataclass-like objects OR None)
# ---------------------------------------------------------------------
@dataclass
class LLMSettings:
    provider: str  # groq|openai|gemini
    api_key: str
    model: str
    base_url: Optional[str] = None
    timeout: int = 60


def _env_default_settings() -> LLMSettings:
    provider = (os.environ.get("LLM_PROVIDER") or "").strip().lower()

    groq_key = os.environ.get("GROQ_API_KEY", "")
    groq_model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    groq_base = os.environ.get("GROQ_API_URL") or "https://api.groq.com/openai/v1"

    openai_key = os.environ.get("OPENAI_API_KEY", "")
    openai_model = os.environ.get("OPENAI_PRIMARY_MODEL", "gpt-4o-mini")
    openai_base = os.environ.get("OPENAI_BASE_URL") or "https://api.openai.com/v1"

    gem_key = os.environ.get("GEMINI_API_KEY", "")
    gem_model = os.environ.get("GEMINI_PRIMARY_MODEL", "gemini-2.0-flash")

    # explicit provider preference
    if provider == "groq" and groq_key:
        return LLMSettings(provider="groq", api_key=groq_key, model=groq_model, base_url=groq_base)
    if provider == "openai" and openai_key:
        return LLMSettings(provider="openai", api_key=openai_key, model=openai_model, base_url=openai_base)
    if provider == "gemini" and gem_key:
        return LLMSettings(provider="gemini", api_key=gem_key, model=gem_model)

    # auto-pick
    if groq_key:
        return LLMSettings(provider="groq", api_key=groq_key, model=groq_model, base_url=groq_base)
    if openai_key:
        return LLMSettings(provider="openai", api_key=openai_key, model=openai_model, base_url=openai_base)
    if gem_key:
        return LLMSettings(provider="gemini", api_key=gem_key, model=gem_model)

    # worst-case (will error in llm call)
    return LLMSettings(provider="groq", api_key="", model=groq_model, base_url=groq_base)


def _coerce_settings(x: Any) -> LLMSettings:
    """
    Accepts:
      - None -> env defaults
      - dict  -> LLMSettings(**dict)
      - object with attrs provider/api_key/model/base_url/timeout
    """
    if x is None:
        return _env_default_settings()

    if isinstance(x, LLMSettings):
        return x

    if isinstance(x, dict):
        # tolerate extra keys
        return LLMSettings(
            provider=(x.get("provider") or "groq"),
            api_key=(x.get("api_key") or ""),
            model=(x.get("model") or "llama-3.3-70b-versatile"),
            base_url=x.get("base_url"),
            timeout=int(x.get("timeout") or 60),
        )

    # dataclass-like settings object (e.g., from pipeline.core.settings)
    provider = getattr(x, "provider", None) or "groq"
    api_key = getattr(x, "api_key", None) or ""
    model = getattr(x, "model", None) or "llama-3.3-70b-versatile"
    base_url = getattr(x, "base_url", None)
    timeout = int(getattr(x, "timeout", 60) or 60)
    return LLMSettings(provider=provider, api_key=api_key, model=model, base_url=base_url, timeout=timeout)


def _build_fallback_from_env(primary: LLMSettings) -> Optional[LLMSettings]:
    """Prefer a different provider if keys exist."""
    groq_key = os.environ.get("GROQ_API_KEY", "")
    groq_model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    groq_base = os.environ.get("GROQ_API_URL") or "https://api.groq.com/openai/v1"

    openai_key = os.environ.get("OPENAI_API_KEY", "")
    openai_model = os.environ.get("OPENAI_PRIMARY_MODEL", "gpt-4o-mini")
    openai_base = os.environ.get("OPENAI_BASE_URL") or "https://api.openai.com/v1"

    gem_key = os.environ.get("GEMINI_API_KEY", "")
    gem_model = os.environ.get("GEMINI_PRIMARY_MODEL", "gemini-2.0-flash")

    candidates: list[LLMSettings] = []
    if groq_key:
        candidates.append(LLMSettings(provider="groq", api_key=groq_key, model=groq_model, base_url=groq_base))
    if openai_key:
        candidates.append(LLMSettings(provider="openai", api_key=openai_key, model=openai_model, base_url=openai_base))
    if gem_key:
        candidates.append(LLMSettings(provider="gemini", api_key=gem_key, model=gem_model))

    different = [c for c in candidates if c.provider != (primary.provider or "").lower()]
    if different:
        return different[0]
    return candidates[0] if candidates else None


# ---------------------------------------------------------------------
# Safety wrappers (never crash the UI shape)
# ---------------------------------------------------------------------
def _safe_header_summary(h: Any) -> Dict[str, Any]:
    if not isinstance(h, dict):
        return {
            "summary": "Profile analysis complete. Review detailed sections below.",
            "highlights": [],
            "applicantArchetypeTitle": "MBA Candidate",
            "applicantArchetypeSubtitle": "",
        }
    h.setdefault("summary", "Profile analysis complete. Review detailed sections below.")
    if not isinstance(h.get("highlights"), list):
        h["highlights"] = []
    h.setdefault("applicantArchetypeTitle", "MBA Candidate")
    h.setdefault("applicantArchetypeSubtitle", "")
    return h


def _safe_adcom_panel(a: Any) -> Dict[str, Any]:
    if not isinstance(a, dict):
        a = {}
    a.setdefault("what_excites", [])
    a.setdefault("what_concerns", [])
    a.setdefault("how_to_preempt", [])

    if not a["what_excites"]:
        a["what_excites"] = ["AdCom view pending: rerun analysis for deeper strengths (temporary provider limit)."]
    if not a["what_concerns"]:
        a["what_concerns"] = ["AdCom view pending: rerun analysis to surface concerns (temporary provider limit)."]
    if not a["how_to_preempt"]:
        a["how_to_preempt"] = ["Rerun in 2–3 minutes OR switch provider/model (Groq/OpenAI/Gemini)."]
    return a


def _build_action_plan_from_recs(recommendations: Any) -> Dict[str, Any]:
    action_plan = {"next_1_3_weeks": [], "next_3_6_weeks": [], "next_3_months": []}
    if not isinstance(recommendations, list):
        return action_plan

    for r in recommendations:
        if not isinstance(r, dict):
            continue
        tf = normalize_timeframe_to_key(r.get("timeframe"))
        if tf not in action_plan:
            continue
        action_plan[tf].append(
            {
                "title": r.get("area") or "Action",
                "description": r.get("action") or "",
                "priority": r.get("priority") or "medium",
                "current_score": r.get("current_score", None),
            }
        )
    return action_plan


# ---------------------------------------------------------------------
# Main entry (this is what app.py imports and calls)
# ---------------------------------------------------------------------
def run_pipeline(
    resume_text: str,
    settings: Optional[Union[LLMSettings, Dict[str, Any], Any]] = None,
    fallback: Optional[Union[LLMSettings, Dict[str, Any], Any]] = None,
    discovery_answers: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """
    ProfileResumeTool pipeline with optional consultant-mode context.

    Returns keys used by frontend:
      scores, header_summary, strengths, improvements, adcom_panel, recommendations,
      consultant_summary (optional), discovery_context (optional), action_plan, processing_meta.
    """
    start = time.time()

    # Normalize settings types (dict/object -> LLMSettings)
    primary = _coerce_settings(settings)
    fb = None if fallback is None else _coerce_settings(fallback)
    if fb is None:
        fb = _build_fallback_from_env(primary)

    resume_text = (resume_text or "").strip()

    # Build consultant context (if keys match)
    context = build_consultant_context(discovery_answers) if discovery_answers else {}
    consultant_mode = bool(context)

    print("[ProfileResumeTool] Pipeline starting...")
    print(f"[ProfileResumeTool] Mode: {'CONSULTANT' if consultant_mode else 'GENERIC'}")
    if consultant_mode:
        try:
            print(f"[ProfileResumeTool] Context:\n{format_context_for_prompt(context)}")
        except Exception:
            print("[ProfileResumeTool] Context formatting failed (non-fatal).")

    # Run steps (keep UI shape stable)
    scores = run_scoring(resume_text, primary, fb, context)

    header_summary = _safe_header_summary(
        run_header_summary(resume_text, scores, primary, fb, context)
    )

    strengths = run_strengths(resume_text, primary, fb, context, max_retries=2)
    improvements = run_improvements(resume_text, scores, primary, fb, context)

    adcom_panel = _safe_adcom_panel(
        run_adcom_panel(resume_text, scores, strengths, improvements, primary, fb, context)
    )

    # ✅ FIXED: run_recommendations returns dict with consultant_summary + meta
    recs_out = run_recommendations(
        resume_text, scores, strengths, improvements, primary, fb, context
    )

    consultant_summary = None
    recs_meta: Dict[str, Any] = {}
    recommendations: list = []

    if isinstance(recs_out, dict):
        consultant_summary = recs_out.get("consultant_summary")
        recs_meta = recs_out.get("meta") or {}
        recommendations = recs_out.get("recommendations") or []
    elif isinstance(recs_out, list):
        # defensive fallback if old version returns list
        recommendations = recs_out

    if not isinstance(recommendations, list):
        recommendations = []

    action_plan = _build_action_plan_from_recs(recommendations)
    duration = round(time.time() - start, 2)

    discovery_context = None
    if consultant_mode and isinstance(discovery_answers, dict):
        discovery_context = {
            "goal_type": discovery_answers.get("goal_type"),
            "target_schools": discovery_answers.get("target_schools"),
            "timeline": discovery_answers.get("timeline"),
            "test_status": discovery_answers.get("test_status"),
            "work_experience": discovery_answers.get("work_experience"),
            "biggest_concern": discovery_answers.get("biggest_concern"),
        }

    analysis = {
        "scores": scores,
        "header_summary": header_summary,
        "strengths": strengths,
        "improvements": improvements,
        "adcom_panel": adcom_panel,
        "recommendations": recommendations,
        "action_plan": action_plan,
    }

    return {
        "success": True,
        "original_resume": resume_text,

        "scores": scores,
        "header_summary": header_summary,
        "strengths": strengths,
        "improvements": improvements,
        "adcom_panel": adcom_panel,
        "recommendations": recommendations,

        # Consultant-mode extras
        "consultant_summary": consultant_summary,
        "discovery_context": discovery_context,

        # Backward compat / UI convenience
        "action_plan": action_plan,
        "analysis": analysis,

        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "pipeline_version": f"{PIPELINE_VERSION}-profileresumetool",

        "processing_meta": {
            "total_duration_seconds": duration,
            "provider": primary.provider,
            "model": primary.model,
            "fallback_provider": fb.provider if fb else None,
            "fallback_model": fb.model if fb else None,

            "consultant_mode": consultant_mode,
            "context_provided": consultant_mode,
            "context_keys": list(context.keys()) if consultant_mode else [],

            # Optional helpers (safe to ignore in UI)
            "prioritize_test_prep": bool(should_prioritize_test_prep(context)) if consultant_mode else False,
            "recommendation_distribution": get_recommendation_distribution(context) if consultant_mode else None,

            # ✅ Debug visibility: tells you if LLM JSON parse failed and you fell back
            "recommendations_parse_ok": recs_meta.get("parse_ok"),
            "recommendations_error": recs_meta.get("error"),
        },
    }
