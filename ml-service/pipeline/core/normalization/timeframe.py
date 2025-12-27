# ml-service/pipeline/core/normalization/timeframe.py

from typing import Any
from ..parsing.coercion import as_str


def normalize_timeframe_key(tf: Any) -> str:
    """
    UI-safe keys (2 columns):
      - next_4_6_weeks
      - next_3_months
      - unknown

    Also accepts older/other keys and maps them safely.
    """
    t = as_str(tf).lower()
    if not t:
        return "unknown"

    # exact UI keys
    if t in ("next_4_6_weeks", "next-4-6-weeks", "next 4-6 weeks", "next 4 to 6 weeks"):
        return "next_4_6_weeks"
    if t in ("next_3_months", "next-3-months", "next 3 months", "next three months"):
        return "next_3_months"

    # map older 3-bucket keys into 2 columns
    if t in ("next_1_3_weeks", "next-1-3-weeks", "next 1-3 weeks", "next_3_6_weeks", "next-3-6-weeks", "next 3-6 weeks"):
        return "next_4_6_weeks"

    # heuristics
    if any(x in t for x in ["week", "weeks", "asap", "urgent", "immediate", "14 day", "7 day", "1-3", "3-6", "4-6", "4 to 6"]):
        return "next_4_6_weeks"

    if any(x in t for x in ["month", "months", "quarter", "12 week", "8 week", "10 week", "long term", "strategic"]):
        return "next_3_months"

    return "unknown"
