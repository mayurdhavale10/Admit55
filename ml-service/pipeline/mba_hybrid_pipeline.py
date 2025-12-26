#!/usr/bin/env python3
"""
mba_llm_detailed_pipeline.py v5.6.2 (429-proof + AdCom always visible + actionable recs refresh)

✅ Fixes requested:
- ✅ AdCom panel INCLUDED + never "disappears" in UI (non-empty fallback placeholders)
- ✅ Recommendations are more "actionable" and refresh reliably (cache-bust + stronger prompt + normalization)
- ✅ 429-proof calling (retry + downgrade model + fallback provider/model)
- ✅ UI-safe output (guaranteed fields + schema stability)
- ✅ CLI narrative flag fixed (was always False in your pasted v5.6.0)

ENV (optional):
- LLM_PROVIDER=groq|openai|gemini
- GROQ_API_KEY / GROQ_MODEL / GROQ_API_URL
- OPENAI_API_KEY / OPENAI_PRIMARY_MODEL / OPENAI_BASE_URL
- GEMINI_API_KEY / GEMINI_PRIMARY_MODEL

Optional model downgrade envs (used on 429):
- GROQ_FALLBACK_MODEL=llama-3.1-8b-instant
- OPENAI_FALLBACK_MODEL=gpt-4o-mini
- GEMINI_FALLBACK_MODEL=gemini-2.0-flash

Optional cache control:
- PIPELINE_DISABLE_CACHE=1   (disables in-memory prompt cache)
- PIPELINE_CACHE_BUST=<any>  (string appended to cache key + prompts, forces refresh)
"""

import os
import sys
import time
import json
import re
import hashlib
import random
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
import requests

load_dotenv()

PIPELINE_VERSION = "5.6.2"
CACHE_BUST = (os.environ.get("PIPELINE_CACHE_BUST") or "").strip()
DISABLE_CACHE = (os.environ.get("PIPELINE_DISABLE_CACHE") or "").strip() == "1"


# ----------------------------
# Optional PDF support (kept)
# ----------------------------
try:
    import PyPDF2  # noqa: F401
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False


# ============================================================
# SETTINGS
# ============================================================
@dataclass
class LLMSettings:
    provider: str  # "groq" | "openai" | "gemini"
    api_key: str
    model: str
    base_url: Optional[str] = None  # for groq/openai compatible
    timeout: int = 60


def _env_default_settings() -> LLMSettings:
    provider = (os.environ.get("LLM_PROVIDER") or "").strip().lower()

    groq_key = os.environ.get("GROQ_API_KEY", "")
    groq_model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    groq_base = os.environ.get("GROQ_API_URL") or "https://api.groq.com/openai/v1"

    gem_key = os.environ.get("GEMINI_API_KEY", "")
    gem_model = os.environ.get("GEMINI_PRIMARY_MODEL", "gemini-2.0-flash")

    openai_key = os.environ.get("OPENAI_API_KEY", "")
    openai_model = os.environ.get("OPENAI_PRIMARY_MODEL", "gpt-4o-mini")
    openai_base = os.environ.get("OPENAI_BASE_URL") or "https://api.openai.com/v1"

    if provider == "groq" and groq_key:
        return LLMSettings(provider="groq", api_key=groq_key, model=groq_model, base_url=groq_base)
    if provider == "gemini" and gem_key:
        return LLMSettings(provider="gemini", api_key=gem_key, model=gem_model)
    if provider == "openai" and openai_key:
        return LLMSettings(provider="openai", api_key=openai_key, model=openai_model, base_url=openai_base)

    # Auto-pick
    if groq_key:
        return LLMSettings(provider="groq", api_key=groq_key, model=groq_model, base_url=groq_base)
    if openai_key:
        return LLMSettings(provider="openai", api_key=openai_key, model=openai_model, base_url=openai_base)
    if gem_key:
        return LLMSettings(provider="gemini", api_key=gem_key, model=gem_model)

    return LLMSettings(provider="groq", api_key="", model=groq_model, base_url=groq_base)


def _build_fallback_from_env(primary: LLMSettings) -> Optional[LLMSettings]:
    """
    Prefer a DIFFERENT provider for real fallback.
    """
    groq_key = os.environ.get("GROQ_API_KEY", "")
    groq_model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    groq_base = os.environ.get("GROQ_API_URL") or "https://api.groq.com/openai/v1"

    openai_key = os.environ.get("OPENAI_API_KEY", "")
    openai_model = os.environ.get("OPENAI_PRIMARY_MODEL", "gpt-4o-mini")
    openai_base = os.environ.get("OPENAI_BASE_URL") or "https://api.openai.com/v1"

    gem_key = os.environ.get("GEMINI_API_KEY", "")
    gem_model = os.environ.get("GEMINI_PRIMARY_MODEL", "gemini-2.0-flash")

    candidates: List[LLMSettings] = []
    if groq_key:
        candidates.append(LLMSettings(provider="groq", api_key=groq_key, model=groq_model, base_url=groq_base))
    if openai_key:
        candidates.append(LLMSettings(provider="openai", api_key=openai_key, model=openai_model, base_url=openai_base))
    if gem_key:
        candidates.append(LLMSettings(provider="gemini", api_key=gem_key, model=gem_model))

    different = [c for c in candidates if c.provider != primary.provider]
    if different:
        return different[0]
    return candidates[0] if candidates else None


