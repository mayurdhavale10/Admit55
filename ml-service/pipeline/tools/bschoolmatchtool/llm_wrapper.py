# ml-service/pipeline/tools/bschoolmatchtool/llm_wrapper.py
"""
LLM wrapper for BschoolMatchTool using existing pipeline/core/llm modules.
"""

from __future__ import annotations
from typing import Any, Optional

from pipeline.core.llm.openai_compat import call_openai_compatible
from pipeline.core.llm.gemini import call_gemini
from pipeline.core.llm.retry import with_retry


def call_llm(
    prompt: str,
    settings: Any,
    fallback: Any = None,
    max_tokens: int = 1000,
    temperature: float = 0.7,
    max_retries: int = 2,
) -> str:
    """
    Call LLM using existing pipeline/core/llm modules.
    
    Args:
        prompt: Input prompt
        settings: LLMSettings object or dict
        fallback: Fallback LLMSettings (optional)
        max_tokens: Max response tokens
        temperature: Sampling temperature
        max_retries: Max retry attempts
        
    Returns:
        LLM response text
    """
    
    # Try primary provider
    try:
        return _call_provider(
            prompt=prompt,
            settings=settings,
            max_tokens=max_tokens,
            temperature=temperature,
        )
    except Exception as e:
        print(f"[BSchool LLM] Primary provider failed: {e}")
        
        # Try fallback if available
        if fallback:
            print(f"[BSchool LLM] Attempting fallback provider...")
            try:
                return _call_provider(
                    prompt=prompt,
                    settings=fallback,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
            except Exception as e2:
                print(f"[BSchool LLM] Fallback provider also failed: {e2}")
                raise e2
        else:
            raise e


def _call_provider(
    prompt: str,
    settings: Any,
    max_tokens: int,
    temperature: float,
) -> str:
    """Call a specific LLM provider using existing modules."""
    
    # Extract settings (support both dict and dataclass)
    if isinstance(settings, dict):
        provider = settings.get("provider", "").lower()
        api_key = settings.get("api_key", "")
        model = settings.get("model", "")
        base_url = settings.get("base_url")
    else:
        provider = getattr(settings, "provider", "").lower()
        api_key = getattr(settings, "api_key", "")
        model = getattr(settings, "model", "")
        base_url = getattr(settings, "base_url", None)
    
    if not api_key:
        raise ValueError(f"No API key provided for {provider}")
    
    # Prepare messages
    messages = [{"role": "user", "content": prompt}]
    
    # Route to appropriate provider
    if provider == "gemini":
        # Use existing gemini.py
        return call_gemini(
            api_key=api_key,
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
    elif provider in ["groq", "openai"]:
        # Use existing openai_compat.py (works for both Groq and OpenAI)
        return call_openai_compatible(
            api_key=api_key,
            model=model,
            messages=messages,
            base_url=base_url,
            max_tokens=max_tokens,
            temperature=temperature,
        )
    else:
        raise ValueError(f"Unsupported provider: {provider}")