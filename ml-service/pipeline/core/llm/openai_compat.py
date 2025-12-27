# ml-service/pipeline/core/llm/openai_compat.py

from typing import Any, Dict, Optional
import requests

from ..settings import LLMSettings
from .errors import LLMError, LLMRateLimitError


def openai_compatible_url(base_url: str) -> str:
    base = (base_url or "").rstrip("/")
    if base.endswith("/chat/completions"):
        return base
    if base.endswith("/v1"):
        return base + "/chat/completions"
    if base.endswith("/openai/v1"):
        return base + "/chat/completions"
    return base + "/v1/chat/completions"


def looks_like_429(status_code: int, text: str) -> bool:
    if status_code == 429:
        return True
    t = (text or "").lower()
    return ("rate limit" in t) or ("rate_limit" in t) or ("tpd" in t) or ("too many requests" in t)


def call_openai_compat(
    settings: LLMSettings,
    prompt: str,
    max_tokens: int,
    temperature: float,
    response_format: Optional[str] = None,  # "json" or None
) -> str:
    if not settings.api_key:
        raise LLMError(f"Missing API key for provider={settings.provider}")

    url = openai_compatible_url(settings.base_url or "")
    headers = {"Authorization": f"Bearer {settings.api_key}", "Content-Type": "application/json"}

    payload: Dict[str, Any] = {
        "model": settings.model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": int(max_tokens),
        "temperature": float(temperature),
    }
    if response_format == "json":
        payload["response_format"] = {"type": "json_object"}

    r = requests.post(url, headers=headers, json=payload, timeout=settings.timeout)
    if r.status_code != 200:
        msg = (r.text or "")[:1200]
        if looks_like_429(r.status_code, msg):
            raise LLMRateLimitError(f"HTTP {r.status_code}: {msg}")
        raise LLMError(f"HTTP {r.status_code}: {msg}")

    data = r.json()
    content = data["choices"][0]["message"]["content"]
    out = (content or "").strip()
    if not out:
        raise LLMError("Empty response")
    return out