# ============================================================
# ENTITY EXTRACTION (for specificity validation)
# ============================================================
def extract_resume_entities(resume_text: str) -> Dict[str, set]:
    text = (resume_text or "").lower()
    entities: Dict[str, set] = {
        "companies": set(),
        "numbers": set(),
        "percentages": set(),
        "currencies": set(),
        "schools": set(),
        "roles": set(),
    }

    entities["numbers"] = set(re.findall(r"\b\d+\b", text))
    entities["percentages"] = set(re.findall(r"\d+%", text))
    entities["currencies"] = set(re.findall(r"(?:rs\.?|inr|usd|\$|₹|eur|€)\s*\d+(?:[.,]\d+)?", text))

    company_keywords = ["pvt", "ltd", "inc", "corp", "llc", "technologies", "solutions", "services", "labs", "systems"]
    words = re.findall(r"[a-z0-9&\-.]+", text)
    for i, w in enumerate(words):
        if any(kw in w for kw in company_keywords) and i > 0:
            entities["companies"].add(words[i - 1])

    role_patterns = [
        r"\b(manager|director|analyst|engineer|consultant|lead|head|vp|ceo|cto|cfo|coordinator|associate|intern)\b",
        r"\b(senior|junior|staff|principal|chief)\b",
    ]
    for pattern in role_patterns:
        entities["roles"].update(re.findall(pattern, text))

    print(
        f"[entities] Found: {len(entities['companies'])} companies, "
        f"{len(entities['numbers'])} numbers, {len(entities['roles'])} roles",
        file=sys.stderr,
    )
    return entities


def is_specific(text: str, resume_entities: Dict[str, set], min_score: int = 2) -> bool:
    if not text:
        return False
    t = text.lower()
    score = 0

    if any(num in t for num in resume_entities.get("numbers", [])):
        score += 2
    if any(pct in t for pct in resume_entities.get("percentages", [])):
        score += 2
    if any(curr in t for curr in resume_entities.get("currencies", [])):
        score += 2
    if any(company in t for company in resume_entities.get("companies", [])):
        score += 3
    if any(role in t for role in resume_entities.get("roles", [])):
        score += 1

    return score >= min_score


# ============================================================
# CACHING
# ============================================================
_PROMPT_CACHE: Dict[str, str] = {}


def _cache_key(settings: LLMSettings, prompt: str, temperature: float, max_tokens: int, response_format: Optional[str]) -> str:
    h = hashlib.sha256()
    h.update(
        (
            settings.provider
            + "|"
            + settings.model
            + "|"
            + str(temperature)
            + "|"
            + str(max_tokens)
            + "|"
            + str(response_format)
            + "|"
            + PIPELINE_VERSION
            + "|"
            + CACHE_BUST
        ).encode("utf-8")
    )
    h.update(prompt.encode("utf-8"))
    return h.hexdigest()


# ============================================================
# PROVIDER CALLS + 429 HANDLING
# ============================================================
class LLMError(Exception):
    pass


class LLMRateLimitError(LLMError):
    pass


def _openai_compatible_url(base_url: str) -> str:
    base = (base_url or "").rstrip("/")
    if base.endswith("/chat/completions"):
        return base
    if base.endswith("/v1"):
        return base + "/chat/completions"
    if base.endswith("/openai/v1"):
        return base + "/chat/completions"
    return base + "/v1/chat/completions"


def _looks_like_429(status_code: int, text: str) -> bool:
    if status_code == 429:
        return True
    t = (text or "").lower()
    return ("rate limit" in t) or ("rate_limit" in t) or ("tpd" in t) or ("too many requests" in t)


def _sleep_backoff(attempt: int) -> None:
    base = min(2.0, 0.25 * (2 ** attempt))
    time.sleep(base + random.random() * 0.2)


