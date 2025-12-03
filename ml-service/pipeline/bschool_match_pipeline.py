#!/usr/bin/env python3
"""
bschool_match_pipeline.py

LLM-powered B-School Match engine.
- Consumes a structured candidate profile (answers + optional resume / analysis)
- Calls Gemini via gemini_client.py
- Returns a clean JSON with tiered school recommendations.
"""

import json
import sys
import time
from typing import Any, Dict, List

from gemini_client import call_gemini  # assumes ml-service root on sys.path
from pipeline.mba_hybrid_pipeline import extract_first_json  # reuse robust JSON extractor


# -------------------------------------------------------------------
# Prompt Template
# -------------------------------------------------------------------
MATCH_PROMPT_TEMPLATE = """
You are an expert MBA admissions consultant and B-school match engine.

You are given a JSON object describing the candidate's profile, preferences,
and (optionally) resume / resume analysis:

CANDIDATE_PROFILE_JSON:
{candidate_profile_json}

Your job is to recommend MBA / MiM / PGP programs that are a GOOD FIT.

You MUST return ONLY a valid JSON object with this exact structure:

{
  "summary": {
    "profile_snapshot": "One-paragraph summary of the candidate",
    "target_strategy": "1–2 sentences explaining the overall application strategy",
    "key_factors": [
      "Short bullet-style points about what matters most for their school list"
    ]
  },
  "matches": [
    {
      "school_name": "IIM Ahmedabad",
      "program_name": "PGP (Flagship MBA equivalent)",
      "country": "India",
      "region": "Asia",
      "tier": "ambitious",
      "duration_years": 2,
      "program_type": "MBA/PGP",
      "notes": "1–3 sentences on why this is a good (or stretch) fit based on THEIR profile",
      "risks": "Key risks or reasons it might be hard / not ideal",
      "fit_scores": {
        "academic_fit": 0-10,
        "career_outcomes_fit": 0-10,
        "geography_fit": 0-10,
        "brand_prestige": 0-10,
        "roi_affordability": 0-10,
        "culture_personal_fit": 0-10
      }
    }
  ],
  "tiers": {
    "ambitious": ["School 1", "School 2"],
    "target": ["School 3", "School 4"],
    "safe": ["School 5", "School 6"]
  }
}

STRICT RULES (IMPORTANT):
1. Always include at least 2–3 schools per tier where possible (ambitious / target / safe).
2. Tiers must be exactly one of: "ambitious", "target", "safe".
3. All fit_scores must be numbers between 0 and 10 (can be floats).
4. Tailor EVERY recommendation to THIS candidate's profile (career goals, scores, geography, budget, etc.).
5. Prefer Indian and global schools that match their goals. If they clearly prefer India-only, focus mostly on Indian schools.
6. NEVER invent fake schools or programs – only realistic, well-known or regionally-relevant schools.
7. OUTPUT ONLY JSON. No markdown, no extra commentary, no backticks.

Now, based on the candidate profile, generate the JSON response.
"""


# -------------------------------------------------------------------
# Helper: Build Prompt
# -------------------------------------------------------------------
def build_match_prompt(candidate_profile: Dict[str, Any]) -> str:
    """
    Convert candidate profile dict into a prompt-ready JSON string
    and embed into MATCH_PROMPT_TEMPLATE.
    """
    # Keep as readable JSON for the model
    candidate_profile_json = json.dumps(candidate_profile, ensure_ascii=False, indent=2)
    prompt = MATCH_PROMPT_TEMPLATE.format(candidate_profile_json=candidate_profile_json)
    return prompt


# -------------------------------------------------------------------
# Helper: Normalize Output
# -------------------------------------------------------------------
def _normalize_fit_scores(raw_scores: Dict[str, Any]) -> Dict[str, float]:
    """
    Ensure all fit_scores are numeric and in 0–10.
    """
    if not isinstance(raw_scores, dict):
        return {
            "academic_fit": 5.0,
            "career_outcomes_fit": 5.0,
            "geography_fit": 5.0,
            "brand_prestige": 5.0,
            "roi_affordability": 5.0,
            "culture_personal_fit": 5.0,
        }

    out: Dict[str, float] = {}
    keys = [
        "academic_fit",
        "career_outcomes_fit",
        "geography_fit",
        "brand_prestige",
        "roi_affordability",
        "culture_personal_fit",
    ]
    for k in keys:
        v = raw_scores.get(k, 5.0)
        try:
            num = float(v)
        except Exception:
            num = 5.0
        if num < 0:
            num = 0.0
        if num > 10:
            num = 10.0
        out[k] = round(num, 2)
    return out


def _normalize_matches(matches: Any) -> List[Dict[str, Any]]:
    """
    Ensure 'matches' is a list of objects with expected keys and normalized fit_scores.
    """
    if not isinstance(matches, list):
        return []

    normalized: List[Dict[str, Any]] = []
    for m in matches:
        if not isinstance(m, dict):
            continue

        tier = m.get("tier", "target") or "target"
        if tier not in ("ambitious", "target", "safe"):
            tier = "target"

        fit_scores = _normalize_fit_scores(m.get("fit_scores", {}))

        normalized.append(
            {
                "school_name": m.get("school_name", "").strip() or "Unknown School",
                "program_name": m.get("program_name", "").strip() or "MBA / PGP",
                "country": m.get("country", "").strip() or "Unknown",
                "region": m.get("region", "").strip() or "Unknown",
                "tier": tier,
                "duration_years": m.get("duration_years", 2),
                "program_type": m.get("program_type", "MBA/PGP"),
                "notes": m.get("notes", "").strip(),
                "risks": m.get("risks", "").strip(),
                "fit_scores": fit_scores,
            }
        )
    return normalized


