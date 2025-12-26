#!/usr/bin/env python3
"""
mba_llm_detailed_pipeline.py v5.6.0
Provider-agnostic multi-call MBA resume pipeline (Groq / OpenAI / Gemini)

v5.6.0 changes:
- Recommendations schema updated:
  - Added `timeframe`: "next_4_6_weeks" | "next_3_months"
  - Fixed field mismatch: UI expects `current_score` (not `score`)
- Backward compatibility:
  - If model returns `score`, map -> `current_score`
  - If `timeframe` missing, infer from `priority`
"""

import os
import sys
import time
import json
import re
import hashlib
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
import requests

load_dotenv()

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
    """
    Default provider selection order:
    1) LLM_PROVIDER (if set)
    2) GROQ (if key exists)
    3) GEMINI (if key exists)
    4) OPENAI (if key exists)
    """
    provider = (os.environ.get("LLM_PROVIDER") or "").strip().lower()

    groq_key = os.environ.get("GROQ_API_KEY", "")
    groq_model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    groq_base = os.environ.get("GROQ_API_URL") or "https://api.groq.com/openai/v1"

    gem_key = os.environ.get("GEMINI_API_KEY", "")
    gem_model = os.environ.get("GEMINI_PRIMARY_MODEL", "gemini-2.0-flash")

    openai_key = os.environ.get("OPENAI_API_KEY", "")
    openai_model = os.environ.get(
        "OPENAI_PRIMARY_MODEL",
        os.environ.get("OPENAI_FOURTHFALLBACK_MODEL", "gpt-4o-mini"),
    )
    openai_base = os.environ.get("OPENAI_BASE_URL") or "https://api.openai.com/v1"

    if provider == "groq" and groq_key:
        return LLMSettings(provider="groq", api_key=groq_key, model=groq_model, base_url=groq_base)
    if provider == "gemini" and gem_key:
        return LLMSettings(provider="gemini", api_key=gem_key, model=gem_model)
    if provider == "openai" and openai_key:
        return LLMSettings(provider="openai", api_key=openai_key, model=openai_model, base_url=openai_base)

    # fallback auto
    if groq_key:
        return LLMSettings(provider="groq", api_key=groq_key, model=groq_model, base_url=groq_base)
    if gem_key:
        return LLMSettings(provider="gemini", api_key=gem_key, model=gem_model)
    if openai_key:
        return LLMSettings(provider="openai", api_key=openai_key, model=openai_model, base_url=openai_base)

    # if nothing, create a "broken" config so error is explicit
    return LLMSettings(provider="groq", api_key="", model=groq_model, base_url=groq_base)


# ============================================================
# ENTITY EXTRACTION (for specificity validation)
# ============================================================
def extract_resume_entities(resume_text: str) -> Dict[str, set]:
    """Extract key entities from resume for validation."""
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

    # Company name heuristic
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
    """Check if text references actual resume content."""
    if not text:
        return False
    text_lower = text.lower()
    score = 0

    if any(num in text_lower for num in resume_entities.get("numbers", [])):
        score += 2
    if any(pct in text_lower for pct in resume_entities.get("percentages", [])):
        score += 2
    if any(curr in text_lower for curr in resume_entities.get("currencies", [])):
        score += 2
    if any(company in text_lower for company in resume_entities.get("companies", [])):
        score += 3
    if any(role in text_lower for role in resume_entities.get("roles", [])):
        score += 1

    return score >= min_score


# ============================================================
# CACHING (cheap, avoids wasting calls)
# ============================================================
_PROMPT_CACHE: Dict[str, str] = {}


def _cache_key(settings: LLMSettings, prompt: str, temperature: float, max_tokens: int, response_format: Optional[str]) -> str:
    h = hashlib.sha256()
    h.update(
        (settings.provider + "|" + settings.model + "|" + str(temperature) + "|" + str(max_tokens) + "|" + str(response_format)).encode("utf-8")
    )
    h.update(prompt.encode("utf-8"))
    return h.hexdigest()


# ============================================================
# PROVIDER CALLS
# ============================================================
class LLMError(Exception):
    pass


