#!/usr/bin/env python3
"""
resume_writer_pipeline.py v1.0.0 (Groq Resume Writer)
-----------------------------------------------------

This pipeline takes structured Q&A answers about a candidate
and generates a clean, ATS-friendly resume using Groq.

ENV REQUIRED:
  GROQ_API_KEY        = your Groq key
  GROQ_MODEL          = llama-3.3-70b-versatile  (or any Groq chat model)

MAIN ENTRY:
  generate_resume(answers: dict) -> dict

Expected return:
{
  "resume_text": "Plain text resume ready for PDF/Word",
  "sections": {
    "header": "...",
    "summary": "...",
    "experience": [...],
    "education": [...],
    "projects": [...],
    "leadership": [...],
    "skills": {...}
  },
  "meta": {
    "pipeline_version": "1.0.0-resume-writer",
    "model": "llama-3.3-70b-versatile",
    "generated_at": "2025-01-01T00:00:00Z"
  }
}
"""

import os
import sys
import time
import json
import re
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv

load_dotenv()


# ============================================================
# ENV & CONFIG (Groq)
# ============================================================

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

print("[resume-writer] Groq configuration:", file=sys.stderr)
print(f"  GROQ_MODEL: {GROQ_MODEL}", file=sys.stderr)


# ============================================================
# JSON EXTRACTION / CLEANUP
# ============================================================

def extract_first_json(text: str) -> Any:
    """
    Extract and parse the first valid JSON object from text with robust cleanup.

    Handles:
    - Leading commentary
    - ```json fences
    - Minor trailing commas
    """
    if not isinstance(text, str):
        text = str(text)

    # Remove markdown fences
    text = re.sub(r"```json\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()

    # Common prefixes Groq / LLMs like to add
    prefixes = [
        "Here is the JSON:",
        "Here's the JSON:",
        "JSON output:",
        "Result:",
        "Output:",
    ]
    for p in prefixes:
        if text.lower().startswith(p.lower()):
            text = text[len(p):].strip()

    # Find first JSON object
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in text")

    brace_count = 0
    end = -1
    for i in range(start, len(text)):
        ch = text[i]
        if ch == "{":
            brace_count += 1
        elif ch == "}":
            brace_count -= 1
            if brace_count == 0:
                end = i
                break

    if end == -1:
        # fallback: last closing brace
        end = text.rfind("}")
        if end == -1 or end <= start:
            raise ValueError("No complete JSON object found")

    json_str = text[start:end + 1]

    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        # Light cleanup: single quotes -> double, trailing commas
        json_str = json_str.replace("'", '"')
        json_str = re.sub(r",\s*}", "}", json_str)
        json_str = re.sub(r",\s*]", "]", json_str)
        return json.loads(json_str)


# ============================================================
# Groq Call
# ============================================================

class GroqError(Exception):
    pass


def call_groq(prompt: str, max_tokens: int = 2048, temperature: float = 0.3, timeout: int = 60) -> str:
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
        print(f"[resume-writer][groq] Calling model={GROQ_MODEL}, max_tokens={max_tokens}", file=sys.stderr)
        r = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=timeout)
        status = r.status_code

        if status != 200:
            text = r.text[:800]
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
            raise GroqError(f"Unexpected Groq response: {data}") from e

        content = (content or "").strip()
        if not content:
            raise GroqError("Empty response from Groq")

        print(f"[resume-writer][groq] ✓ Response length={len(content)} chars", file=sys.stderr)
        return content

    except requests.exceptions.Timeout:
        raise GroqError(f"Groq request timed out after {timeout}s")
    except requests.exceptions.RequestException as e:
        raise GroqError(f"Groq request failed: {e}")


# ============================================================
# MASTER PROMPT
# ============================================================

