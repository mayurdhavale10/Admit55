# ml-service/pipeline/tools/profileresumetool/steps/__init__.py
from __future__ import annotations

from typing import Any, Dict, List, Optional

def as_str(x: Any) -> str:
    return x.strip() if isinstance(x, str) else ""

def as_list(x: Any) -> List[Any]:
    return x if isinstance(x, list) else []

def clamp_int(n: Any, lo: int, hi: int, default: int) -> int:
    try:
        v = int(float(n))
        return max(lo, min(hi, v))
    except Exception:
        return default

def response_format_for(provider: str) -> Optional[str]:
    p = (provider or "").lower().strip()
    return "json" if p in ("groq", "openai") else None

def normalize_timeframe_to_key(tf: Any) -> str:
    t = as_str(tf).lower()
    if not t:
        return "unknown"

    if t in ("next_1_3_weeks", "next-1-3-weeks", "next 1-3 weeks"):
        return "next_1_3_weeks"
    if t in ("next_3_6_weeks", "next-3-6-weeks", "next 3-6 weeks", "next_4_6_weeks", "next 4-6 weeks"):
        return "next_3_6_weeks"
    if t in ("next_3_months", "next-3-months", "next 3 months"):
        return "next_3_months"

    # heuristics
    if any(k in t for k in ["1-3", "1–3", "1 to 3", "urgent", "asap", "2 week", "14 day", "7 day"]):
        return "next_1_3_weeks"
    if any(k in t for k in ["3-6", "3–6", "4-6", "4–6", "3 to 6", "4 to 6", "6 week", "5 week"]):
        return "next_3_6_weeks"
    if any(k in t for k in ["3 month", "three month", "12 week", "quarter", "long term", "month"]):
        return "next_3_months"

    return "unknown"

def ensure_non_empty_list(xs: List[str], fallback: str) -> List[str]:
    out = [s for s in (xs or []) if isinstance(s, str) and s.strip()]
    return out if out else [fallback]
