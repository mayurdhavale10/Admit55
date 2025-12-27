# ml-service/pipeline/tools/profileresumetool/steps/adcom_panel.py
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from pipeline.core.llm.retry import call_llm
from pipeline.core.parsing.json_parse import parse_json_strictish

from ..version import PIPELINE_VERSION, TOKENS
from ..prompts import context_block, prompt_prefix
from ..prompts.adcom_panel import ADCOM_PANEL_PROMPT
from . import as_list, as_str, ensure_non_empty_list, response_format_for

def run_adcom_panel(
    resume_text: str,
    scores: Dict[str, float],
    strengths: List[Dict[str, Any]],
    improvements: List[Dict[str, Any]],
    settings,
    fallback,
    context: Optional[Dict[str, str]],
) -> Dict[str, List[str]]:
    prompt = prompt_prefix(PIPELINE_VERSION) + ADCOM_PANEL_PROMPT.format(
        resume=resume_text or "",
        scores=json.dumps(scores, indent=2),
        strengths=json.dumps(strengths, indent=2),
        improvements=json.dumps(improvements, indent=2),
        context=context_block(context),
    )

    try:
        raw = call_llm(
            settings=settings,
            prompt=prompt,
            max_tokens=TOKENS["adcom_panel"],
            temperature=0.25,
            response_format=response_format_for(getattr(settings, "provider", "")),
            fallback=fallback,
            retries=1,
        )
        data = parse_json_strictish(raw)
    except Exception:
        data = {}

    exc = [as_str(x) for x in as_list(data.get("what_excites")) if as_str(x)][:5]
    con = [as_str(x) for x in as_list(data.get("what_concerns")) if as_str(x)][:5]
    pre = [as_str(x) for x in as_list(data.get("how_to_preempt")) if as_str(x)][:5]

    return {
        "what_excites": ensure_non_empty_list(exc, "AdCom view pending: rerun analysis for deeper strengths (temporary provider limit)."),
        "what_concerns": ensure_non_empty_list(con, "AdCom view pending: rerun analysis to surface concerns (temporary provider limit)."),
        "how_to_preempt": ensure_non_empty_list(pre, "Rerun in 2–3 minutes OR switch provider/model (Groq/OpenAI/Gemini)."),
    }