def call_llm_once(
    settings: LLMSettings,
    prompt: str,
    max_tokens: int,
    temperature: float,
    response_format: Optional[str],
) -> str:
    if not settings.api_key:
        raise LLMError(f"Missing API key for provider={settings.provider}")

    # Cache
    ck = _cache_key(settings, prompt, temperature, max_tokens, response_format)
    if (not DISABLE_CACHE) and ck in _PROMPT_CACHE:
        print(f"[llm] cache hit ({settings.provider}/{settings.model})", file=sys.stderr)
        return _PROMPT_CACHE[ck]

    provider = settings.provider.lower().strip()

    if provider in ("groq", "openai"):
        url = _openai_compatible_url(
            settings.base_url
            or ("https://api.openai.com/v1" if provider == "openai" else "https://api.groq.com/openai/v1")
        )
        headers = {"Authorization": f"Bearer {settings.api_key}", "Content-Type": "application/json"}
        payload: Dict[str, Any] = {
            "model": settings.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": int(max_tokens),
            "temperature": float(temperature),
        }
        if response_format == "json":
            payload["response_format"] = {"type": "json_object"}

        print(f"[llm:{provider}] Calling {settings.model} (max_tokens={max_tokens}, temp={temperature})", file=sys.stderr)
        r = requests.post(url, headers=headers, json=payload, timeout=settings.timeout)

        if r.status_code != 200:
            msg = r.text[:900]
            if _looks_like_429(r.status_code, msg):
                raise LLMRateLimitError(f"HTTP {r.status_code}: {msg}")
            raise LLMError(f"HTTP {r.status_code}: {msg}")

        data = r.json()
        content = data["choices"][0]["message"]["content"]
        if not content:
            raise LLMError("Empty response")
        out = content.strip()

        if not DISABLE_CACHE:
            _PROMPT_CACHE[ck] = out
        return out

    if provider == "gemini":
        model = settings.model
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": float(temperature), "maxOutputTokens": int(max_tokens)},
        }

        print(f"[llm:gemini] Calling {model} (max_tokens={max_tokens}, temp={temperature})", file=sys.stderr)
        r = requests.post(url, headers=headers, json=payload, timeout=settings.timeout)

        if r.status_code != 200:
            msg = r.text[:900]
            if _looks_like_429(r.status_code, msg):
                raise LLMRateLimitError(f"HTTP {r.status_code}: {msg}")
            raise LLMError(f"HTTP {r.status_code}: {msg}")

        data = r.json()
        candidates = data.get("candidates") or []
        if not candidates:
            raise LLMError("Empty candidates from Gemini")

        parts = (((candidates[0] or {}).get("content") or {}).get("parts")) or []
        if not parts:
            raise LLMError("Empty parts from Gemini")

        content = (parts[0] or {}).get("text") or ""
        out = content.strip()
        if not out:
            raise LLMError("Empty response text from Gemini")

        if not DISABLE_CACHE:
            _PROMPT_CACHE[ck] = out
        return out

    raise LLMError(f"Unsupported provider: {settings.provider}")


def _downgraded_model_for(settings: LLMSettings) -> Optional[str]:
    p = settings.provider.lower()
    if p == "groq":
        return os.environ.get("GROQ_FALLBACK_MODEL", "llama-3.1-8b-instant")
    if p == "openai":
        return os.environ.get("OPENAI_FALLBACK_MODEL", "gpt-4o-mini")
    if p == "gemini":
        return os.environ.get("GEMINI_FALLBACK_MODEL", "gemini-2.0-flash")
    return None


def call_llm(
    settings: LLMSettings,
    prompt: str,
    max_tokens: int = 1200,
    temperature: float = 0.2,
    response_format: Optional[str] = None,
    fallback: Optional[LLMSettings] = None,
    retries: int = 1,
) -> str:
    """
    429-proof:
    - try primary (retries)
    - if 429: try downgraded model (same provider)
    - then try fallback provider
    """
    last_err: Optional[Exception] = None

    for a in range(retries + 1):
        try:
            return call_llm_once(settings, prompt, max_tokens, temperature, response_format)
        except LLMRateLimitError as e:
            last_err = e
            print(f"[llm:{settings.provider}] rate-limited attempt {a+1}: {str(e)[:200]}", file=sys.stderr)
            _sleep_backoff(a)
        except Exception as e:
            last_err = e
            print(f"[llm:{settings.provider}] error attempt {a+1}: {str(e)[:200]}", file=sys.stderr)
            _sleep_backoff(a)

    downgraded = _downgraded_model_for(settings)
    if downgraded and downgraded != settings.model:
        st2 = LLMSettings(
            provider=settings.provider,
            api_key=settings.api_key,
            model=downgraded,
            base_url=settings.base_url,
            timeout=settings.timeout,
        )
        try:
            print(f"[llm] switching to downgraded model: {settings.provider}/{downgraded}", file=sys.stderr)
            return call_llm_once(st2, prompt, max_tokens, temperature, response_format)
        except Exception as e:
            last_err = e
            print(f"[llm] downgraded model failed: {str(e)[:200]}", file=sys.stderr)

    if fallback and fallback.api_key:
        try:
            print(f"[llm] switching to fallback: {fallback.provider}/{fallback.model}", file=sys.stderr)
            return call_llm_once(fallback, prompt, max_tokens, temperature, response_format)
        except Exception as e:
            last_err = e
            print(f"[llm] fallback failed: {str(e)[:200]}", file=sys.stderr)

    raise LLMError(str(last_err) if last_err else "Unknown LLM failure")


# ============================================================
# JSON PARSING HELPERS
# ============================================================
def _extract_first_json_object(text: str) -> str:
    if not text:
        raise ValueError("Empty text")

    text_strip = text.strip()
    if text_strip.startswith("{") and text_strip.endswith("}"):
        return text_strip

    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object start found")

    depth = 0
    for i in range(start, len(text)):
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1].strip()

    raise ValueError("Unbalanced JSON braces")


