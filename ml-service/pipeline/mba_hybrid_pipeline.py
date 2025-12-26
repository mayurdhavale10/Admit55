#!/usr/bin/env python3
"""
mba_llm_detailed_pipeline.py v5.7.0
(PRODUCTION — Narrative REMOVED, 3-phase tactical recommendations)

PHASE ENUMS (STRICT — UI MUST MATCH):
- next_1_3_weeks
- next_3_6_weeks
- next_3_months
"""

import os, sys, time, json, hashlib, random
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
import requests

load_dotenv()

PIPELINE_VERSION = "5.7.0"
CACHE_BUST = os.getenv("PIPELINE_CACHE_BUST", "")
DISABLE_CACHE = os.getenv("PIPELINE_DISABLE_CACHE") == "1"

# ============================================================
# SETTINGS
# ============================================================
@dataclass
class LLMSettings:
    provider: str
    api_key: str
    model: str
    base_url: Optional[str] = None
    timeout: int = 60


def _env_default_settings() -> LLMSettings:
    if os.getenv("GROQ_API_KEY"):
        return LLMSettings(
            provider="groq",
            api_key=os.getenv("GROQ_API_KEY"),
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            base_url=os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1"),
        )
    if os.getenv("OPENAI_API_KEY"):
        return LLMSettings(
            provider="openai",
            api_key=os.getenv("OPENAI_API_KEY"),
            model=os.getenv("OPENAI_PRIMARY_MODEL", "gpt-4o-mini"),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
        )
    raise RuntimeError("No LLM provider configured")


# ============================================================
# CACHING
# ============================================================
_PROMPT_CACHE: Dict[str, str] = {}

def _cache_key(settings, prompt, temp, tokens):
    h = hashlib.sha256()
    h.update(
        f"{settings.provider}|{settings.model}|{temp}|{tokens}|{PIPELINE_VERSION}|{CACHE_BUST}".encode()
    )
    h.update(prompt.encode())
    return h.hexdigest()


# ============================================================
# LLM CALL (429-SAFE)
# ============================================================
def call_llm(settings, prompt, max_tokens, temperature, retries=1):
    ck = _cache_key(settings, prompt, temperature, max_tokens)
    if not DISABLE_CACHE and ck in _PROMPT_CACHE:
        return _PROMPT_CACHE[ck]

    url = f"{settings.base_url.rstrip('/')}/chat/completions"
    headers = {"Authorization": f"Bearer {settings.api_key}", "Content-Type": "application/json"}

    for attempt in range(retries + 1):
        try:
            r = requests.post(
                url,
                headers=headers,
                json={
                    "model": settings.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "response_format": {"type": "json_object"},
                },
                timeout=settings.timeout,
            )
            if r.status_code == 200:
                out = r.json()["choices"][0]["message"]["content"].strip()
                if not DISABLE_CACHE:
                    _PROMPT_CACHE[ck] = out
                return out

            if r.status_code == 429:
                time.sleep(0.4 + random.random())
            else:
                raise RuntimeError(r.text)

        except Exception:
            time.sleep(0.4)

    raise RuntimeError("LLM failed after retries")


def parse_json(raw: str) -> Dict[str, Any]:
    try:
        return json.loads(raw)
    except Exception:
        start, end = raw.find("{"), raw.rfind("}")
        return json.loads(raw[start : end + 1])


# ============================================================
# PROMPTS
# ============================================================
PREFIX = f"PIPELINE_VERSION={PIPELINE_VERSION} CACHE_BUST={CACHE_BUST}\n"

SCORING_PROMPT = PREFIX + """
Score the resume on 8 MBA dimensions (0–10).

Resume:
{resume}

Return JSON only:
{
 "academics":0,"test_readiness":0,"leadership":0,"extracurriculars":0,
 "international":0,"work_impact":0,"impact":0,"industry":0
}
"""

