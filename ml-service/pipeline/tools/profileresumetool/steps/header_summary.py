# ml-service/pipeline/tools/profileresumetool/steps/header_summary.py
from __future__ import annotations

import json
from typing import Any, Dict, Optional

from pipeline.core.llm.retry import call_llm
from pipeline.core.parsing.json_parse import parse_json_strictish

# ✅ Import the CORRECT context formatter
from .context_builder import format_context_for_prompt

from ..version import PIPELINE_VERSION, TOKENS
from ..prompts.header_summary import HEADER_SUMMARY_PROMPT
from . import as_list, as_str, response_format_for


def _prompt_prefix(version: str) -> str:
    return f"[ProfileResumeTool v{version}]\n\n"


def run_header_summary(
    resume_text: str,
    scores: Dict[str, float],
    settings,
    fallback,
    context: Optional[Dict[str, str]]
) -> Dict[str, Any]:
    
    # ✅ CRITICAL FIX: Use proper context formatter
    context_str = format_context_for_prompt(context) if context else "No specific context provided. Analyze profile generically."
    
    # ✅ DEBUG: Log context
    print(f"[HEADER_SUMMARY] Context being used:\n{context_str}\n")
    
    prompt = _prompt_prefix(PIPELINE_VERSION) + HEADER_SUMMARY_PROMPT.format(
        resume=resume_text or "",
        scores=json.dumps(scores, indent=2),
        context=context_str,
    )

    try:
        raw = call_llm(
            settings=settings,
            prompt=prompt,
            max_tokens=TOKENS["header_summary"],
            temperature=0.2,
            response_format=response_format_for(getattr(settings, "provider", "")),
            fallback=fallback,
            retries=1,
        )
        data = parse_json_strictish(raw)
        print("[HEADER_SUMMARY] ✅ Summary generated successfully")
    except Exception as e:
        print(f"[HEADER_SUMMARY] ❌ Failed: {e}")
        data = {}

    highlights = [as_str(x) for x in as_list(data.get("highlights")) if as_str(x)]
    highlights = highlights[:12]

    return {
        "summary": as_str(data.get("summary")) or "Profile analysis complete. Review detailed sections below.",
        "highlights": highlights,
        "applicantArchetypeTitle": as_str(data.get("applicantArchetypeTitle")) or "MBA Candidate",
        "applicantArchetypeSubtitle": as_str(data.get("applicantArchetypeSubtitle")),
    }