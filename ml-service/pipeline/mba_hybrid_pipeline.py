#!/usr/bin/env python3
"""
mba_hybrid_pipeline.py v5.1.0 (Groq 2-Call)
-------------------------------------------
Architecture:

- Groq ONLY (no Gemini / OpenAI).
- Call 1: Structured JSON analysis.
- Call 2: Narrative enrichment (Aviral-level detail).

ENV REQUIRED:
  GROQ_API_KEY        = your Groq key
  GROQ_MODEL          = llama-3.3-70b-versatile   (or any Groq chat model)

Exports used by FastAPI:
  - PDF_SUPPORT
  - extract_text_from_pdf(pdf_path: str) -> str
  - run_pipeline(resume_text: str, include_improvement: bool = False) -> dict
  - improve_resume(resume_text: str) -> str
"""

import os
import sys
import time
import json
import re
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()

import requests

# ============================================================
# PDF SUPPORT
# ============================================================
try:
    import PyPDF2
    PDF_SUPPORT = True
    print("[PDF] PyPDF2 loaded successfully", file=sys.stderr)
except ImportError:
    PDF_SUPPORT = False
    print("[PDF] PyPDF2 not installed. PDF support disabled. Run: pip install PyPDF2", file=sys.stderr)


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF file using PyPDF2."""
    if not PDF_SUPPORT:
        raise RuntimeError("PyPDF2 not installed. Run: pip install PyPDF2")

    print(f"[PDF] Extracting text from: {pdf_path}", file=sys.stderr)
    try:
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            num_pages = len(reader.pages)
            print(f"[PDF] Processing {num_pages} pages...", file=sys.stderr)

            for i, page in enumerate(reader.pages, 1):
                page_text = page.extract_text() or ""
                text += page_text + "\n\n"
                print(f"[PDF] Page {i}/{num_pages} extracted", file=sys.stderr)

        text = text.strip()
        if not text:
            raise RuntimeError("No text extracted from PDF (might be scanned images).")

        print(f"[PDF] [OK] Extracted {len(text)} characters total", file=sys.stderr)
        return text
    except Exception as e:
        print(f"[PDF] [FAIL] Extraction error: {e}", file=sys.stderr)
        raise RuntimeError(f"Failed to extract PDF: {e}")


# ============================================================
# ENV & CONFIG (GROQ ONLY)
# ============================================================
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

print("[CONFIG] Groq configuration loaded:", file=sys.stderr)
print(f"  GROQ_MODEL: {GROQ_MODEL}", file=sys.stderr)


# ============================================================
# JSON UTILS
# ============================================================
def normalize_scores_to_0_10(scores_dict: Dict[str, Any]) -> Dict[str, float]:
    """Normalize scores to 0–10. If >10, assume 0–100 and scale down."""
    out: Dict[str, float] = {}
    for k, v in scores_dict.items():
        try:
            n = float(v)
        except Exception:
            n = 5.0

        if n > 10:
            n = n / 10.0
        n = max(0.0, min(10.0, n))
        out[k] = round(n, 2)
    return out


def validate_scores(scores: Dict[str, Any]) -> bool:
    """Ensure we have all 8 keys and each is 0–10."""
    required_keys = [
        "academics",
        "test_readiness",
        "leadership",
        "extracurriculars",
        "international",
        "work_impact",
        "impact",
        "industry",
    ]

    if not all(k in scores for k in required_keys):
        missing = set(required_keys) - set(scores.keys())
        print(f"[validate] Missing score keys: {missing}", file=sys.stderr)
        return False

    for k in required_keys:
        v = scores.get(k)
        if not isinstance(v, (int, float)):
            print(f"[validate] Non-numeric score for {k}: {v}", file=sys.stderr)
            return False
        if v < 0 or v > 10:
            print(f"[validate] Score out of range for {k}: {v}", file=sys.stderr)
            return False

    return True


# ============================================================
# MASTER PROMPTS
# ============================================================
MASTER_JSON_PROMPT = """
You are an elite MBA admissions evaluator.

Given the resume below, produce ONE JSON object with the following exact structure (no extra keys):