MASTER_PROMPT = """
You are an expert MBA / professional resume writer.

You will receive a JSON object with structured answers from a user.
Based on that, you must generate a clean, ATS-friendly resume in plain text.

INPUT JSON FORMAT (example):
{
  "basic_info": {
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "headline": "string",
    "target_roles": "string",
    "target_industries": "string",
    "short_term_goal": "string",
    "long_term_goal": "string"
  },
  "work_experience": [
    {
      "company_name": "string",
      "location": "string",
      "job_title": "string",
      "start_date": "string",
      "end_date": "string",
      "is_current": true,
      "scope_summary": "string",
      "key_achievements": "string (can contain multiple bullet-like items)",
      "team_leadership": "string",
      "tools_used": "string",
      "biggest_impact": "string"
    }
  ],
  "education": [
    {
      "school_name": "string",
      "degree": "string",
      "field_of_study": "string",
      "start_year": "string",
      "end_year": "string",
      "grade_gpa": "string",
      "academic_highlights": "string",
      "test_scores": "string"
    }
  ],
  "projects": [
    {
      "project_name": "string",
      "role": "string",
      "duration": "string",
      "tech_tools": "string",
      "problem_statement": "string",
      "what_you_did": "string",
      "impact": "string"
    }
  ],
  "leadership": [
    {
      "position_title": "string",
      "organization": "string",
      "duration": "string",
      "responsibilities": "string",
      "impact": "string"
    }
  ],
  "skills": {
    "technical_skills": "string",
    "business_skills": "string",
    "soft_skills": "string",
    "languages": "string",
    "certifications": "string"
  },
  "preferences": {
    "resume_style": "concise | detailed | mid",
    "tone": "formal | energetic | neutral",
    "max_pages": 1 or 2,
    "country": "string",
    "notes_for_writer": "string"
  }
}

YOUR TASK:
1. Read the JSON carefully and reconstruct the BEST possible resume.
2. Use strong bullet points with action verbs and, wherever possible, numbers or specific impact.
3. Do NOT invent fake achievements, roles, or schools. You may:
   - Rephrase
   - Make wording sharper
   - Combine overlapping items
4. Respect preferences:
   - If max_pages = 1 → keep it tighter, more concise.
   - If max_pages = 2 → allow slightly more detail, but still avoid fluff.
   - Tone should follow the requested style (formal / energetic / neutral).
5. Sections (suggested order):
   - Name + contact header
   - Professional Summary (2–4 lines)
   - Key Skills (optional concise list)
   - Professional Experience
   - Education
   - Projects (if any)
   - Leadership & Extracurriculars (if any)
   - Certifications / Additional info (if provided)

OUTPUT FORMAT:
Return ONE JSON object with exactly these top-level keys:

{
  "resume_text": "string, full resume in plain text, ready for PDF",
  "sections": {
    "header": "string",
    "summary": "string",
    "experience": [
      {
        "company_name": "string",
        "job_title": "string",
        "location": "string",
        "period": "string",
        "bullets": ["...","..."]
      }
    ],
    "education": [
      {
        "school_name": "string",
        "degree": "string",
        "period": "string",
        "details": "string"
      }
    ],
    "projects": [
      {
        "project_name": "string",
        "period": "string",
        "bullets": ["...","..."]
      }
    ],
    "leadership": [
      {
        "position_title": "string",
        "organization": "string",
        "period": "string",
        "bullets": ["...","..."]
      }
    ],
    "skills": {
      "headline_skills": "string",
      "detailed_skills": "string"
    }
  },
  "meta": {
    "style_used": "string",
    "notes": "string"
  }
}

RULES:
- "resume_text" should be a SINGLE, clean text resume that includes all sections in a logical order.
- Avoid markdown formatting like ### or ** in resume_text. Use simple text formatting:
  - NAME (all caps or title case)
  - Section titles in caps
  - Bullet points starting with "•" or "-"
- Do NOT wrap the JSON in markdown fences.
- DO NOT add any explanation or commentary outside the JSON.

Now, here is the user data as JSON:

----------------- USER ANSWERS JSON -----------------
{answers_json}
----------------- END USER ANSWERS JSON -------------
"""


# ============================================================
# MAIN PIPELINE FUNCTION
# ============================================================

def generate_resume(answers: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a resume from structured answers using Groq.

    :param answers: dict with keys like basic_info, work_experience, etc.
    :return: dict with resume_text, sections, meta
    """
    print("\n" + "=" * 60, file=sys.stderr)
    print("RESUME WRITER PIPELINE v1.0.0 (Groq)", file=sys.stderr)
    print("=" * 60, file=sys.stderr)

    # Serialize answers to pretty JSON for the prompt
    try:
        answers_json = json.dumps(answers, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[resume-writer] ✗ Failed to serialize answers: {e}", file=sys.stderr)
        raise

    # Build prompt
    prompt = MASTER_PROMPT.replace("{answers_json}", answers_json)

    # Call Groq
    try:
        raw = call_groq(prompt, max_tokens=3072, temperature=0.35, timeout=90)
        print("[resume-writer] Raw model output (first 400 chars):", file=sys.stderr)
        print(raw[:400] + ("..." if len(raw) > 400 else ""), file=sys.stderr)

        parsed = extract_first_json(raw)

        resume_text = parsed.get("resume_text", "") or ""
        sections = parsed.get("sections", {}) or {}
        meta = parsed.get("meta", {}) or {}

        # Basic fallback if resume_text is empty
        if not resume_text.strip():
            print("[resume-writer] ⚠ Empty resume_text from model, falling back to simple rendering", file=sys.stderr)
            resume_text = "[Resume generation failed – please try again]\n"

        # Ensure meta is populated
        meta["pipeline_version"] = "1.0.0-resume-writer"
        meta["model"] = GROQ_MODEL
        meta["generated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        result = {
            "resume_text": resume_text,
            "sections": sections,
            "meta": meta,
        }

        print("[resume-writer] ✓ Resume generation completed", file=sys.stderr)
        return result

    except Exception as e:
        print(f"[resume-writer] ✗ Pipeline failed: {e}", file=sys.stderr)
        # Hard fallback
        fallback_text = (
            "[Resume Writer Pipeline Error]\n\n"
            "We were unable to generate a formatted resume at this time.\n"
            "Please try again in a few minutes."
        )
        return {
            "resume_text": fallback_text,
            "sections": {},
            "meta": {
                "pipeline_version": "1.0.0-resume-writer-error-fallback",
                "model": GROQ_MODEL,
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "error": str(e),
            },
        }


# ============================================================
# CLI FOR LOCAL TESTING
# ============================================================

def main():
    """
    CLI usage examples:

    1) Using a JSON file with answers:
       python resume_writer_pipeline.py answers.json

    2) Using inline JSON (small):
       python resume_writer_pipeline.py '{"basic_info": {"full_name": "John Doe", "email": "john@doe.com"}}'
    """
    import argparse

    parser = argparse.ArgumentParser(description="Resume Writer Pipeline v1.0.0 (Groq)")
    parser.add_argument("input", help="Path to JSON file with answers OR inline JSON string")
    args = parser.parse_args()

    input_arg = args.input

    # If it's a file, load it; otherwise treat as inline JSON
    if os.path.isfile(input_arg):
        print(f"[resume-writer][cli] Loading answers from file: {input_arg}", file=sys.stderr)
        with open(input_arg, "r", encoding="utf-8") as f:
            answers = json.load(f)
    else:
        print("[resume-writer][cli] Parsing inline JSON answers", file=sys.stderr)
        answers = json.loads(input_arg)

    result = generate_resume(answers)
    sys.stdout.write(json.dumps(result, ensure_ascii=False, indent=2))
    sys.stdout.flush()


if __name__ == "__main__":
    main()
