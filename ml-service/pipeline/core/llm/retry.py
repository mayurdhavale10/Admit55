# ml-service/pipeline/core/llm/retry.py

import random
import time
from typing import Optional

from ..settings import LLMSettings, downgraded_model_for
from .errors import LLMError, LLMRateLimitError
from .groq import call_groq
from .gemini import call_gemini
from .openai_compat import call_openai_compat


def _sleep_backoff(attempt: int) -> None:
    base = min(2.0, 0.25 * (2 ** attempt))
    time.sleep(base + random.random() * 0.25)


def call_llm_once(
    settings: LLMSettings,
    prompt: str,
    max_tokens: int,
    temperature: float,
    response_format: Optional[str],
) -> str:
    p = (settings.provider or "").lower().strip()

    if p in ("openai", "groq"):
        # For openai & groq use OpenAI-compatible path
        if p == "openai":
            return call_openai_compat(settings, prompt, max_tokens, temperature, response_format=response_format)
        return call_groq(settings, prompt, max_tokens, temperature, response_format=response_format)

    if p == "gemini":
        # Gemini ignores response_format "json" mode (we still parse)
        return call_gemini(settings, prompt, max_tokens, temperature, response_format=response_format)

    raise LLMError(f"Unsupported provider: {settings.provider}")


def call_llm(
    settings: LLMSettings,
    prompt: str,
    max_tokens: int,
    temperature: float,
    response_format: Optional[str],
    fallback: Optional[LLMSettings],
    retries: int = 1,
) -> str:
    """
    429-proof calling:
    - try primary (retries)
    - if rate-limit: try downgraded model (same provider)
    - then try fallback provider
    """
    last_err: Optional[Exception] = None

    for a in range(retries + 1):
        try:
            return call_llm_once(settings, prompt, max_tokens, temperature, response_format)
        except LLMRateLimitError as e:
            last_err = e
            _sleep_backoff(a)
        except Exception as e:
            last_err = e
            _sleep_backoff(a)

    # downgrade same provider
    downgraded = downgraded_model_for(settings.provider)
    if downgraded and downgraded != settings.model:
        st2 = LLMSettings(
            provider=settings.provider,
            api_key=settings.api_key,
            model=downgraded,
            base_url=settings.base_url,
            timeout=settings.timeout,
        )
        try:
            return call_llm_once(st2, prompt, max_tokens, temperature, response_format)
        except Exception as e:
            last_err = e

    # fallback provider
    if fallback and fallback.api_key:
        try:
            return call_llm_once(fallback, prompt, max_tokens, temperature, response_format)
        except Exception as e:
            last_err = e

    raise LLMError(str(last_err) if last_err else "Unknown LLM failure")
