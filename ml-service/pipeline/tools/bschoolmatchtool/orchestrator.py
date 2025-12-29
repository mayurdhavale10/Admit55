# ml-service/pipeline/tools/bschoolmatchtool/orchestrator.py
from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional, Union

from .version import PIPELINE_VERSION, TOOL_NAME

# Import steps
from .steps import (
    build_context,
    extract_key_profile_data,
    match_schools,
    classify_tiers,
    generate_insights,
    generate_fit_story,
    generate_strategy,
    generate_action_plan,
)


# ---------------------------------------------------------------------
# Settings (copied from profileresumetool for consistency)
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

    if provider == "groq" and groq_key:
        return LLMSettings(provider="groq", api_key=groq_key, model=groq_model, base_url=groq_base)
    if provider == "openai" and openai_key:
        return LLMSettings(provider="openai", api_key=openai_key, model=openai_model, base_url=openai_base)
    if provider == "gemini" and gem_key:
        return LLMSettings(provider="gemini", api_key=gem_key, model=gem_model)

    if groq_key:
        return LLMSettings(provider="groq", api_key=groq_key, model=groq_model, base_url=groq_base)
    if openai_key:
        return LLMSettings(provider="openai", api_key=openai_key, model=openai_model, base_url=openai_base)
    if gem_key:
        return LLMSettings(provider="gemini", api_key=gem_key, model=gem_model)

    return LLMSettings(provider="groq", api_key="", model=groq_model, base_url=groq_base)


def _coerce_settings(x: Any) -> LLMSettings:
    if x is None:
        return _env_default_settings()
    if isinstance(x, LLMSettings):
        return x
    if isinstance(x, dict):
        return LLMSettings(
            provider=(x.get("provider") or "groq"),
            api_key=(x.get("api_key") or ""),
            model=(x.get("model") or "llama-3.3-70b-versatile"),
            base_url=x.get("base_url"),
            timeout=int(x.get("timeout") or 60),
        )
    provider = getattr(x, "provider", None) or "groq"
    api_key = getattr(x, "api_key", None) or ""
    model = getattr(x, "model", None) or "llama-3.3-70b-versatile"
    base_url = getattr(x, "base_url", None)
    timeout = int(getattr(x, "timeout", 60) or 60)
    return LLMSettings(provider=provider, api_key=api_key, model=model, base_url=base_url, timeout=timeout)


def _build_fallback_from_env(primary: LLMSettings) -> Optional[LLMSettings]:
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
# Main Pipeline
# ---------------------------------------------------------------------
def run_pipeline(
    user_profile: Dict[str, Any],
    resume_text: Optional[str] = None,
    settings: Optional[Union[LLMSettings, Dict[str, Any], Any]] = None,
    fallback: Optional[Union[LLMSettings, Dict[str, Any], Any]] = None,
) -> Dict[str, Any]:
    """
    BschoolMatchTool pipeline.
    
    Args:
        user_profile: Dict with answers from questions
        resume_text: Optional resume text
        settings: LLM settings for primary provider
        fallback: LLM settings for fallback provider
    
    Returns:
        Dict with: key_insights, schools_by_tier, fit_story, strategy, action_plan
    """
    start = time.time()

    # Normalize settings
    primary = _coerce_settings(settings)
    fb = None if fallback is None else _coerce_settings(fallback)
    if fb is None:
        fb = _build_fallback_from_env(primary)

    print(f"[{TOOL_NAME}] Pipeline starting...")
    print(f"[{TOOL_NAME}] Provider: {primary.provider} / Model: {primary.model}")

    # Step 1: Build context
    context = build_context(user_profile, resume_text)
    profile_data = extract_key_profile_data(context)
    context.update(profile_data)

    # Step 2: Match schools
    all_schools = match_schools(context, primary, fb)
    print(f"[{TOOL_NAME}] Matched {len(all_schools)} schools")

    # Step 3: Classify into tiers
    tiered_schools = classify_tiers(all_schools, context, primary)
    print(f"[{TOOL_NAME}] Tiered: {len(tiered_schools['ambitious'])} ambitious, {len(tiered_schools['target'])} target, {len(tiered_schools['safe'])} safe")

    # Step 4: Generate insights
    key_insights = generate_insights(context, tiered_schools, primary, fb)
    print(f"[{TOOL_NAME}] Generated {len(key_insights)} insights")

    # Step 5: Generate fit story
    fit_story = generate_fit_story(context, tiered_schools, primary, fb)
    print(f"[{TOOL_NAME}] Generated fit story")

    # Step 6: Generate strategy
    strategy = generate_strategy(context, tiered_schools, primary, fb)
    print(f"[{TOOL_NAME}] Generated strategy")

    # Step 7: Generate action plan
    action_plan = generate_action_plan(context, strategy, primary, fb)
    print(f"[{TOOL_NAME}] Generated action plan")

    duration = round(time.time() - start, 2)
    print(f"[{TOOL_NAME}] Pipeline complete in {duration}s")

    return {
        "success": True,
        "key_insights": key_insights,
        "schools_by_tier": tiered_schools,
        "fit_story": fit_story,
        "strategy": strategy,
        "action_plan": action_plan,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "pipeline_version": f"{PIPELINE_VERSION}-{TOOL_NAME}",
        "processing_meta": {
            "total_duration_seconds": duration,
            "provider": primary.provider,
            "model": primary.model,
            "fallback_provider": fb.provider if fb else None,
            "fallback_model": fb.model if fb else None,
        },
    }