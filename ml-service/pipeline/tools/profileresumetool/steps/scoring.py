# ml-service/pipeline/tools/profileresumetool/steps/scoring.py
from __future__ import annotations

import json
from typing import Dict, Optional

from pipeline.core.llm.retry import call_llm
from pipeline.core.parsing.json_parse import parse_json_strictish

from ..version import PIPELINE_VERSION, TOKENS
from ..prompts import context_block, prompt_prefix
from ..prompts.scoring import SCORING_PROMPT
from . import response_format_for

REQUIRED_KEYS = [
    "academics", "test_readiness", "leadership", "extracurriculars",
    "international", "work_impact", "impact", "industry"
]

def run_scoring(resume_text: str, settings, fallback, context: Optional[Dict[str, str]]) -> Dict[str, float]:
    prompt = prompt_prefix(PIPELINE_VERSION) + SCORING_PROMPT.format(
        resume=resume_text or "",
        context=context_block(context),
    )

    try:
        raw = call_llm(
            settings=settings,
            prompt=prompt,
            max_tokens=TOKENS["scoring"],
            temperature=0.1,
            response_format=response_format_for(getattr(settings, "provider", "")),
            fallback=fallback,
            retries=1,
        )
        data = parse_json_strictish(raw)
    except Exception:
        data = {}

    out: Dict[str, float] = {}
    for k in REQUIRED_KEYS:
        v = data.get(k, 5.0)
        try:
            n = float(v)
        except Exception:
            n = 5.0
        if n > 10:
            n = n / 10.0
        out[k] = round(max(0.0, min(10.0, n)), 2)

    return out
