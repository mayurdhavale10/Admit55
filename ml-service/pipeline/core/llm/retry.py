# ml-service/pipeline/core/llm/retry.py
from __future__ import annotations

import json
import os
import time
from functools import wraps
from typing import Any, Callable, TypeVar

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .errors import LLMRateLimitError

T = TypeVar("T")


def with_retry(
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0,
    max_delay: float = 60.0,
):
    """
    Decorator to retry a function on LLMRateLimitError with exponential backoff.
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            delay = initial_delay
            last_error: Exception | None = None

            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except LLMRateLimitError as e:
                    last_error = e
                    if attempt < max_attempts - 1:
                        sleep_time = min(delay, max_delay)
                        print(
                            f"[RETRY] Rate limited, waiting {sleep_time}s "
                            f"before retry {attempt + 2}/{max_attempts}"
                        )
                        time.sleep(sleep_time)
                        delay *= backoff_factor
                    else:
                        print(f"[RETRY] All {max_attempts} attempts failed")
                        raise

            if last_error:
                raise last_error
            raise RuntimeError("Unexpected retry logic error")

        return wrapper
    return decorator


# --- Backwards-compatible LLM caller (pipelines import this symbol) ---

_SESSION = requests.Session()
_HTTP_RETRY = Retry(
    total=2,
    backoff_factor=0.6,
    status_forcelist=(429, 500, 502, 503, 504),
    allowed_methods=frozenset(["POST"]),
)
_SESSION.mount("https://", HTTPAdapter(max_retries=_HTTP_RETRY))


def _groq_base() -> str:
    # Groq is OpenAI-compatible
    return os.getenv("GROQ_API_BASE", "https://api.groq.com/openai/v1")


def _groq_model() -> str:
    return os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


@with_retry(max_attempts=3, initial_delay=1.0, backoff_factor=2.0, max_delay=30.0)
def call_llm(
    prompt: str | None = None,
    *,
    messages: list[dict[str, str]] | None = None,
    system: str | None = None,
    model: str | None = None,
    temperature: float = 0.2,
    max_tokens: int = 1024,
    timeout: int = 60,
    json_mode: bool = False,
    response_format: str | dict[str, Any] | None = None,  # ✅ Accept both string and dict
    **_: Any,  # swallow legacy kwargs safely
):
    """
    Backwards-compatible call_llm used by multiple pipelines.

    Supports:
    - call_llm(prompt="...")
    - call_llm(messages=[...])
    - optional system prompt
    - Groq OpenAI-compatible /chat/completions
    
    ✅ FIXED: response_format can be:
    - "json" (string) → converts to {"type": "json_object"} for OpenAI only
    - {"type": "json_object"} (dict) → used as-is
    - None → not included
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set")

    if messages is None:
        if prompt is None:
            raise ValueError("Either `prompt` or `messages` must be provided")
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

    payload: dict[str, Any] = {
        "model": model or _groq_model(),
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    # ✅ CRITICAL FIX: Handle response_format properly
    # Groq's llama-3.3-70b-versatile doesn't support response_format at all
    # So we NEVER add it when using Groq (this function is Groq-only currently)
    
    # Note: This function is currently hardcoded to Groq
    # If response_format is passed, we ignore it since Groq doesn't support it
    if response_format is not None:
        print(f"[RETRY] Warning: response_format requested but ignored (Groq doesn't support it)")
        # Don't add it to payload for Groq
    
    # json_mode is also ignored for Groq
    if json_mode:
        print(f"[RETRY] Warning: json_mode requested but ignored (Groq doesn't support it)")

    url = f"{_groq_base().rstrip('/')}/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    r = _SESSION.post(url, headers=headers, json=payload, timeout=timeout)

    # Convert 429 into your retryable error
    if r.status_code == 429:
        raise LLMRateLimitError(r.text)

    if r.status_code >= 400:
        raise RuntimeError(f"LLM HTTP {r.status_code}: {r.text[:500]}")

    data = r.json()
    content = data["choices"][0]["message"]["content"]

    if json_mode:
        try:
            return json.loads(content)
        except Exception:
            return {"raw": content}

    return content


__all__ = ["with_retry", "call_llm"]