def parse_json_strictish(raw: str) -> Dict[str, Any]:
    try:
        return json.loads(raw)
    except Exception:
        j = _extract_first_json_object(raw)
        return json.loads(j)


def _as_list(x: Any) -> List[Any]:
    if x is None:
        return []
    if isinstance(x, list):
        return x
    return []


def _as_str(x: Any) -> str:
    return x.strip() if isinstance(x, str) else ""


def _clamp_int(n: Any, lo: int, hi: int, default: int) -> int:
    try:
        v = int(float(n))
        return max(lo, min(hi, v))
    except Exception:
        return default


# ============================================================
# PROMPTS
# ============================================================
def _context_block(context: Optional[Dict[str, str]]) -> str:
    if not context:
        return "Context: (none provided)\n"

    safe = {k: (v or "").strip() for k, v in context.items() if v is not None}
    lines = []
    for k in ["goal", "timeline", "tier", "test_status", "concern"]:
        if k in safe and safe[k]:
            lines.append(f"- {k}: {safe[k]}")
    if not lines:
        return "Context: (none provided)\n"
    return "Context:\n" + "\n".join(lines) + "\n"


# ✅ cache-bust string embedded into prompts too (so even if cache is on, it changes keys)
_PROMPT_PREFIX = f"PIPELINE_VERSION={PIPELINE_VERSION} CACHE_BUST={CACHE_BUST}\n"

SCORING_PROMPT = _PROMPT_PREFIX + """You are an MBA admissions expert. Analyze this resume and score it on 8 dimensions (0-10 scale). Use the Context only to adjust emphasis (do NOT hallucinate facts).

{context}

Resume:
{resume}

Return ONLY valid JSON with this exact structure:
{{
  "academics": <0-10>,
  "test_readiness": <0-10>,
  "leadership": <0-10>,
  "extracurriculars": <0-10>,
  "international": <0-10>,
  "work_impact": <0-10>,
  "impact": <0-10>,
  "industry": <0-10>
}}"""

HEADER_SUMMARY_PROMPT = _PROMPT_PREFIX + """You are an MBA admissions expert. Create a compelling header summary for this candidate.

CRITICAL: Extract ONLY factual details from the resume. Do NOT invent or assume anything.

{context}

Resume:
{resume}

Scores:
{scores}

Return ONLY valid JSON:
{{
  "summary": "2-3 sentence overview highlighting key strengths and critical gaps. Must reference specific details from resume.",
  "highlights": ["Experience", "Skill Area", "Education", "Achievement", "Gap/Status", ...],
  "applicantArchetypeTitle": "Brief professional identity based on resume facts",
  "applicantArchetypeSubtitle": "Additional context (e.g., 'Second MBA Applicant', 'Career Switcher', etc.)"
}}

Rules:
- highlights must be 8-12 items max and must be factual."""

ADCOM_PANEL_PROMPT = _PROMPT_PREFIX + """You are an MBA admissions committee member reviewing this candidate's profile.

{context}

Resume:
{resume}

Scores:
{scores}

Strengths:
{strengths}

Improvements:
{improvements}

Provide honest AdCom perspective in JSON format:
{{
  "what_excites": ["...", "...", "..."],
  "what_concerns": ["...", "...", "..."],
  "how_to_preempt": ["...", "...", "..."]
}}

Rules:
- Each array should have 3-5 items
- Be specific and reference actual resume details
- how_to_preempt MUST be actionable (what to do next + how + within a timeframe)"""

STRENGTHS_PROMPT = _PROMPT_PREFIX + """You are an MBA admissions expert analyzing a resume.

CRITICAL REQUIREMENT: You MUST reference SPECIFIC details from the resume in EVERY point:
- Company names, exact metrics, project names, team sizes, technologies, titles, time periods

{context}

Resume:
{resume}

Extract 4-6 TOP STRENGTHS. For each strength:
1) title: 5-8 words
2) summary: 2-3 sentences with SPECIFIC facts/numbers/companies from resume
3) score: 0-100 rating

Return JSON:
{{
  "strengths": [
    {{"title": "...", "summary": "...", "score": 85}}
  ]
}}"""

IMPROVEMENTS_PROMPT = _PROMPT_PREFIX + """You are an MBA admissions expert analyzing gaps in this candidate's profile.

Every suggestion must be SPECIFIC to their profile and aligned to Context goal/timeline if provided.

{context}

Resume:
{resume}

Current Scores:
{scores}

Identify 4-6 IMPROVEMENT AREAS. For each:
1) area: Short label
2) suggestion: 2-3 sentences with SPECIFIC, ACTIONABLE advice tailored to their background
3) score: 0-100 current rating

Return JSON:
{{
  "improvements": [
    {{"area": "...", "suggestion": "...", "score": 60}}
  ]
}}"""

