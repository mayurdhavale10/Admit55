# ml-service/pipeline/tools/profileresumetool/steps/improvements.py
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from pipeline.core.llm.retry import call_llm
from pipeline.core.parsing.json_parse import parse_json_strictish

from ..version import PIPELINE_VERSION, TOKENS
from ..prompts import context_block, prompt_prefix
from ..prompts.improvements import IMPROVEMENTS_PROMPT
from . import as_list, as_str, clamp_int, response_format_for

def run_improvements(resume_text: str, scores: Dict[str, float], settings, fallback, context: Optional[Dict[str, str]]) -> List[Dict[str, Any]]:
    prompt = prompt_prefix(PIPELINE_VERSION) + IMPROVEMENTS_PROMPT.format(
        resume=resume_text or "",
        scores=json.dumps(scores, indent=2),
        context=context_block(context),
    )

    try:
        raw = call_llm(
            settings=settings,
            prompt=prompt,
            max_tokens=TOKENS["improvements"],
            temperature=0.2,
            response_format=response_format_for(getattr(settings, "provider", "")),
            fallback=fallback,
            retries=1,
        )
        data = parse_json_strictish(raw)
        items = as_list(data.get("improvements"))
    except Exception:
        items = []

    cleaned: List[Dict[str, Any]] = []
    for it in items:
        if not isinstance(it, dict):
            continue
        cleaned.append({
            "area": as_str(it.get("area")) or "Improvement Area",
            "suggestion": as_str(it.get("suggestion")) or "Consider strengthening this area.",
            "score": clamp_int(it.get("score"), 0, 100, 65),
        })

    return cleaned
