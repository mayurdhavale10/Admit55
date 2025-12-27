# ml-service/pipeline/tools/profileresumetool/steps/strengths.py
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from pipeline.core.llm.retry import call_llm
from pipeline.core.parsing.json_parse import parse_json_strictish

from ..version import PIPELINE_VERSION, TOKENS
from ..prompts import context_block, prompt_prefix
from ..prompts.strengths import STRENGTHS_PROMPT
from . import as_list, as_str, clamp_int, response_format_for

def run_strengths(resume_text: str, settings, fallback, context: Optional[Dict[str, str]], max_retries: int = 2) -> List[Dict[str, Any]]:
    base = prompt_prefix(PIPELINE_VERSION) + STRENGTHS_PROMPT.format(
        resume=resume_text or "",
        context=context_block(context),
    )

    for attempt in range(max_retries):
        prompt = base
        if attempt > 0:
            prompt += "\n\nWARNING: Previous attempt too generic. MUST include resume-specific companies/metrics/roles. Return only JSON."

        try:
            raw = call_llm(
                settings=settings,
                prompt=prompt,
                max_tokens=TOKENS["strengths"],
                temperature=0.2,
                response_format=response_format_for(getattr(settings, "provider", "")),
                fallback=fallback,
                retries=1,
            )
            data = parse_json_strictish(raw)
            items = as_list(data.get("strengths"))
        except Exception:
            items = []

        cleaned: List[Dict[str, Any]] = []
        for s in items:
            if not isinstance(s, dict):
                continue
            cleaned.append({
                "title": as_str(s.get("title")) or "Strength",
                "summary": as_str(s.get("summary")) or "",
                "score": clamp_int(s.get("score"), 0, 100, 70),
            })

        if cleaned:
            return cleaned

    return []