# ✅ Stronger actionable recommendations prompt
RECOMMENDATIONS_PROMPT = _PROMPT_PREFIX + """You are an MBA admissions strategist creating an action plan.

Make it highly specific and prioritized, aligned to Context (timeline matters).

{context}

Resume:
{resume}

Scores:
{scores}

Strengths:
{strengths}

Improvements:
{improvements}

Create 5-8 PRIORITIZED RECOMMENDATIONS. Return ONLY valid JSON with this structure:
{{
  "recommendations": [
    {{
      "id": "rec_1",
      "type": "skill|test|extracurricular|career|resume|networking|other",
      "area": "Short label",
      "priority": "high|medium|low",
      "timeframe": "e.g., 'Next 7 days'|'2-4 weeks'|'By <Month>'",
      "action": "2-4 bullet-like sentences: WHAT to do, HOW to do it, and a concrete output (artifact) to produce",
      "estimated_impact": "1-2 sentences explaining MBA admissions benefit",
      "current_score": 0-100,
      "score": 0-100
    }}
  ]
}}

Hard rules:
- Every action must produce an OUTPUT artifact (e.g., '1-page leadership story', 'quantified impact bullets', 'portfolio link', 'mock interview answers')
- Include at least 2 recommendations that directly improve RESUME BULLETS (quantification, structure, proof)
- Do NOT recommend test prep if resume clearly includes GMAT >=700 or GRE >=325."""

NARRATIVE_PROMPT = _PROMPT_PREFIX + """You are an MBA admissions consultant writing a detailed profile assessment.

Use ONLY resume facts + the already computed analysis. Do not invent.

{context}

Resume:
{resume}

Analysis JSON:
{analysis}

Write a comprehensive assessment in THREE sections using this EXACT format:

### Top Strengths
- ...

### Improvement Areas
- ...

### Actionable Recommendations
- ...

Rules:
1) Every bullet must reference specific details from resume (companies, numbers, roles) OR explicitly say "not specified in resume"
2) Zero generic fluff

Return ONLY markdown text."""


# ============================================================
# TOKEN BUDGETS (reduce 429 risk)
# ============================================================
TOKENS = {
    "scoring": 450,
    "header_summary": 650,
    "strengths": 950,
    "improvements": 950,
    "adcom_panel": 850,
    "recommendations": 1150,
    "narrative": 1200,
}


# ============================================================
# PIPELINE STEPS
# ============================================================
def score_resume(resume_text: str, settings: LLMSettings, context: Optional[Dict[str, str]], fallback: Optional[LLMSettings]) -> Dict[str, float]:
    prompt = SCORING_PROMPT.format(resume=resume_text, context=_context_block(context))
    try:
        raw = call_llm(
            settings,
            prompt,
            max_tokens=TOKENS["scoring"],
            temperature=0.1,
            response_format="json" if settings.provider in ("groq", "openai") else None,
            fallback=fallback,
            retries=1,
        )
        data = parse_json_strictish(raw)
        normalized: Dict[str, float] = {}
        for k, v in data.items():
            try:
                n = float(v)
            except Exception:
                n = 5.0
            if n > 10:
                n = n / 10.0
            normalized[k] = round(max(0.0, min(10.0, n)), 2)

        required = ["academics", "test_readiness", "leadership", "extracurriculars", "international", "work_impact", "impact", "industry"]
        for rk in required:
            normalized.setdefault(rk, 5.0)

        print("[scoring] ✓", file=sys.stderr)
        return normalized
    except Exception as e:
        print(f"[scoring] ✗ default: {str(e)[:200]}", file=sys.stderr)

    return {k: 5.0 for k in ["academics", "test_readiness", "leadership", "extracurriculars", "international", "work_impact", "impact", "industry"]}


def generate_header_summary(resume_text: str, scores: Dict[str, float], settings: LLMSettings, context: Optional[Dict[str, str]], fallback: Optional[LLMSettings]) -> Dict[str, Any]:
    prompt = HEADER_SUMMARY_PROMPT.format(
        resume=resume_text,
        scores=json.dumps(scores, indent=2),
        context=_context_block(context),
    )
    try:
        raw = call_llm(
            settings,
            prompt,
            max_tokens=TOKENS["header_summary"],
            temperature=0.2,
            response_format="json" if settings.provider in ("groq", "openai") else None,
            fallback=fallback,
            retries=1,
        )
        data = parse_json_strictish(raw)
        result = {
            "summary": _as_str(data.get("summary", "")) or "Profile analysis complete. Review detailed sections below.",
            "highlights": _as_list(data.get("highlights", []))[:18],
            "applicantArchetypeTitle": _as_str(data.get("applicantArchetypeTitle", "")) or "MBA Candidate",
            "applicantArchetypeSubtitle": _as_str(data.get("applicantArchetypeSubtitle", "")),
        }
        print("[header_summary] ✓", file=sys.stderr)
        return result
    except Exception as e:
        print(f"[header_summary] ✗ default: {str(e)[:200]}", file=sys.stderr)

    return {
        "summary": "Profile analysis complete. Review detailed sections below.",
        "highlights": [],
        "applicantArchetypeTitle": "MBA Candidate",
        "applicantArchetypeSubtitle": "",
    }


