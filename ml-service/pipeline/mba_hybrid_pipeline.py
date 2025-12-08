#!/usr/bin/env python3
"""
mba_hybrid_pipeline.py v5.0.0 (Groq Single-Call)
------------------------------------------------
Single-call pipeline using Groq (OpenAI-compatible API).

ENV REQUIRED:
  GROQ_API_KEY        = your Groq key
  GROQ_MODEL          = llama-3.3-70b-versatile   (or any Groq chat model)

This script:
1) Extracts text (supports PDF via PyPDF2)
2) Calls Groq ONCE with a master prompt
3) Expects a single JSON with:
   - scores (8 keys, 0–10)
   - strengths[]
   - improvements[]
   - recommendations[]
   - improved_resume (string)
4) Returns a clean JSON report
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
    print(
        "[PDF] PyPDF2 not installed. PDF support disabled. Run: pip install PyPDF2",
        file=sys.stderr,
    )


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
# JSON EXTRACTION UTILITY (ROBUST, WITH CONTROL-CHAR FIX)
# ============================================================
def extract_first_json(text: str) -> Any:
    """Extract and parse the first valid JSON object from text with robust cleanup."""
    if not isinstance(text, str):
        text = str(text)

    # Strip markdown fences
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()

    # Drop common prefixes
    prefixes_to_remove = [
        "Here is the JSON:",
        "Here's the JSON:",
        "JSON output:",
        "Result:",
        "Output:",
    ]
    for prefix in prefixes_to_remove:
        if text.lower().startswith(prefix.lower()):
            text = text[len(prefix) :].strip()

    # Find first JSON object by braces
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in text")

    brace_count = 0
    end = -1
    for i in range(start, len(text)):
        if text[i] == "{":
            brace_count += 1
        elif text[i] == "}":
            brace_count -= 1
            if brace_count == 0:
                end = i
                break

    if end == -1:
        end = text.rfind("}")
        if end == -1 or end <= start:
            raise ValueError("No complete JSON object found")

    json_str = text[start : end + 1]

    # --- helper: clean raw control chars INSIDE quoted strings ---
    def _escape_control_chars_inside_strings(s: str) -> str:
        out: List[str] = []
        in_string = False
        escape = False

        for ch in s:
            if escape:
                out.append(ch)
                escape = False
                continue

            if ch == "\\":
                out.append(ch)
                escape = True
                continue

            if ch == '"':
                in_string = not in_string
                out.append(ch)
                continue

            # If we're *inside* a JSON string and see a control char, escape it
            if in_string and ord(ch) < 32:
                if ch == "\n":
                    out.append("\\n")
                elif ch == "\r":
                    out.append("\\r")
                elif ch == "\t":
                    out.append("\\t")
                else:
                    out.append(" ")
            else:
                out.append(ch)

        return "".join(out)

    # First attempt: direct parse
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        # If it's a control-char problem, try cleaning inside strings
        if "Invalid control character" in str(e):
            cleaned = _escape_control_chars_inside_strings(json_str)
            return json.loads(cleaned)

        # Generic fallback: simple fixes
        fixed = json_str.replace("'", '"')
        fixed = re.sub(r",\s*}", "}", fixed)
        fixed = re.sub(r",\s*]", "]", fixed)
        return json.loads(fixed)


# ============================================================
# SCORE NORMALIZATION
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
# MASTER PROMPT (ONE-CALL PIPELINE)
# ============================================================
MASTER_PROMPT = """
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
      "summary": "string",
      "score": 0-100
    }
  ],
  "improvements": [
    {
      "area": "string",
      "suggestion": "string",
      "score": 0-100
    }
  ],
  "recommendations": [
    {
      "id": "string",
      "type": "skill | test | extracurricular | career | resume | networking | other",
      "area": "string",
      "priority": "high | medium | low",
      "action": "string",
      "estimated_impact": "string",
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
1. Be SPECIFIC to this person:
   - Use company names, role titles, industries, metrics and numbers from the resume.
   - Avoid generic advice like "improve leadership" without context.
2. "strengths": 3–6 items, each with a strong title + one specific sentence.
3. "improvements": 3–6 items with clear, actionable suggestions.
4. "recommendations": 3–8 items, prioritized, with clear actions and impact.
5. "improved_resume":
   - Re-write the resume for MBA applications.
   - Keep all facts consistent (do NOT invent achievements or dates).
   - Use bullet points with strong impact verbs and metrics where available.
   - Keep a clean, ATS-friendly text format.
   - Escape newlines as \\n inside the JSON string (no raw newlines inside the JSON).

VERY IMPORTANT:
- If the resume already mentions a strong GMAT (>=700) or GRE (>=325) or MBA/PGP from IIM/ISB/top school,
  do NOT suggest "take GMAT/GRE" as a recommendation.
- Output MUST be valid JSON with EXACTLY these top-level keys:
  "scores", "strengths", "improvements", "recommendations", "improved_resume".
- DO NOT wrap the JSON in markdown.
- DO NOT add commentary before or after the JSON.
- DO NOT include ```json fences.

Resume:
--------------------
{resume}
--------------------
Return ONLY the JSON object.
"""


# ============================================================
# GROQ CALL (ONE LLM CALL)
# ============================================================
class GroqError(Exception):
    pass


def call_groq_single(
    prompt: str, max_tokens: int = 4096, temperature: float = 0.2, timeout: int = 60
) -> str:
    """Call Groq (OpenAI-compatible chat API) once."""
    if not GROQ_API_KEY:
        raise GroqError("Missing GROQ_API_KEY")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

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

    try:
        print(
            f"[groq] Calling model={GROQ_MODEL}, max_tokens={max_tokens}",
            file=sys.stderr,
        )
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
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as e:
            raise GroqError(f"Unexpected response: {data}") from e

        content = (content or "").strip()
        if not content:
            raise GroqError("Empty response from Groq")

        print(
            f"[groq] ✓ Response length={len(content)} chars",
            file=sys.stderr,
        )
        return content

    except requests.exceptions.Timeout:
        raise GroqError(f"Request timed out after {timeout}s")
    except requests.exceptions.RequestException as e:
        raise GroqError(f"Request failed: {e}")


# ============================================================
# SINGLE-CALL PIPELINE (GROQ)
# ============================================================
def run_pipeline_single_call(resume_text: str) -> Dict[str, Any]:
    """
    Execute the full MBA analysis with ONE Groq call.

    Returns a dict with:
      scores, strengths, improvements, recommendations, improved_resume,
      original_resume, generated_at, pipeline_version
    """
    print("\n" + "=" * 60, file=sys.stderr)
    print(
        "MBA RESUME ANALYSIS PIPELINE v5.0.0 (Groq single-call)",
        file=sys.stderr,
    )
    print(f"[LLM] Using Groq model: {GROQ_MODEL}", file=sys.stderr)
    print("=" * 60 + "\n", file=sys.stderr)

    print("=" * 60, file=sys.stderr)
    print("MBA RESUME ANALYSIS PIPELINE v5.0 (Groq Single-Call)", file=sys.stderr)
    print("=" * 60, file=sys.stderr)

    prompt = MASTER_PROMPT.replace("{resume}", resume_text)

    try:
        raw = call_groq_single(prompt)
        print(
            f"[pipeline] Raw model output (first 300 chars): {raw[:300]}...",
            file=sys.stderr,
        )

        parsed = extract_first_json(raw)

        # Ensure keys exist
        scores = parsed.get("scores", {}) or {}
        strengths = parsed.get("strengths", []) or []
        improvements = parsed.get("improvements", []) or []
        recommendations = parsed.get("recommendations", []) or []
        improved_resume = parsed.get("improved_resume", "") or ""

        # Normalize scores
        scores = normalize_scores_to_0_10(scores)
        if not validate_scores(scores):
            print(
                "[pipeline] ⚠ Invalid score structure; falling back to 5.0s",
                file=sys.stderr,
            )
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

        # Improved resume fallback
        improved_resume = improved_resume.strip()
        if not improved_resume:
            improved_resume = "[No improved resume generated]\n\n" + resume_text

        result: Dict[str, Any] = {
            "original_resume": resume_text,
            "scores": scores,
            "strengths": norm_strengths,
            "improvements": norm_improvements,
            "recommendations": norm_recs,
            "improved_resume": improved_resume,
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "pipeline_version": "5.0.0-groq-single",
        }

        print("[pipeline] ✓ Single-call pipeline completed", file=sys.stderr)
        return result

    except Exception as e:
        print(f"[pipeline] ✗ Pipeline failed: {e}", file=sys.stderr)
        # Hard fallback: empty result + default scores
        return {
            "original_resume": resume_text,
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
            "improved_resume": "[Pipeline failed – returning original resume]\n\n"
            + resume_text,
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "pipeline_version": "5.0.0-groq-single-error-fallback",
            "error": str(e),
        }


# ============================================================
# BACKWARDS-COMPATIBLE ENTRY POINT (for FastAPI import)
# ============================================================
def run_pipeline(resume_text: str, include_improvement: bool = False) -> Dict[str, Any]:
    """
    Backwards-compatible wrapper so FastAPI code that calls `run_pipeline(...)`
    still works. We ignore include_improvement and just return the single-call result.
    """
    return run_pipeline_single_call(resume_text)


# ============================================================
# RESUME IMPROVEMENT (USED BY /rewrite ENDPOINT)
# ============================================================
def improve_resume(resume_text: str) -> str:
    """
    Use Groq to rewrite/improve the resume only (no JSON).
    Returns plain text (no markdown fences).
    """
    prompt = f"""
You are an expert MBA resume editor.

Rewrite the following resume to make it suitable for top global MBA programs
(US, Europe, India). Rules:

- Keep all facts truthful: DO NOT invent companies, titles, or achievements.
- Use strong action verbs and quantify impact where numbers exist.
- Keep an ATS-friendly structure (no tables, no fancy formatting).
- Use clean bullet points and section headings.
- Tailor tone for MBA / business schools.

Return ONLY the improved resume text.
Do NOT add commentary.
Do NOT wrap in ```markdown``` fences.

Resume:
--------------------
{resume_text}
--------------------
"""

    raw = call_groq_single(prompt, max_tokens=4096, temperature=0.3)

    # Strip possible fences anyway, just in case
    cleaned = re.sub(r"```[a-zA-Z]*\s*", "", raw).strip()
    return cleaned


# ============================================================
# CLI MAIN (for testing on Render / local)
# ============================================================
def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="MBA Resume Groq Single-Call Pipeline v5.0.0"
    )
    parser.add_argument("resume_text", nargs="?", default="", help="Resume text or file path")
    args = parser.parse_args()

    resume_input = args.resume_text

    if not resume_input:
        print("Usage:", file=sys.stderr)
        print('  python mba_hybrid_pipeline.py "resume text..."', file=sys.stderr)
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
            print(
                f"[main] ✓ Loaded {len(resume_text)} characters",
                file=sys.stderr,
            )
        except Exception as e:
            print(f"[main] ✗ Failed to read file: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        resume_text = resume_input
        print(
            f"[main] Using direct text input ({len(resume_text)} chars)",
            file=sys.stderr,
        )

    result = run_pipeline_single_call(resume_text)
    sys.stdout.write(json.dumps(result, ensure_ascii=False))
    sys.stdout.flush()


if __name__ == "__main__":
    main()