HEADER_PROMPT = PREFIX + """
Create a factual MBA header summary.

Resume:
{resume}

Scores:
{scores}

Return JSON:
{
 "summary":"...",
 "highlights":["..."],
 "applicantArchetypeTitle":"...",
 "applicantArchetypeSubtitle":""
}
"""

STRENGTHS_PROMPT = PREFIX + """
Extract 4–6 resume-specific strengths.

Resume:
{resume}

Return JSON:
{"strengths":[{"title":"...","summary":"...","score":85}]}
"""

IMPROVEMENTS_PROMPT = PREFIX + """
Extract 4–6 improvement areas.

Resume:
{resume}

Scores:
{scores}

Return JSON:
{"improvements":[{"area":"...","suggestion":"...","score":60}]}
"""

ADCOM_PROMPT = PREFIX + """
AdCom perspective.

Resume:
{resume}
Scores:
{scores}

Return JSON:
{
 "what_excites":["..."],
 "what_concerns":["..."],
 "how_to_preempt":["..."]
}
"""

# 🔥 ONLY PROMPT THAT WAS REWRITTEN
RECOMMENDATIONS_PROMPT = PREFIX + """
You are an MBA admissions strategist creating a PHASED ACTION PLAN.

PHASE ENUM (STRICT):
- next_1_3_weeks
- next_3_6_weeks
- next_3_months

Resume:
{resume}

Scores:
{scores}

Strengths:
{strengths}

Improvements:
{improvements}

Return ONLY JSON:
{
 "recommendations":[
  {
   "id":"rec_1",
   "type":"resume|career|test|leadership|networking|other",
   "area":"Short label",
   "priority":"high|medium|low",
   "timeframe":"next_1_3_weeks | next_3_6_weeks | next_3_months",
   "action":"STEP-BY-STEP WHAT + HOW + OUTPUT artifact",
   "estimated_impact":"Why AdCom cares",
   "current_score":0-100,
   "score":0-100
  }
 ]
}

RULES:
- 6–10 total recommendations
- ≥2 per phase
- EVERY action produces a concrete artifact
- ≥3 must directly improve RESUME BULLETS
- NO narrative prose
"""

# ============================================================
# PIPELINE
# ============================================================
def run_pipeline(resume_text: str) -> Dict[str, Any]:
    settings = _env_default_settings()

    scores = parse_json(call_llm(settings, SCORING_PROMPT.format(resume=resume_text), 450, 0.1))
    header = parse_json(call_llm(settings, HEADER_PROMPT.format(resume=resume_text, scores=json.dumps(scores)), 650, 0.2))
    strengths = parse_json(call_llm(settings, STRENGTHS_PROMPT.format(resume=resume_text), 900, 0.2)).get("strengths", [])
    improvements = parse_json(call_llm(settings, IMPROVEMENTS_PROMPT.format(resume=resume_text, scores=json.dumps(scores)), 900, 0.2)).get("improvements", [])
    adcom = parse_json(call_llm(settings, ADCOM_PROMPT.format(resume=resume_text, scores=json.dumps(scores)), 800, 0.25))

    recommendations = parse_json(
        call_llm(
            settings,
            RECOMMENDATIONS_PROMPT.format(
                resume=resume_text,
                scores=json.dumps(scores),
                strengths=json.dumps(strengths),
                improvements=json.dumps(improvements),
            ),
            1200,
            0.3,
        )
    ).get("recommendations", [])

    # safety: AdCom never empty
    adcom.setdefault("what_excites", ["AdCom insight pending."])
    adcom.setdefault("what_concerns", ["AdCom insight pending."])
    adcom.setdefault("how_to_preempt", ["Re-run analysis if needed."])

    return {
        "success": True,
        "scores": scores,
        "header_summary": header,
        "strengths": strengths,
        "improvements": improvements,
        "adcom_panel": adcom,
        "recommendations": recommendations,
        "pipeline_version": PIPELINE_VERSION,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


if __name__ == "__main__":
    resume = sys.stdin.read()
    print(json.dumps(run_pipeline(resume), indent=2))