{
  "scores": {
    "academics": 0-10,
    "test_readiness": 0-10,
    "leadership": 0-10,
    "extracurriculars": 0-10,
    "international": 0-10,
    "work_impact": 0-10,
    "impact": 0-10,
    "industry": 0-10
  },
  "strengths": [
    {
      "title": "string",
      "summary": "1-3 sentences, highly specific to this candidate",
      "score": 0-100
    }
  ],
  "improvements": [
    {
      "area": "string",
      "suggestion": "1-3 sentences, concrete and specific action",
      "score": 0-100
    }
  ],
  "recommendations": [
    {
      "id": "string",
      "type": "skill | test | extracurricular | career | resume | networking | other",
      "area": "string",
      "priority": "high | medium | low",
      "action": "1-3 sentences, very specific action steps",
      "estimated_impact": "1-2 sentences, why this matters for MBA admissions",
      "score": 0-100
    }
  ],
  "improved_resume": "string"
}

SCORING:
- All scores must be numeric.
- "scores" must be 0–10.
- Other "score" fields (strengths/improvements/recommendations) must be 0–100.

CONTENT RULES:
1. Be VERY SPECIFIC to this person:
   - Use company names, role titles, industries, metrics and numbers from the resume.
   - Avoid generic advice like "improve leadership" without context.
2. "strengths": 3–6 items, each with a strong title + 1–3 sentence summary.
3. "improvements": 3–6 items with clear, actionable suggestions.
4. "recommendations": 3–8 items, prioritized, with clear actions and impact.
5. "improved_resume":
   - Re-write the resume for MBA applications.
   - Keep all facts consistent (do NOT invent achievements or dates).
   - Use bullet points with strong impact verbs and metrics where available.
   - Keep a clean, ATS-friendly text format.

VERY IMPORTANT:
- If the resume already mentions a strong GMAT (>=700) or GRE (>=325) or MBA/PGP from IIM/ISB/top school,
  do NOT suggest "take GMAT/GRE" as a recommendation.
- Output MUST be valid JSON with EXACTLY those top-level keys:
  "scores", "strengths", "improvements", "recommendations", "improved_resume".
- DO NOT wrap the JSON in markdown, DO NOT add commentary.

Resume:
--------------------
{resume}
--------------------
Return ONLY the JSON object.
"""

NARRATIVE_PROMPT_TEMPLATE = """
You are an elite MBA admissions consultant.

You are given:
1) The candidate's original resume.
2) A JSON analysis of their profile (scores, strengths, improvements, recommendations).

Using BOTH, write a detailed, highly specific report in THREE sections:

### Top Strengths
- 3–6 bullet points.
- Each bullet 2–3 lines.
- Explicitly reference company names, roles, industries, and numbers from the resume.
- Make each bullet feel like a sharp, admissions-ready comment.

### Improvement Areas
- 3–6 bullet points.
- Each bullet 2–3 lines.
- Explain what is missing or weak and how to fix it with concrete steps.

### Actionable Recommendations
- 4–8 bullet points.
- Use tags like [HIGH], [MEDIUM], [LOW] at the start of each bullet.
- Each bullet 2–3 lines.
- Explain exactly what to do and why it matters for MBA admissions (link to their profile, not generic advice).

Rules:
- Be very specific to THIS candidate.
- Never use generic advice without linking to their actual experience.
- Do NOT invent achievements. Only use what appears in the resume or what is a reasonable extension of it.
- Return PLAIN MARKDOWN TEXT ONLY. No JSON.

Candidate Resume:
--------------------
{resume}
--------------------

