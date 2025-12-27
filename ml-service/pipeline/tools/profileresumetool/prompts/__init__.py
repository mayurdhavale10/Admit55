# ml-service/pipeline/tools/profileresumetool/prompts/__init__.py
from __future__ import annotations

import os
from typing import Dict, Optional

def context_block(context: Optional[Dict[str, str]]) -> str:
    if not context:
        return "Context: (none provided)\n"
    safe = {k: (v or "").strip() for k, v in context.items() if v is not None}
    lines = []
    for k in ["goal", "timeline", "tier", "test_status", "concern"]:
        if safe.get(k):
            lines.append(f"- {k}: {safe[k]}")
    return ("Context:\n" + "\n".join(lines) + "\n") if lines else "Context: (none provided)\n"

def prompt_prefix(pipeline_version: str) -> str:
    cache_bust = (os.environ.get("PIPELINE_CACHE_BUST") or "").strip()
    return f"PIPELINE_VERSION={pipeline_version} CACHE_BUST={cache_bust}\n"
