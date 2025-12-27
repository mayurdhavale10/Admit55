# ml-service/pipeline/core/versioning.py

PIPELINE_VERSION = "5.7.0-profileresume-modular"

# Cache bust string (optional)
import os
CACHE_BUST = (os.environ.get("PIPELINE_CACHE_BUST") or "").strip()
DISABLE_CACHE = (os.environ.get("PIPELINE_DISABLE_CACHE") or "").strip() == "1"

# Your UI expects ONLY these timeframe buckets
UI_TIMEFRAME_KEYS = ("next_4_6_weeks", "next_3_months", "unknown")

# Token budgets (kept conservative to reduce 429 risk)
TOKENS = {
    "scoring": 420,
    "header_summary": 650,
    "strengths": 900,
    "improvements": 900,
    "adcom_panel": 850,
    "recommendations": 1100,
}