def extract_strengths(resume_text: str, entities: Dict[str, set], settings: LLMSettings, context: Optional[Dict[str, str]], fallback: Optional[LLMSettings], max_retries: int = 2) -> List[Dict]:
    base_prompt = STRENGTHS_PROMPT.format(resume=resume_text, context=_context_block(context))
    cleaned: List[Dict] = []

    for attempt in range(max_retries):
        try:
            prompt = base_prompt
            if attempt > 0:
                prompt += "\n\nWARNING: Previous attempt too generic. MUST include resume-specific companies/metrics/roles. Return only JSON."

            raw = call_llm(
                settings,
                prompt,
                max_tokens=TOKENS["strengths"],
                temperature=0.2,
                response_format="json" if settings.provider in ("groq", "openai") else None,
                fallback=fallback,
                retries=1,
            )
            data = parse_json_strictish(raw)
            strengths = _as_list(data.get("strengths")) or []

            cleaned = []
            for s in strengths:
                if not isinstance(s, dict):
                    continue
                cleaned.append(
                    {
                        "title": _as_str(s.get("title")) or "Strength",
                        "summary": _as_str(s.get("summary")) or "",
                        "score": _clamp_int(s.get("score"), 0, 100, 70),
                    }
                )

            specific_count = sum(1 for s in cleaned if is_specific(f"{s.get('title','')} {s.get('summary','')}", entities, min_score=3))
            generic_ratio = 1 - (specific_count / max(1, len(cleaned)))
            print(f"[strengths] attempt {attempt+1}: {specific_count}/{len(cleaned)} specific", file=sys.stderr)

            if cleaned and generic_ratio <= 0.6:
                return cleaned

        except Exception as e:
            print(f"[strengths] ✗ attempt {attempt+1}: {str(e)[:200]}", file=sys.stderr)

    return cleaned or []


def extract_improvements(resume_text: str, scores: Dict[str, float], settings: LLMSettings, context: Optional[Dict[str, str]], fallback: Optional[LLMSettings]) -> List[Dict]:
    prompt = IMPROVEMENTS_PROMPT.format(
        resume=resume_text,
        scores=json.dumps(scores, indent=2),
        context=_context_block(context),
    )
    try:
        raw = call_llm(
            settings,
            prompt,
            max_tokens=TOKENS["improvements"],
            temperature=0.2,
            response_format="json" if settings.provider in ("groq", "openai") else None,
            fallback=fallback,
            retries=1,
        )
        data = parse_json_strictish(raw)
        improvements = _as_list(data.get("improvements")) or []
        cleaned: List[Dict] = []
        for it in improvements:
            if not isinstance(it, dict):
                continue
            cleaned.append(
                {
                    "area": _as_str(it.get("area")) or "Improvement Area",
                    "suggestion": _as_str(it.get("suggestion")) or "Consider strengthening this area.",
                    "score": _clamp_int(it.get("score"), 0, 100, 65),
                }
            )
        print(f"[improvements] ✓ {len(cleaned)}", file=sys.stderr)
        return cleaned
    except Exception as e:
        print(f"[improvements] ✗ default: {str(e)[:200]}", file=sys.stderr)

    return []


def generate_adcom_panel(resume_text: str, scores: Dict[str, float], strengths: List[Dict], improvements: List[Dict], settings: LLMSettings, context: Optional[Dict[str, str]], fallback: Optional[LLMSettings]) -> Dict[str, List[str]]:
    prompt = ADCOM_PANEL_PROMPT.format(
        resume=resume_text,
        scores=json.dumps(scores, indent=2),
        strengths=json.dumps(strengths, indent=2),
        improvements=json.dumps(improvements, indent=2),
        context=_context_block(context),
    )
    try:
        raw = call_llm(
            settings,
            prompt,
            max_tokens=TOKENS["adcom_panel"],
            temperature=0.25,
            response_format="json" if settings.provider in ("groq", "openai") else None,
            fallback=fallback,
            retries=1,
        )
        data = parse_json_strictish(raw)

        exc = [str(x).strip() for x in _as_list(data.get("what_excites")) if str(x).strip()][:5]
        con = [str(x).strip() for x in _as_list(data.get("what_concerns")) if str(x).strip()][:5]
        pre = [str(x).strip() for x in _as_list(data.get("how_to_preempt")) if str(x).strip()][:5]

        # ✅ ensure it NEVER becomes empty (so your UI won't hide it)
        if not exc:
            exc = ["AdCom view pending: rerun analysis for deeper strengths (rate-limit fallback)."]
        if not con:
            con = ["AdCom view pending: rerun analysis to surface concerns (rate-limit fallback)."]
        if not pre:
            pre = ["Try again in 2–3 minutes OR switch provider (Groq/OpenAI/Gemini)."]

        print("[adcom_panel] ✓", file=sys.stderr)
        return {"what_excites": exc, "what_concerns": con, "how_to_preempt": pre}

    except Exception as e:
        print(f"[adcom_panel] ✗ default: {str(e)[:200]}", file=sys.stderr)

    # ✅ non-empty fallback placeholders
    return {
        "what_excites": ["AdCom panel not generated (temporary provider limit)."],
        "what_concerns": ["AdCom panel not generated (temporary provider limit)."],
        "how_to_preempt": ["Rerun in 2–3 minutes or change provider/model."],
    }