def _openai_compatible_url(base_url: str) -> str:
    base = base_url.rstrip("/")
    if base.endswith("/chat/completions"):
        return base
    if base.endswith("/v1"):
        return base + "/chat/completions"
    # allow groq-style base https://api.groq.com/openai/v1
    if base.endswith("/openai/v1"):
        return base + "/chat/completions"
    return base + "/v1/chat/completions"


def call_llm(
    settings: LLMSettings,
    prompt: str,
    max_tokens: int = 2048,
    temperature: float = 0.2,
    response_format: Optional[str] = None,  # "json" or None
) -> str:
    """
    Provider-agnostic LLM call.
    - groq/openai: OpenAI-compatible chat.completions
    - gemini: generateContent API
    """
    if not settings.api_key:
        raise LLMError(f"Missing API key for provider={settings.provider}")

    ck = _cache_key(settings, prompt, temperature, max_tokens, response_format)
    if ck in _PROMPT_CACHE:
        print(f"[llm] cache hit ({settings.provider}/{settings.model})", file=sys.stderr)
        return _PROMPT_CACHE[ck]

    provider = settings.provider.lower().strip()

    if provider in ("groq", "openai"):
        url = _openai_compatible_url(
            settings.base_url
            or ("https://api.openai.com/v1" if provider == "openai" else "https://api.groq.com/openai/v1")
        )
        headers = {
            "Authorization": f"Bearer {settings.api_key}",
            "Content-Type": "application/json",
        }
        payload: Dict[str, Any] = {
            "model": settings.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": int(max_tokens),
            "temperature": float(temperature),
        }
        if response_format == "json":
            payload["response_format"] = {"type": "json_object"}

        try:
            print(f"[llm:{provider}] Calling {settings.model} (max_tokens={max_tokens}, temp={temperature})", file=sys.stderr)
            r = requests.post(url, headers=headers, json=payload, timeout=settings.timeout)
            if r.status_code != 200:
                raise LLMError(f"HTTP {r.status_code}: {r.text[:600]}")

            data = r.json()
            content = data["choices"][0]["message"]["content"]
            if not content:
                raise LLMError("Empty response")

            out = content.strip()
            _PROMPT_CACHE[ck] = out
            return out

        except requests.exceptions.Timeout:
            raise LLMError(f"Timeout after {settings.timeout}s")
        except Exception as e:
            raise LLMError(f"Request failed: {e}")

    if provider == "gemini":
        model = settings.model
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.api_key}"
        headers = {"Content-Type": "application/json"}

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": float(temperature),
                "maxOutputTokens": int(max_tokens),
            },
        }

        try:
            print(f"[llm:gemini] Calling {model} (max_tokens={max_tokens}, temp={temperature})", file=sys.stderr)
            r = requests.post(url, headers=headers, json=payload, timeout=settings.timeout)
            if r.status_code != 200:
                raise LLMError(f"HTTP {r.status_code}: {r.text[:600]}")

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

            _PROMPT_CACHE[ck] = out
            return out

        except requests.exceptions.Timeout:
            raise LLMError(f"Timeout after {settings.timeout}s")
        except Exception as e:
            raise LLMError(f"Request failed: {e}")

    raise LLMError(f"Unsupported provider: {settings.provider}")


# ============================================================
# JSON PARSING HELPERS (important for Gemini)
# ============================================================
def _extract_first_json_object(text: str) -> str:
    """
    Extract the first {...} JSON object from a string.
    Helps when provider returns extra text.
    """
    if not text:
        raise ValueError("Empty text")

    # quick path
    text_strip = text.strip()
    if text_strip.startswith("{") and text_strip.endswith("}"):
        return text_strip

    # find first balanced json object
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
                return text[start: i + 1].strip()

    raise ValueError("Unbalanced JSON braces")


def parse_json_strictish(raw: str) -> Dict[str, Any]:
    """
    Try strict json.loads, else try extracting first JSON object.
    """
    try:
        return json.loads(raw)
    except Exception:
        j = _extract_first_json_object(raw)
        return json.loads(j)


# ============================================================
# PROMPTS (context-aware)
# ============================================================
def _context_block(context: Optional[Dict[str, str]]) -> str:
    """
    context keys:
    - goal, timeline, tier, test_status, concern
    """
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


