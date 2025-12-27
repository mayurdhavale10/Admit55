# ml-service/pipeline/core/settings.py

import os
from dataclasses import dataclass
from typing import Optional, List


@dataclass
class LLMSettings:
    provider: str  # "groq" | "openai" | "gemini"
    api_key: str
    model: str
    base_url: Optional[str] = None  # for groq/openai compatible
    timeout: int = 60


def env_default_settings() -> LLMSettings:
    """
    Picks provider based on LLM_PROVIDER if possible, else auto-pick in order:
    Groq -> OpenAI -> Gemini
    """
    provider = (os.environ.get("LLM_PROVIDER") or "").strip().lower()

    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    groq_model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    groq_base = (os.environ.get("GROQ_API_URL") or "https://api.groq.com/openai/v1").strip()

    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    openai_model = os.environ.get("OPENAI_PRIMARY_MODEL", "gpt-4o-mini").strip()
    openai_base = (os.environ.get("OPENAI_BASE_URL") or "https://api.openai.com/v1").strip()

    gem_key = os.environ.get("GEMINI_API_KEY", "").strip()
    gem_model = os.environ.get("GEMINI_PRIMARY_MODEL", "gemini-2.0-flash").strip()

    if provider == "groq" and groq_key:
        return LLMSettings("groq", groq_key, groq_model, groq_base)
    if provider == "openai" and openai_key:
        return LLMSettings("openai", openai_key, openai_model, openai_base)
    if provider == "gemini" and gem_key:
        return LLMSettings("gemini", gem_key, gem_model, None)

    # auto-pick
    if groq_key:
        return LLMSettings("groq", groq_key, groq_model, groq_base)
    if openai_key:
        return LLMSettings("openai", openai_key, openai_model, openai_base)
    if gem_key:
        return LLMSettings("gemini", gem_key, gem_model, None)

    # fallback empty (will error if called)
    return LLMSettings("groq", "", groq_model, groq_base)


def build_fallback_from_env(primary: LLMSettings) -> Optional[LLMSettings]:
    """
    Prefer a DIFFERENT provider (real fallback).
    """
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    groq_model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    groq_base = (os.environ.get("GROQ_API_URL") or "https://api.groq.com/openai/v1").strip()

    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    openai_model = os.environ.get("OPENAI_PRIMARY_MODEL", "gpt-4o-mini").strip()
    openai_base = (os.environ.get("OPENAI_BASE_URL") or "https://api.openai.com/v1").strip()

    gem_key = os.environ.get("GEMINI_API_KEY", "").strip()
    gem_model = os.environ.get("GEMINI_PRIMARY_MODEL", "gemini-2.0-flash").strip()

    candidates: List[LLMSettings] = []
    if groq_key:
        candidates.append(LLMSettings("groq", groq_key, groq_model, groq_base))
    if openai_key:
        candidates.append(LLMSettings("openai", openai_key, openai_model, openai_base))
    if gem_key:
        candidates.append(LLMSettings("gemini", gem_key, gem_model, None))

    different = [c for c in candidates if c.provider != primary.provider]
    if different:
        return different[0]
    return candidates[0] if candidates else None


def downgraded_model_for(provider: str) -> Optional[str]:
    p = (provider or "").lower().strip()
    if p == "groq":
        return os.environ.get("GROQ_FALLBACK_MODEL", "llama-3.1-8b-instant").strip()
    if p == "openai":
        return os.environ.get("OPENAI_FALLBACK_MODEL", "gpt-4o-mini").strip()
    if p == "gemini":
        return os.environ.get("GEMINI_FALLBACK_MODEL", "gemini-2.0-flash").strip()
    return None