def _build_tiers_from_matches(matches: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """
    Build a tiers dict from the matches list.
    """
    tiers = {"ambitious": [], "target": [], "safe": []}
    for m in matches:
        tier = m.get("tier", "target")
        name = m.get("school_name", "Unknown School")
        if tier not in tiers:
            tier = "target"
        tiers[tier].append(name)
    return tiers


# -------------------------------------------------------------------
# Main Pipeline Function
# -------------------------------------------------------------------
def run_bschool_match(candidate_profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point:
    - candidate_profile: dict built by your Next.js backend (answers + optional resume info).
    - Returns a structured JSON with summary + matches + tiers.
    """
    print("\n" + "=" * 60, file=sys.stderr)
    print("B-SCHOOL MATCH PIPELINE v1.0", file=sys.stderr)
    print("LLM: Gemini (via gemini_client)", file=sys.stderr)
    print("=" * 60 + "\n", file=sys.stderr)

    start_time = time.time()

    # Basic logging
    try:
        size_hint = len(json.dumps(candidate_profile))
    except Exception:
        size_hint = -1
    print(f"[bschool-match] Candidate profile size ~ {size_hint} chars", file=sys.stderr)

    # 1. Build prompt
    prompt = build_match_prompt(candidate_profile)

    # 2. Call Gemini
    try:
        print("[bschool-match] Calling Gemini for matches...", file=sys.stderr)
        raw_output = call_gemini(
            prompt,
            temperature=0.2,
            max_output_tokens=2048,
            retry_count=3,
            timeout=120,
        )
        print(f"[bschool-match] Raw model output length = {len(raw_output)} chars", file=sys.stderr)
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"[bschool-match] ✗ Gemini call failed after {elapsed:.2f}s: {e}", file=sys.stderr)
        # Hard fallback JSON
        return {
            "summary": {
                "profile_snapshot": "Unable to generate school matches due to an internal error.",
                "target_strategy": "Please try again in a few minutes.",
                "key_factors": [],
            },
            "matches": [],
            "tiers": {
                "ambitious": [],
                "target": [],
                "safe": [],
            },
            "meta": {
                "error": str(e),
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "pipeline_version": "1.0.0",
                "llm_status": "failed",
            },
        }

    # 3. Extract JSON
    try:
        parsed = extract_first_json(raw_output)
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"[bschool-match] ✗ JSON extraction failed after {elapsed:.2f}s: {e}", file=sys.stderr)
        return {
            "summary": {
                "profile_snapshot": "Model response could not be parsed as JSON.",
                "target_strategy": "Please try again or contact support if the issue persists.",
                "key_factors": [],
            },
            "matches": [],
            "tiers": {
                "ambitious": [],
                "target": [],
                "safe": [],
            },
            "meta": {
                "error": f"JSON parse error: {e}",
                "raw_output_head": raw_output[:500],
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "pipeline_version": "1.0.0",
                "llm_status": "ok_but_parse_failed",
            },
        }

    # 4. Normalize structure
    summary = parsed.get("summary") or {}
    matches_raw = parsed.get("matches") or []
    tiers_raw = parsed.get("tiers") or {}

    matches = _normalize_matches(matches_raw)

    # If LLM didn't provide tiers, build from matches
    if not isinstance(tiers_raw, dict) or not tiers_raw:
        tiers = _build_tiers_from_matches(matches)
    else:
        # Normalize tiers to just school names
        tiers = {
            "ambitious": list(tiers_raw.get("ambitious", [])),
            "target": list(tiers_raw.get("target", [])),
            "safe": list(tiers_raw.get("safe", [])),
        }

    # Ensure summary fields
    summary_out = {
        "profile_snapshot": summary.get("profile_snapshot", "").strip()
        or "Candidate profile summary not provided by the model.",
        "target_strategy": summary.get("target_strategy", "").strip()
        or "Target a balanced mix of ambitious, target, and safe schools aligned to your goals.",
        "key_factors": summary.get("key_factors", []) or [],
    }

    elapsed = time.time() - start_time
    print(f"[bschool-match] ✓ Pipeline complete in {elapsed:.2f}s", file=sys.stderr)

    # 5. Final response
    return {
        "summary": summary_out,
        "matches": matches,
        "tiers": tiers,
        "meta": {
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "pipeline_version": "1.0.0",
            "llm_status": "ok",
            "latency_seconds": round(elapsed, 2),
        },
    }


# -------------------------------------------------------------------
# CLI helper for quick manual testing
# -------------------------------------------------------------------
if __name__ == "__main__":
    """
    Quick manual test:
    python bschool_match_pipeline.py '{"answers": {...}}'
    """
    if len(sys.argv) < 2:
        print("Usage: python bschool_match_pipeline.py '<candidate_profile_json>'", file=sys.stderr)
        sys.exit(1)

    try:
        candidate_profile = json.loads(sys.argv[1])
    except Exception as e:
        print(f"Invalid JSON: {e}", file=sys.stderr)
        sys.exit(1)

    result = run_bschool_match(candidate_profile)
    print(json.dumps(result, ensure_ascii=False, indent=2))