def _normalize_recommendations(raw_recs: Any) -> List[Dict]:
    """
    Guarantees BOTH `score` and `current_score` exist (0-100 int),
    plus timeframe for better UI.
    """
    recs = _as_list(raw_recs)
    out: List[Dict] = []
    for i, r in enumerate(recs, start=1):
        if not isinstance(r, dict):
            continue

        score_val = r.get("score", r.get("current_score", r.get("rating", 70)))
        score_int = _clamp_int(score_val, 0, 100, 70)

        current_val = r.get("current_score", score_int)
        current_int = _clamp_int(current_val, 0, 100, score_int)

        out.append(
            {
                "id": _as_str(r.get("id")) or f"rec_{i}",
                "type": _as_str(r.get("type")) or "other",
                "area": _as_str(r.get("area")) or "General",
                "priority": (_as_str(r.get("priority")) or "medium").lower(),
                "timeframe": _as_str(r.get("timeframe")) or "Next 2-4 weeks",
                "action": _as_str(r.get("action")) or "Create one concrete output that improves this area.",
                "estimated_impact": _as_str(r.get("estimated_impact")) or "Improves overall competitiveness.",
                "score": score_int,
                "current_score": current_int,
            }
        )

    # ✅ if model returned nothing, still give useful actionable defaults (non-empty)
    if not out:
        out = [
            {
                "id": "rec_1",
                "type": "resume",
                "area": "Quantify impact",
                "priority": "high",
                "timeframe": "Next 7 days",
                "action": "Rewrite top 6 bullets to include metrics (%, ₹/$, time saved). Produce: updated 1-page resume PDF + a 'metrics evidence' note per bullet.",
                "estimated_impact": "Quantified impact is one of the strongest MBA signals for leadership + results.",
                "score": 70,
                "current_score": 60,
            },
            {
                "id": "rec_2",
                "type": "networking",
                "area": "Narrative clarity",
                "priority": "high",
                "timeframe": "Next 2 weeks",
                "action": "Write 3 stories (Leadership, Failure, Team conflict) in STAR format. Produce: 3 one-page story docs + 90-sec spoken version each.",
                "estimated_impact": "Stronger essays/interviews and clearer AdCom 'why MBA / why now'.",
                "score": 72,
                "current_score": 62,
            },
        ]
    return out


def extract_recommendations(resume_text: str, scores: Dict, strengths: List, improvements: List, settings: LLMSettings, context: Optional[Dict[str, str]], fallback: Optional[LLMSettings]) -> List[Dict]:
    prompt = RECOMMENDATIONS_PROMPT.format(
        resume=resume_text,
        scores=json.dumps(scores, indent=2),
        strengths=json.dumps(strengths, indent=2),
        improvements=json.dumps(improvements, indent=2),
        context=_context_block(context),
    )
    try:
        raw = call_llm(
            settings,
            prompt,
            max_tokens=TOKENS["recommendations"],
            temperature=0.3,
            response_format="json" if settings.provider in ("groq", "openai") else None,
            fallback=fallback,
            retries=1,
        )
        data = parse_json_strictish(raw)
        cleaned = _normalize_recommendations(data.get("recommendations"))
        print(f"[recommendations] ✓ {len(cleaned)}", file=sys.stderr)
        return cleaned
    except Exception as e:
        print(f"[recommendations] ✗ default: {str(e)[:200]}", file=sys.stderr)

    return _normalize_recommendations([])


def generate_narrative(resume_text: str, analysis: Dict[str, Any], settings: LLMSettings, context: Optional[Dict[str, str]], fallback: Optional[LLMSettings]) -> str:
    prompt = NARRATIVE_PROMPT.format(
        resume=resume_text,
        analysis=json.dumps(analysis, indent=2, ensure_ascii=False),
        context=_context_block(context),
    )
    try:
        out = call_llm(settings, prompt, max_tokens=TOKENS["narrative"], temperature=0.35, response_format=None, fallback=fallback, retries=1)
        print(f"[narrative] ✓ {len(out)} chars", file=sys.stderr)
        return out
    except Exception as e:
        print(f"[narrative] ✗ default: {str(e)[:200]}", file=sys.stderr)
    return "Narrative generation unavailable right now."