SCORING_PROMPT = """You are an MBA admissions expert. Analyze this resume and score it on 8 dimensions (0-10 scale). Use the Context only to adjust emphasis (do NOT hallucinate facts).

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


HEADER_SUMMARY_PROMPT = """You are an MBA admissions expert. Create a compelling header summary for this candidate.

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

Rules for highlights (8-12 items max):
- Experience: "X years experience" (if clear from resume)
- Work areas: Actual roles/functions from resume (e.g., "Corporate Strategy", "Product Management")
- Education: School names, degrees, certifications from resume
- Achievements: "Leadership", "Quantified Impact" (if resume shows it)
- Test status: "No GMAT/GRE", "GMAT 720", etc. (ONLY if mentioned in resume)
- International: "Limited International Exposure" or "Global Experience" (based on resume)
- Other factual tags from resume

For applicantArchetypeTitle:
- Use actual role/industry from resume + functional area

For applicantArchetypeSubtitle:
- ONLY if clearly evident from resume or context"""


ADCOM_PANEL_PROMPT = """You are an MBA admissions committee member reviewing this candidate's profile.

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
  "what_excites": ["..."],
  "what_concerns": ["..."],
  "how_to_preempt": ["..."]
}}

Rules:
- Each array should have 3-5 items
- Be specific and reference actual resume details"""


STRENGTHS_PROMPT = """You are an MBA admissions expert analyzing a resume.

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
}}

If you cannot find specific details, explicitly say: "Insufficient specifics in resume text" in the summary."""


IMPROVEMENTS_PROMPT = """You are an MBA admissions expert analyzing gaps in this candidate's profile.

Every suggestion must be SPECIFIC to their profile and (optionally) aligned to the Context goal/timeline.

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


# ✅ UPDATED (timeframe + current_score)
RECOMMENDATIONS_PROMPT = """You are an MBA admissions strategist creating an action plan.

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

Create 6-10 PRIORITIZED RECOMMENDATIONS. Return ONLY JSON with:

{{
  "recommendations": [
    {{
      "id": "rec_1",
      "timeframe": "next_4_6_weeks" | "next_3_months",
      "type": "skill|test|extracurricular|career|resume|networking|other",
      "area": "Short label",
      "priority": "high|medium|low",
      "action": "2-3 sentences with SPECIFIC steps tailored to their profile",
      "estimated_impact": "1-2 sentences explaining MBA admissions benefit",
      "current_score": 70
    }}
  ]
}}

Timeframe rules:
- priority="high" -> timeframe MUST usually be "next_4_6_weeks"
- priority in ("medium","low") -> timeframe MUST usually be "next_3_months"
- Use "next_4_6_weeks" for urgent/quick wins even if priority is medium, but keep it rare.

IMPORTANT:
- If resume clearly shows strong test score (e.g., GMAT ≥700 / GRE ≥325), do NOT recommend test prep.
- Do NOT invent facts; reference resume details only.
"""


