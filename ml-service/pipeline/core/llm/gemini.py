# ml-service/pipeline/core/llm/gemini.py

from typing import Optional
import requests

from ..settings import LLMSettings
from .errors import LLMError, LLMRateLimitError
from .openai_compat import looks_like_429


def call_gemini(settings: LLMSettings, prompt: str, max_tokens: int, temperature: float, response_format: Optional[str] = None) -> str:
    if not settings.api_key:
        raise LLMError("Missing API key for Gemini")

    model = settings.model
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": float(temperature), "maxOutputTokens": int(max_tokens)},
    }

    r = requests.post(url, headers=headers, json=payload, timeout=settings.timeout)
    if r.status_code != 200:
        msg = (r.text or "")[:1200]
        if looks_like_429(r.status_code, msg):
            raise LLMRateLimitError(f"HTTP {r.status_code}: {msg}")
        raise LLMError(f"HTTP {r.status_code}: {msg}")

    data = r.json()
    candidates = data.get("candidates") or []
    if not candidates:
        raise LLMError("Empty candidates from Gemini")

    parts = (((candidates[0] or {}).get("content") or {}).get("parts")) or []
    if not parts:
        raise LLMError("Empty parts from Gemini")

    text = (parts[0] or {}).get("text") or ""
    out = text.strip()
    if not out:
        raise LLMError("Empty response from Gemini")
    return out
