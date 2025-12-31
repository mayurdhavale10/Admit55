# ml-service/pipeline/core/parsing/coercion.py

from typing import Any, List


def as_list(x: Any) -> List[Any]:
    if x is None:
        return []
    if isinstance(x, list):
        return x
    return []


# ✅ ADD THIS: Alias for underscore version
def _as_list(x: Any) -> List[Any]:
    """Alias for as_list (for backwards compatibility)"""
    return as_list(x)


def as_str(x: Any) -> str:
    return x.strip() if isinstance(x, str) else ""


def _as_str(x: Any) -> str:
    """Alias for as_str (for backwards compatibility)"""
    return as_str(x)


def clamp_int(n: Any, lo: int, hi: int, default: int) -> int:
    try:
        v = int(float(n))
        return max(lo, min(hi, v))
    except Exception:
        return default


def clamp_float(n: Any, lo: float, hi: float, default: float) -> float:
    try:
        v = float(n)
        return max(lo, min(hi, v))
    except Exception:
        return default