Analysis JSON:
--------------------
{analysis_json}
--------------------
"""


# ============================================================
# GROQ CALLS
# ============================================================
class GroqError(Exception):
    pass


def _groq_post(payload: Dict[str, Any], timeout: int = 60) -> Dict[str, Any]:
    if not GROQ_API_KEY:
        raise GroqError("Missing GROQ_API_KEY")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        print(f"[groq] Calling model={payload.get('model')} max_tokens={payload.get('max_tokens')}", file=sys.stderr)
        r = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=timeout)
        status = r.status_code

        if status != 200:
            text = r.text[:500]
            if status == 429:
                raise GroqError(f"Rate limit (429): {text}")
            elif 500 <= status < 600:
                raise GroqError(f"Server error {status}: {text}")
            else:
                raise GroqError(f"HTTP {status}: {text}")

        data = r.json()
        return data
    except requests.exceptions.Timeout:
        raise GroqError(f"Request timed out after {timeout}s")
    except requests.exceptions.RequestException as e:
        raise GroqError(f"Request failed: {e}")


def call_groq_json(prompt: str, max_tokens: int = 4096, temperature: float = 0.2, timeout: int = 60) -> Dict[str, Any]:
    """
    Call Groq expecting STRICT JSON (uses response_format=json_object).
    Returns parsed JSON dict.
    """
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "max_tokens": int(max_tokens),
        "temperature": float(temperature),
        "response_format": {"type": "json_object"},
    }

    data = _groq_post(payload, timeout=timeout)
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as e:
        raise GroqError(f"Unexpected response structure: {data}") from e

    if not content:
        raise GroqError("Empty JSON content from Groq")

    content = content.strip()
    print(f"[groq-json] Raw length={len(content)} chars", file=sys.stderr)

    # It SHOULD be pure JSON because of response_format=json_object
    try:
        parsed = json.loads(content)
        return parsed
    except json.JSONDecodeError as e:
        print(f"[groq-json] JSON decode failed, trying minor cleanup: {e}", file=sys.stderr)
        # Basic cleanup fallback
        cleaned = content.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)


def call_groq_text(prompt: str, max_tokens: int = 4096, temperature: float = 0.4, timeout: int = 60) -> str:
    """
    Call Groq for free-form text (no JSON enforcement).
    """
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "max_tokens": int(max_tokens),
        "temperature": float(temperature),
    }

    data = _groq_post(payload, timeout=timeout)
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as e:
        raise GroqError(f"Unexpected response structure (text): {data}") from e

    content = (content or "").strip()
    if not content:
        raise GroqError("Empty text response from Groq")

    print(f"[groq-text] Response length={len(content)} chars", file=sys.stderr)
    return content


# ============================================================
# MAIN PIPELINE (2-CALL)
# ============================================================
def run_pipeline(resume_text: str, include_improvement: bool = False) -> Dict[str, Any]:
    """
    Execute the full MBA analysis with TWO Groq calls:

    1) JSON analysis (scores, strengths, improvements, recommendations, improved_resume)
    2) Narrative enrichment (detailed strengths/improvements/recommendations) as 'narrative' field.

    Returns dict used by FastAPI /analyze endpoint.
    """
    print("\n" + "=" * 60, file=sys.stderr)
    print("MBA RESUME ANALYSIS PIPELINE v5.1.0 (Groq 2-call)", file=sys.stderr)
    print(f"[LLM] Using Groq model: {GROQ_MODEL}", file=sys.stderr)
    print("=" * 60 + "\n", file=sys.stderr)

    cleaned_resume = (resume_text or "").strip()
    if len(cleaned_resume) > 50000:
        print(f"[pipeline] Truncating resume from {len(cleaned_resume)} to 50000 chars", file=sys.stderr)
        cleaned_resume = cleaned_resume[:50000]

    # ---------------------------
    # Call 1: JSON analysis
    # ---------------------------
    json_prompt = MASTER_JSON_PROMPT.replace("{resume}", cleaned_resume)

    try:
        analysis_raw = call_groq_json(json_prompt, max_tokens=4096, temperature=0.2)
        print("[pipeline] ✓ JSON analysis call succeeded", file=sys.stderr)
    except Exception as e:
        print(f"[pipeline] ✗ JSON analysis failed: {e}", file=sys.stderr)
        # Hard fallback
        return {
            "original_resume": cleaned_resume,
            "scores": {
                "academics": 5.0,
                "test_readiness": 5.0,
                "leadership": 5.0,
                "extracurriculars": 5.0,
                "international": 5.0,
                "work_impact": 5.0,
                "impact": 5.0,
                "industry": 5.0,
            },
            "strengths": [],
            "improvements": [],
            "recommendations": [],
            "improved_resume": "[Pipeline failed – returning original resume]\n\n" + cleaned_resume,
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "pipeline_version": "5.1.0-groq-2call-error-json",
            "error": str(e),
        }

    # Extract + normalize
    scores = analysis_raw.get("scores", {}) or {}
    strengths = analysis_raw.get("strengths", []) or []
    improvements = analysis_raw.get("improvements", []) or []
    recommendations = analysis_raw.get("recommendations", []) or []
    improved_resume = analysis_raw.get("improved_resume", "") or ""

    # Normalize scores
    scores = normalize_scores_to_0_10(scores)
    if not validate_scores(scores):
        print("[pipeline] ⚠ Invalid score structure; falling back to 5.0s", file=sys.stderr)
        scores = {
            "academics": 5.0,
            "test_readiness": 5.0,
            "leadership": 5.0,
            "extracurriculars": 5.0,
            "international": 5.0,
            "work_impact": 5.0,
            "impact": 5.0,
            "industry": 5.0,
        }

    # Normalize strengths
    norm_strengths: List[Dict[str, Any]] = []
    for s in strengths:
        title = s.get("title") or "Strength"
        summary = s.get("summary") or ""
        sc = s.get("score", 70)
        try:
            sc = float(sc)
        except Exception:
            sc = 70.0
        norm_strengths.append(
            {
                "title": title,
                "summary": summary,
                "score": int(max(0, min(100, round(sc)))),
            }
        )

    # Normalize improvements
    norm_improvements: List[Dict[str, Any]] = []
    for imp in improvements:
        area = imp.get("area") or "Area"
        suggestion = imp.get("suggestion") or ""
        sc = imp.get("score", 50)
        try:
            sc = float(sc)
        except Exception:
            sc = 50.0
        norm_improvements.append(
            {
                "area": area,
                "suggestion": suggestion,
                "score": int(max(0, min(100, round(sc)))),
            }
        )

    # Normalize recommendations
    norm_recs: List[Dict[str, Any]] = []
    for i, rec in enumerate(recommendations):
        sc = rec.get("score", None)
        sc_norm: Optional[int] = None
        if sc is not None:
            try:
                sc_norm = int(max(0, min(100, round(float(sc)))))
            except Exception:
                sc_norm = None

        norm_recs.append(
            {
                "id": rec.get("id") or f"rec_{i+1}",
                "type": rec.get("type") or "other",
                "area": rec.get("area") or "General",
                "priority": rec.get("priority") or "medium",
                "action": rec.get("action") or "",
                "estimated_impact": rec.get("estimated_impact") or "",
                "score": sc_norm,
            }
        )

    improved_resume = improved_resume.strip()
    if not improved_resume:
        improved_resume = "[No improved resume generated]\n\n" + cleaned_resume

    result: Dict[str, Any] = {
        "original_resume": cleaned_resume,
        "scores": scores,
        "strengths": norm_strengths,
        "improvements": norm_improvements,
        "recommendations": norm_recs,
        "improved_resume": improved_resume,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "pipeline_version": "5.1.0-groq-2call",
    }

    # ---------------------------
    # Call 2: Narrative enrichment
    # ---------------------------
    try:
        analysis_json_for_prompt = json.dumps(
            {
                "scores": scores,
                "strengths": norm_strengths,
                "improvements": norm_improvements,
                "recommendations": norm_recs,
            },
            ensure_ascii=False,
        )
        narrative_prompt = NARRATIVE_PROMPT_TEMPLATE.format(
            resume=cleaned_resume,
            analysis_json=analysis_json_for_prompt,
        )

        narrative_text = call_groq_text(
            narrative_prompt,
            max_tokens=2048,
            temperature=0.4,
        )

        # Optional: split into sections using headings
        strengths_text = ""
        improvements_text = ""
        recommendations_text = ""
        current_section = None
        lines = narrative_text.splitlines()
        buf: List[str] = []

        def flush_buffer(section_name: Optional[str]):
            nonlocal strengths_text, improvements_text, recommendations_text, buf
            joined = "\n".join(buf).strip()
            if not section_name or not joined:
                return
            if section_name == "strengths":
                strengths_text = joined
            elif section_name == "improvements":
                improvements_text = joined
            elif section_name == "recommendations":
                recommendations_text = joined
            buf = []

        for line in lines:
            stripped = line.strip()
            lower = stripped.lower()
            if lower.startswith("### top strengths"):
                flush_buffer(current_section)
                current_section = "strengths"
                buf.append(stripped)
            elif lower.startswith("### improvement areas"):
                flush_buffer(current_section)
                current_section = "improvements"
                buf.append(stripped)
            elif lower.startswith("### actionable recommendations"):
                flush_buffer(current_section)
                current_section = "recommendations"
                buf.append(stripped)
            else:
                buf.append(line)

        flush_buffer(current_section)

        result["narrative"] = {
            "raw": narrative_text,
            "strengths": strengths_text or narrative_text,
            "improvements": improvements_text or "",
            "recommendations": recommendations_text or "",
        }

        print("[pipeline] ✓ Narrative enrichment call succeeded", file=sys.stderr)
    except Exception as e:
        print(f"[pipeline] ⚠ Narrative enrichment failed: {e}", file=sys.stderr)
        result["narrative_error"] = str(e)

    print("[pipeline] ✓ Full 2-call pipeline completed", file=sys.stderr)
    return result


# ============================================================
# /rewrite SUPPORT
# ============================================================
def improve_resume(resume_text: str) -> str:
    """
    Improve resume text using Groq (plain text, no JSON).
    Used by FastAPI /rewrite endpoint.
    """
    cleaned = (resume_text or "").strip()
    if len(cleaned) > 50000:
        print(f"[improve_resume] Truncating from {len(cleaned)} to 50000 chars", file=sys.stderr)
        cleaned = cleaned[:50000]

    prompt = f"""