NARRATIVE_PROMPT = """You are an MBA admissions consultant writing a detailed profile assessment.

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
# PIPELINE STEPS
# ============================================================
def score_resume(resume_text: str, settings: LLMSettings, context: Optional[Dict[str, str]], fallback: Optional[LLMSettings]) -> Dict[str, float]:
    prompt = SCORING_PROMPT.format(resume=resume_text, context=_context_block(context))

    for attempt, st in enumerate([settings] + ([fallback] if fallback else []), start=1):
        try:
            raw = call_llm(
                st,
                prompt,
                max_tokens=600,
                temperature=0.1,
                response_format="json" if st.provider in ("groq", "openai") else None
            )
            data = parse_json_strictish(raw)

            normalized: Dict[str, float] = {}
            for k, v in data.items():
                n = float(v)
                if n > 10:
                    n = n / 10.0
                normalized[k] = round(max(0.0, min(10.0, n)), 2)

            required = ["academics", "test_readiness", "leadership", "extracurriculars", "international", "work_impact", "impact", "industry"]
            for rk in required:
                normalized.setdefault(rk, 5.0)

            print(f"[scoring] ✓ ({st.provider}) {normalized}", file=sys.stderr)
            return normalized

        except Exception as e:
            print(f"[scoring] ✗ attempt {attempt} failed: {e}", file=sys.stderr)

    return {
        "academics": 5.0,
        "test_readiness": 5.0,
        "leadership": 5.0,
        "extracurriculars": 5.0,
        "international": 5.0,
        "work_impact": 5.0,
        "impact": 5.0,
        "industry": 5.0,
    }


def generate_header_summary(resume_text: str, scores: Dict[str, float], settings: LLMSettings, context: Optional[Dict[str, str]], fallback: Optional[LLMSettings]) -> Dict[str, Any]:
    prompt = HEADER_SUMMARY_PROMPT.format(
        resume=resume_text,
        scores=json.dumps(scores, indent=2),
        context=_context_block(context),
    )

    for attempt, st in enumerate([settings] + ([fallback] if fallback else []), start=1):
        try:
            raw = call_llm(
                st,
                prompt,
                max_tokens=1200,
                temperature=0.2,
                response_format="json" if st.provider in ("groq", "openai") else None
            )
            data = parse_json_strictish(raw)

            result = {
                "summary": data.get("summary", ""),
                "highlights": (data.get("highlights", []) or [])[:18],
                "applicantArchetypeTitle": data.get("applicantArchetypeTitle", ""),
                "applicantArchetypeSubtitle": data.get("applicantArchetypeSubtitle", ""),
            }

            print(f"[header_summary] ✓ ({st.provider}) generated summary + {len(result['highlights'])} highlights", file=sys.stderr)
            return result

        except Exception as e:
            print(f"[header_summary] ✗ attempt {attempt} failed: {e}", file=sys.stderr)

    return {
        "summary": "Profile analysis complete. Review detailed sections below.",
        "highlights": [],
        "applicantArchetypeTitle": "MBA Candidate",
        "applicantArchetypeSubtitle": "",
    }


def generate_adcom_panel(
    resume_text: str,
    scores: Dict[str, float],
    strengths: List[Dict],
    improvements: List[Dict],
    settings: LLMSettings,
    context: Optional[Dict[str, str]],
    fallback: Optional[LLMSettings],
) -> Dict[str, List[str]]:
    prompt = ADCOM_PANEL_PROMPT.format(
        resume=resume_text,
        scores=json.dumps(scores, indent=2),
        strengths=json.dumps(strengths, indent=2),
        improvements=json.dumps(improvements, indent=2),
        context=_context_block(context),
    )

    for attempt, st in enumerate([settings] + ([fallback] if fallback else []), start=1):
        try:
            raw = call_llm(
                st,
                prompt,
                max_tokens=1800,
                temperature=0.25,
                response_format="json" if st.provider in ("groq", "openai") else None
            )
            data = parse_json_strictish(raw)

            result = {
                "what_excites": data.get("what_excites", []) or [],
                "what_concerns": data.get("what_concerns", []) or [],
                "how_to_preempt": data.get("how_to_preempt", []) or [],
            }

            print(
                f"[adcom_panel] ✓ ({st.provider}) excites={len(result['what_excites'])}, concerns={len(result['what_concerns'])}, preempt={len(result['how_to_preempt'])}",
                file=sys.stderr,
            )
            return result

        except Exception as e:
            print(f"[adcom_panel] ✗ attempt {attempt} failed: {e}", file=sys.stderr)

    return {
        "what_excites": [],
        "what_concerns": [],
        "how_to_preempt": [],
    }


def extract_strengths(
    resume_text: str,
    entities: Dict[str, set],
    settings: LLMSettings,
    context: Optional[Dict[str, str]],
    fallback: Optional[LLMSettings],
    max_retries: int = 2
) -> List[Dict]:
    base_prompt = STRENGTHS_PROMPT.format(resume=resume_text, context=_context_block(context))
    providers_to_try = [settings] + ([fallback] if fallback else [])

    for st in providers_to_try:
        prompt = base_prompt
        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    prompt = base_prompt + "\n\nWARNING: Previous attempt was too generic. MUST include resume-specific companies/metrics/roles. Return only JSON."

                raw = call_llm(
                    st,
                    prompt,
                    max_tokens=2200,
                    temperature=0.2,
                    response_format="json" if st.provider in ("groq", "openai") else None
                )
                data = parse_json_strictish(raw)
                strengths = data.get("strengths", []) or []

                specific_count = sum(
                    1 for s in strengths
                    if is_specific(f"{s.get('title','')} {s.get('summary','')}", entities, min_score=3)
                )
                generic_ratio = 1 - (specific_count / max(1, len(strengths)))

                print(
                    f"[strengths] ({st.provider}) attempt {attempt+1}: {specific_count}/{len(strengths)} specific (generic {generic_ratio:.0%})",
                    file=sys.stderr,
                )

                if strengths and generic_ratio <= 0.5:
                    print(f"[strengths] ✓ using {st.provider} extracted {len(strengths)}", file=sys.stderr)
                    return strengths

            except Exception as e:
                print(f"[strengths] ✗ ({st.provider}) attempt {attempt+1} failed: {e}", file=sys.stderr)
                continue

    return []


def extract_improvements(
    resume_text: str,
    scores: Dict[str, float],
    settings: LLMSettings,
    context: Optional[Dict[str, str]],
    fallback: Optional[LLMSettings]
) -> List[Dict]:
    prompt = IMPROVEMENTS_PROMPT.format(
        resume=resume_text,
        scores=json.dumps(scores, indent=2),
        context=_context_block(context),
    )

    for attempt, st in enumerate([settings] + ([fallback] if fallback else []), start=1):
        try:
            raw = call_llm(
                st,
                prompt,
                max_tokens=2200,
                temperature=0.2,
                response_format="json" if st.provider in ("groq", "openai") else None
            )
            data = parse_json_strictish(raw)
            improvements = data.get("improvements", []) or []

            print(f"[improvements] ✓ ({st.provider}) {len(improvements)} areas", file=sys.stderr)
            return improvements

        except Exception as e:
            print(f"[improvements] ✗ attempt {attempt} failed: {e}", file=sys.stderr)

    return []


# ✅ UPDATED extractor: maps score->current_score, infers timeframe if missing
def extract_recommendations(
    resume_text: str,
    scores: Dict,
    strengths: List,
    improvements: List,
    settings: LLMSettings,
    context: Optional[Dict[str, str]],
    fallback: Optional[LLMSettings]
) -> List[Dict]:
    prompt = RECOMMENDATIONS_PROMPT.format(
        resume=resume_text,
        scores=json.dumps(scores, indent=2),
        strengths=json.dumps(strengths, indent=2),
        improvements=json.dumps(improvements, indent=2),
        context=_context_block(context),
    )

    for attempt, st in enumerate([settings] + ([fallback] if fallback else []), start=1):
        try:
            raw = call_llm(
                st,
                prompt,
                max_tokens=2800,
                temperature=0.3,
                response_format="json" if st.provider in ("groq", "openai") else None
            )
            data = parse_json_strictish(raw)
            recs = data.get("recommendations", []) or []

            for r in recs:
                # Backward compatible field mapping
                if "current_score" not in r and "score" in r:
                    r["current_score"] = r.get("score")

                # Ensure timeframe
                if "timeframe" not in r or not r.get("timeframe"):
                    pr = (r.get("priority") or "").lower().strip()
                    r["timeframe"] = "next_4_6_weeks" if pr == "high" else "next_3_months"

            print(f"[recommendations] ✓ ({st.provider}) {len(recs)} items", file=sys.stderr)
            return recs

        except Exception as e:
            print(f"[recommendations] ✗ attempt {attempt} failed: {e}", file=sys.stderr)

    return []


def generate_narrative(
    resume_text: str,
    analysis: Dict[str, Any],
    settings: LLMSettings,
    context: Optional[Dict[str, str]],
    fallback: Optional[LLMSettings]
) -> str:
    prompt = NARRATIVE_PROMPT.format(
        resume=resume_text,
        analysis=json.dumps(analysis, indent=2, ensure_ascii=False),
        context=_context_block(context),
    )

    for attempt, st in enumerate([settings] + ([fallback] if fallback else []), start=1):
        try:
            out = call_llm(st, prompt, max_tokens=2200, temperature=0.35, response_format=None)
            print(f"[narrative] ✓ ({st.provider}) {len(out)} chars", file=sys.stderr)
            return out
        except Exception as e:
            print(f"[narrative] ✗ attempt {attempt} failed: {e}", file=sys.stderr)

    return "Narrative generation failed."


# ============================================================
# MAIN PIPELINE
# ============================================================
def run_pipeline(
    resume_text: str,
    settings: Optional[LLMSettings] = None,
    fallback: Optional[LLMSettings] = None,
    context: Optional[Dict[str, str]] = None,
    include_narrative: bool = True,
) -> Dict[str, Any]:
    """
    Execute multi-call pipeline.
    - include_narrative=True keeps your "detailed explanation" section.
    """
    settings = settings or _env_default_settings()

    # default fallback: if primary is groq -> gemini else groq
    if fallback is None:
        if settings.provider == "groq" and os.environ.get("GEMINI_API_KEY"):
            fallback = LLMSettings(
                provider="gemini",
                api_key=os.environ.get("GEMINI_API_KEY", ""),
                model=os.environ.get("GEMINI_SECONDARYFALLBACK_MODEL", os.environ.get("GEMINI_PRIMARY_MODEL", "gemini-2.0-flash")),
            )
        elif settings.provider != "groq" and os.environ.get("GROQ_API_KEY"):
            fallback = LLMSettings(
                provider="groq",
                api_key=os.environ.get("GROQ_API_KEY", ""),
                model=os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
                base_url=os.environ.get("GROQ_API_URL", "https://api.groq.com/openai/v1"),
            )
        else:
            fallback = None

    start = time.time()
    print("\n" + "=" * 60, file=sys.stderr)
    print(f"MBA ANALYSIS PIPELINE v5.6.0 ({settings.provider}/{settings.model})", file=sys.stderr)
    if fallback:
        print(f"Fallback: {fallback.provider}/{fallback.model}", file=sys.stderr)
    print("=" * 60 + "\n", file=sys.stderr)

    entities = extract_resume_entities(resume_text)

    # Step 1: Score
    scores = score_resume(resume_text, settings, context, fallback)

    # Step 2: Header Summary
    header_summary = generate_header_summary(resume_text, scores, settings, context, fallback)

    # Step 3: Strengths, Improvements
    strengths = extract_strengths(resume_text, entities, settings, context, fallback, max_retries=2)
    improvements = extract_improvements(resume_text, scores, settings, context, fallback)

    # Step 4: AdCom Panel
    adcom_panel = generate_adcom_panel(resume_text, scores, strengths, improvements, settings, context, fallback)

    # Step 5: Recommendations (updated schema)
    recommendations = extract_recommendations(resume_text, scores, strengths, improvements, settings, context, fallback)

    analysis = {
        "scores": scores,
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
        "scores": scores,
        "header_summary": header_summary,
        "adcom_panel": adcom_panel,
        "strengths": strengths,
        "improvements": improvements,
        "recommendations": recommendations,
        "narrative": narrative,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "pipeline_version": "5.6.0-llm-agnostic",
        "processing_meta": {
            "total_duration_seconds": duration,
            "provider": settings.provider,
            "model": settings.model,
            "fallback_provider": fallback.provider if fallback else None,
            "fallback_model": fallback.model if fallback else None,
            "context_provided": bool(context),
            "include_narrative": include_narrative,
            "cache_size": len(_PROMPT_CACHE),
        },
    }


# ============================================================
# CLI
# ============================================================
def main():
    import argparse

    parser = argparse.ArgumentParser(description="MBA Pipeline v5.6.0 (Groq/OpenAI/Gemini)")
    parser.add_argument("resume_text", nargs="?", default="", help="Resume text OR path to a .txt file")
    parser.add_argument("--provider", default="", help="groq|openai|gemini (overrides env)")
    parser.add_argument("--model", default="", help="model name (overrides env)")
    parser.add_argument("--api_key", default="", help="api key (overrides env)")
    parser.add_argument("--base_url", default="", help="base url for groq/openai compatible")
    parser.add_argument("--no_narrative", action="store_true", help="disable narrative (saves cost)")
    parser.add_argument("--context", default="", help='JSON string: {"goal","timeline","tier","test_status","concern"}')
    args = parser.parse_args()

    if not args.resume_text:
        print("Usage: python script.py <resume_text_or_file>", file=sys.stderr)
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
            context = json.loads(args.context)
            if not isinstance(context, dict):
                context = None
        except Exception:
            context = None

    result = run_pipeline(
        resume_text=resume_text,
        settings=settings,
        fallback=None,
        context=context,
        include_narrative=not args.no_narrative,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
