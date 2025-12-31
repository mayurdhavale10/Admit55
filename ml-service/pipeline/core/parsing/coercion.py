# ml-service/pipeline/core/parsing/coercion.py

from typing import Any, List


def as_list(x: Any) -> List[Any]:
    if x is None:
        return []
    if isinstance(x, list):
        return x
    return []


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


# ✅ ADD THIS: Underscore alias
def _clamp_int(n: Any, lo: int, hi: int, default: int) -> int:
    """Alias for clamp_int (for backwards compatibility)"""
    return clamp_int(n, lo, hi, default)


def clamp_float(n: Any, lo: float, hi: float, default: float) -> float:
    try:
        v = float(n)
        return max(lo, min(hi, v))
    except Exception:
        return default


# ✅ ADD THIS: Underscore alias  
def _clamp_float(n: Any, lo: float, hi: float, default: float) -> float:
    """Alias for clamp_float (for backwards compatibility)"""
    return clamp_float(n, lo, hi, default)