# ============================================================
# MAIN PIPELINE
# ============================================================
def run_pipeline(
    resume_text: str,
    settings: Optional[LLMSettings] = None,
    fallback: Optional[LLMSettings] = None,
    context: Optional[Dict[str, str]] = None,
    include_narrative: bool = False,  # default OFF
) -> Dict[str, Any]:
    settings = settings or _env_default_settings()
    if fallback is None:
        fallback = _build_fallback_from_env(settings)

    start = time.time()
    print("\n" + "=" * 60, file=sys.stderr)
    print(f"MBA ANALYSIS PIPELINE v{PIPELINE_VERSION} ({settings.provider}/{settings.model})", file=sys.stderr)
    if fallback:
        print(f"Fallback: {fallback.provider}/{fallback.model}", file=sys.stderr)
    if CACHE_BUST:
        print(f"Cache bust: {CACHE_BUST}", file=sys.stderr)
    print("=" * 60 + "\n", file=sys.stderr)

    resume_text = resume_text or ""
    entities = extract_resume_entities(resume_text)

    scores = score_resume(resume_text, settings, context, fallback)
    header_summary = generate_header_summary(resume_text, scores, settings, context, fallback)

    strengths = extract_strengths(resume_text, entities, settings, context, fallback, max_retries=2)
    improvements = extract_improvements(resume_text, scores, settings, context, fallback)

    adcom_panel = generate_adcom_panel(resume_text, scores, strengths, improvements, settings, context, fallback)
    recommendations = extract_recommendations(resume_text, scores, strengths, improvements, settings, context, fallback)

    # UI-safe guarantees
    if not header_summary.get("summary"):
        header_summary["summary"] = "Profile analysis complete. Review detailed sections below."
    if not isinstance(header_summary.get("highlights"), list):
        header_summary["highlights"] = []

    analysis = {
        "scores": scores,
        "header_summary": header_summary,
        "adcom_panel": adcom_panel,
        "strengths": strengths,
        "improvements": improvements,
        "recommendations": recommendations,
    }

    narrative = ""
    if include_narrative:
        narrative = generate_narrative(resume_text, analysis, settings, context, fallback)

    duration = round(time.time() - start, 2)
    print("\n" + "=" * 60, file=sys.stderr)
    print(f"PIPELINE COMPLETE in {duration}s", file=sys.stderr)
    print("=" * 60 + "\n", file=sys.stderr)

    return {
        "success": True,
        "original_resume": resume_text,

        # root fields (frontend expects)
        "scores": scores,
        "header_summary": header_summary,
        "adcom_panel": adcom_panel,
        "strengths": strengths,
        "improvements": improvements,
        "recommendations": recommendations,
        "narrative": narrative,

        # compatibility layer
        "analysis": analysis,

        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "pipeline_version": f"{PIPELINE_VERSION}-429-proof-adcom-safe",
        "processing_meta": {
            "total_duration_seconds": duration,
            "provider": settings.provider,
            "model": settings.model,
            "fallback_provider": fallback.provider if fallback else None,
            "fallback_model": fallback.model if fallback else None,
            "context_provided": bool(context),
            "include_narrative": include_narrative,
            "cache_size": len(_PROMPT_CACHE),
            "token_budgets": TOKENS,
            "cache_bust": CACHE_BUST,
            "cache_disabled": DISABLE_CACHE,
        },
    }


# ============================================================
# CLI
# ============================================================
def main():
    import argparse

    parser = argparse.ArgumentParser(description=f"MBA Pipeline v{PIPELINE_VERSION} (429-proof + AdCom safe)")
    parser.add_argument("resume_text", nargs="?", default="", help="Resume text OR path to a .txt file")
    parser.add_argument("--provider", default="", help="groq|openai|gemini (overrides env)")
    parser.add_argument("--model", default="", help="model name (overrides env)")
    parser.add_argument("--api_key", default="", help="api key (overrides env)")
    parser.add_argument("--base_url", default="", help="base url for groq/openai compatible")
    parser.add_argument("--no_narrative", action="store_true", help="disable narrative (saves tokens)")
    parser.add_argument("--context", default="", help="JSON string: {goal,timeline,tier,test_status,concern}")
    args = parser.parse_args()

    if not args.resume_text:
        print("Usage: python mba_llm_detailed_pipeline.py <resume_text_or_file>", file=sys.stderr)
        sys.exit(1)

    if os.path.isfile(args.resume_text):
        with open(args.resume_text, "r", encoding="utf-8") as f:
            resume_text = f.read()
    else:
        resume_text = args.resume_text

    settings = _env_default_settings()
    if args.provider:
        settings.provider = args.provider.strip().lower()
    if args.model:
        settings.model = args.model.strip()
    if args.api_key:
        settings.api_key = args.api_key.strip()
    if args.base_url:
        settings.base_url = args.base_url.strip()

    context = None
    if args.context.strip():
        try:
            ctx = json.loads(args.context)
            context = ctx if isinstance(ctx, dict) else None
        except Exception:
            context = None

    result = run_pipeline(
        resume_text=resume_text,
        settings=settings,
        fallback=None,  # auto-build from env
        context=context,
        include_narrative=(not args.no_narrative),  # ✅ fixed: was broken in your pasted v5.6.0
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
