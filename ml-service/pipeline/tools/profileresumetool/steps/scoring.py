# ml-service/pipeline/tools/profileresumetool/steps/scoring.py
from __future__ import annotations

import json
import re
from typing import Any, Dict, Optional, Tuple

# ✅ NEW: Use requests instead of urllib
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


# --- robust import for SCORING_PROMPT (works even if prompts/ has no __init__.py) ---
try:
    from ..prompts.scoring import SCORING_PROMPT  # preferred
except Exception:
    # fallback absolute import (namespace package friendly)
    import importlib
    SCORING_PROMPT = importlib.import_module(
        "pipeline.tools.profileresumetool.prompts.scoring"
    ).SCORING_PROMPT


# ✅ NEW: Reuse session (better for TLS + avoids WAF blocks)
_SESSION = requests.Session()
_RETRY = Retry(
    total=2,
    backoff_factor=0.6,
    status_forcelist=(429, 500, 502, 503, 504),
    allowed_methods=frozenset(["POST"]),
)
_SESSION.mount("https://", HTTPAdapter(max_retries=_RETRY))


def _get(s: Any, key: str, default: Any = None) -> Any:
    """Support settings as dict OR dataclass-like object."""
    if isinstance(s, dict):
        return s.get(key, default)
    return getattr(s, key, default)


def _base_url(provider: str, base_url: Optional[str]) -> str:
    if base_url:
        return str(base_url).rstrip("/")
    if (provider or "").lower().strip() == "groq":
        return "https://api.groq.com/openai/v1"
    return "https://api.openai.com/v1"


def _format_context(context: Optional[Dict[str, Any]]) -> str:
    if not context:
        return "Generic mode (no discovery context)."
    lines = []
    for k, v in context.items():
        if v is None:
            continue
        s = str(v).strip()
        if not s:
            continue
        lines.append(f"- {k}: {s}")
    return "\n".join(lines) if lines else "Generic mode (no discovery context)."


def _extract_first_json(text: str) -> Optional[str]:
    if not text:
        return None

    # ```json ... ``` block
    m = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL | re.IGNORECASE)
    if m:
        return m.group(1).strip()

    # first balanced {...}
    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    for i in range(start, len(text)):
        ch = text[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1].strip()

    return None


# ✅ REPLACED: Use requests instead of urllib
def _post_json(url: str, headers: Dict[str, str], payload: Dict[str, Any], timeout: int = 60) -> Dict[str, Any]:
    """
    POST JSON to LLM API using requests library (avoids Cloudflare WAF blocks).
    """
    h = dict(headers or {})
    
    # ✅ WAF-friendly headers (helps avoid bot detection)
    h.setdefault("User-Agent", "Admit55-MBA-Tool/3.0 (+https://admit55.onrender.com)")
    h.setdefault("Accept", "application/json")
    h.setdefault("Content-Type", "application/json")

    try:
        resp = _SESSION.post(url, headers=h, json=payload, timeout=timeout)
        
        # Check for errors
        if resp.status_code >= 400:
            error_body = resp.text[:900] if resp.text else f"HTTP {resp.status_code}"
            raise RuntimeError(f"HTTP {resp.status_code} from {url}: {error_body}")
        
        return resp.json()
        
    except requests.exceptions.Timeout:
        raise RuntimeError(f"Request timeout after {timeout}s to {url}")
    except requests.exceptions.ConnectionError as e:
        raise RuntimeError(f"Connection error to {url}: {str(e)}")
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Request failed to {url}: {str(e)}")


def _call_llm_json_once(
    prompt: str,
    settings: Any,
    temperature: float = 0.15,
    max_tokens: int = 700,
) -> Tuple[Dict[str, Any], str]:
    provider = (_get(settings, "provider", "") or "").lower().strip()
    api_key = _get(settings, "api_key", "") or ""
    model = _get(settings, "model", "") or ""
    timeout = int(_get(settings, "timeout", 60) or 60)
    base_url = _base_url(provider, _get(settings, "base_url", None))

    # We only support Groq/OpenAI here because both are OpenAI-compatible
    if provider not in ("groq", "openai"):
        raise RuntimeError(f"Unsupported provider for scoring step: {provider}. Use groq/openai or provide fallback.")

    if not api_key:
        raise RuntimeError(f"{provider.upper()} api_key missing in settings")
    if not model:
        raise RuntimeError(f"{provider.upper()} model missing in settings")

    url = f"{base_url}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    payload: Dict[str, Any] = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens,
        # Force strict JSON output when supported
        "response_format": {"type": "json_object"},
    }

    resp = _post_json(url, headers, payload, timeout=timeout)

    raw = resp["choices"][0]["message"]["content"]
    raw = raw.strip() if isinstance(raw, str) else str(raw)

    try:
        return json.loads(raw), raw
    except Exception:
        j = _extract_first_json(raw)
        if j:
            return json.loads(j), raw
        raise RuntimeError(f"Model did not return JSON. Raw: {raw[:600]}")


def _call_llm_json(prompt: str, settings: Any, fallback: Any = None) -> Tuple[Dict[str, Any], str]:
    try:
        return _call_llm_json_once(prompt, settings)
    except Exception:
        if fallback:
            return _call_llm_json_once(prompt, fallback)
        raise


def _clamp_0_10(x: Any, default: int = 0) -> int:
    try:
        v = int(float(x))
        return max(0, min(10, v))
    except Exception:
        return default


def run_scoring(
    resume_text: str,
    settings: Any,
    fallback: Any = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Must exist because orchestrator.py imports:
        from .steps.scoring import run_scoring
    """

    prompt = SCORING_PROMPT.format(
        context=_format_context(context),
        resume=resume_text or "",
    )

    data, _raw = _call_llm_json(prompt, settings, fallback=fallback)

    out = {
        "academics": _clamp_0_10(data.get("academics")),
        "test_readiness": _clamp_0_10(data.get("test_readiness")),
        "leadership": _clamp_0_10(data.get("leadership")),
        "extracurriculars": _clamp_0_10(data.get("extracurriculars")),
        "international": _clamp_0_10(data.get("international")),
        "work_impact": _clamp_0_10(data.get("work_impact")),
        "impact": _clamp_0_10(data.get("impact")),
        "industry": _clamp_0_10(data.get("industry")),
    }

    # Optional consultant note (won't break old UI)
    if isinstance(data.get("consultant_note"), str) and data["consultant_note"].strip():
        out["consultant_note"] = data["consultant_note"].strip()

    return out