You are an expert MBA resume editor.

Rewrite the following resume into a sharper, MBA-ready resume:
- Keep all facts consistent (no invention).
- Use strong action verbs.
- Use bullet points.
- Add metrics and impact where already present, but do NOT fabricate numbers.
- Make it ATS-friendly and clean.

Return ONLY the improved resume text.

Resume:
--------------------
{cleaned}
--------------------
"""

    print(f"[improve_resume] Calling Groq for {len(cleaned)} characters", file=sys.stderr)
    raw = call_groq_text(prompt, max_tokens=4096, temperature=0.3)
    print(f"[improve_resume] Raw output (first 200 chars): {raw[:200]}...", file=sys.stderr)
    return raw.strip()


# ============================================================
# CLI MAIN (for local testing)
# ============================================================
def main():
    import argparse

    parser = argparse.ArgumentParser(description="MBA Resume Groq 2-Call Pipeline v5.1.0")
    parser.add_argument("resume_text", nargs="?", default="", help="Resume text or file path")
    args = parser.parse_args()

    resume_input = args.resume_text

    if not resume_input:
        print("Usage:", file=sys.stderr)
        print("  python mba_hybrid_pipeline.py \"resume text...\"", file=sys.stderr)
        print("  python mba_hybrid_pipeline.py resume.pdf", file=sys.stderr)
        print("  python mba_hybrid_pipeline.py resume.txt", file=sys.stderr)
        sys.exit(1)

    if os.path.isfile(resume_input):
        try:
            if resume_input.lower().endswith(".pdf"):
                print(f"[main] Reading PDF: {resume_input}", file=sys.stderr)
                resume_text = extract_text_from_pdf(resume_input)
            else:
                print(f"[main] Reading text file: {resume_input}", file=sys.stderr)
                with open(resume_input, "r", encoding="utf-8") as f:
                    resume_text = f.read()
            print(f"[main] ✓ Loaded {len(resume_text)} characters", file=sys.stderr)
        except Exception as e:
            print(f"[main] ✗ Failed to read file: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        resume_text = resume_input
        print(f"[main] Using direct text input ({len(resume_text)} chars)", file=sys.stderr)

    result = run_pipeline(resume_text, include_improvement=False)
    sys.stdout.write(json.dumps(result, ensure_ascii=False))
    sys.stdout.flush()


if __name__ == "__main__":
    main()
