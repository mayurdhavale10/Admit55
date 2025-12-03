#!/usr/bin/env python3
"""
bschool_match_pipeline.py

LLM-powered B-School Match engine.
- Consumes a structured candidate profile (answers + optional resume / analysis)
- Calls Gemini via gemini_client.py
- Returns a clean JSON with tiered school recommendations.
"""

import json
import os
import sys
import time
from typing import Any, Dict, List

from gemini_client import call_gemini  # assumes ml-service root on sys.path
from pipeline.mba_hybrid_pipeline import extract_first_json  # reuse robust JSON extractor

# Read B-school specific model from env
BSCHOOL_MODEL = os.getenv("GEMINI_BSCHOOL", "gemini-2.5-flash")


# -------------------------------------------------------------------
# Prompt Template - Using string concatenation
# -------------------------------------------------------------------
def build_match_prompt(candidate_profile: Dict[str, Any]) -> str:
  """
  Build the full prompt by injecting candidate_profile JSON.
  Uses string concatenation to avoid any format string issues.
  The candidate_profile object is the full payload from the frontend:
  {
    "mode": "...",
    "profile": { ...canonical candidate profile... },
    "raw_answers": { ...optional... },
    "profile_resume_report": { ...optional... }
  }
  """
  candidate_profile_json = json.dumps(
      candidate_profile,
      ensure_ascii=False,
      indent=2,
  )

  # Build prompt using string concatenation to avoid ANY formatting issues
  prompt = (
      "You are an expert MBA admissions consultant and B-school match engine.\n\n"
      "You are given a JSON object describing the candidate's profile, preferences,\n"
      "and (optionally) resume / resume analysis.\n\n"
      "The top-level JSON looks roughly like this:\n"
      '{\n'
      '  "mode": "questions-only | resume-upload | resume-from-profile",\n'
      '  "profile": {\n'
      "    // Canonical candidate profile built from the app\n"
      "    \"name\": string | null,\n"
      "    \"email\": string | null,\n"
      "    \"mode\": string,\n"
      "    \"current_role\": string | null,\n"
      "    \"current_company\": string | null,\n"
      "    \"total_work_experience_years\": number | null,\n"
      "    \"managerial_experience_years\": number | null,\n"
      "    \"has_international_experience\": boolean | null,\n"
      "    \"undergrad_degree\": string | null,\n"
      "    \"undergrad_institution\": string | null,\n"
      "    \"undergrad_grad_year\": number | null,\n"
      "    \"scores\": {\n"
      "      \"gmat\": number | null,\n"
      "      \"gre\": number | null,\n"
      "      \"cat\": number | null,\n"
      "      \"x_percentage\": number | null,\n"
      "      \"xii_percentage\": number | null,\n"
      "      \"ug_cgpa\": number | null,\n"
      "      \"other_tests\": string | null\n"
      "    },\n"
      "    \"target_intake_year\": number | null,\n"
      "    \"preferred_regions\": string[],            // e.g. [\"india\", \"europe\", \"us\"]\n"
      "    \"preferred_program_types\": string[],      // e.g. [\"1-year\", \"2-year\"]\n"
      "    \"constraints\": {\n"
      "      \"budget_level\": \"low\" | \"medium\" | \"high\" | null,\n"
      "      \"prefers_one_year\": boolean | null,\n"
      "      \"open_to_abroad\": boolean | null,\n"
      "      \"max_tuition_in_lakhs\": number | null,  // total tuition budget in INR lakhs if provided\n"
      "      \"scholarship_need\": \"none\" | \"helpful\" | \"strong-need\" | null,\n"
      "      \"risk_tolerance\": \"safe\" | \"balanced\" | \"aggressive\" | null\n"
      "    },\n"
      "    \"goals\": {\n"
      "      \"short_term\": string | null,           // post-MBA immediate goal\n"
      "      \"long_term\": string | null,            // 5-10 year vision\n"
      "      \"target_functions\": string[] | null,   // e.g. [\"consulting\", \"product management\"]\n"
      "      \"target_industries\": string[] | null   // e.g. [\"tech\", \"finance\"]\n"
      "    },\n"
      "    \"resume_text\": string | null,\n"
      "    \"resume_summary\": string | null,\n"
      "    \"resume_analysis\": object | null,\n"
      "    \"extra_context\": string | null           // e.g. \"why MBA now\" / special constraints\n"
      "  },\n"
      "  \"raw_answers\": { ...original question answers... } | null,\n"
      "  \"profile_resume_report\": object | null\n"
      "}\n\n"
      "CANDIDATE_PROFILE_JSON:\n"
      + candidate_profile_json
      + """

Your job is to recommend MBA / MiM / PGP programs that are a GOOD FIT for this specific candidate.

You MUST actively read and use the fields inside `profile`, especially:

- Work experience & leadership:
  - profile.total_work_experience_years
  - profile.managerial_experience_years
  - profile.has_international_experience

- Academics & test scores:
  - profile.scores.gmat / gre / cat / ug_cgpa / x_percentage / xii_percentage / other_tests
  - profile.undergrad_degree, profile.undergrad_institution, profile.undergrad_grad_year

- Goals & post-MBA plan:
  - profile.goals.short_term (post-MBA goal)
  - profile.goals.long_term
  - profile.goals.target_functions
  - profile.goals.target_industries

- Geography & program preferences:
  - profile.preferred_regions (e.g. ["india"], ["us", "europe"], etc.)
  - profile.preferred_program_types (e.g. ["1-year", "2-year", "online"])
  - profile.target_intake_year
  - profile.constraints.open_to_abroad (true/false)

- Budget & risk:
  - profile.constraints.budget_level ("low" | "medium" | "high")
  - profile.constraints.max_tuition_in_lakhs (numeric cap in INR lakhs if present)
  - profile.constraints.scholarship_need ("none" | "helpful" | "strong-need")
  - profile.constraints.risk_tolerance ("safe" | "balanced" | "aggressive")

- Motivation & narrative:
  - profile.extra_context (often includes "why MBA now", special constraints, and story)
  - profile.resume_text / profile.resume_summary / profile.resume_analysis
    (these capture their experience, impact, and achievements)

You MUST interpret all of these when deciding:
- Which schools to recommend
- Which tier each school belongs to ("ambitious", "target", "safe")
- How strong the fit is on each dimension (fit_scores)
- Whether to favor India-only, global, or mixed school lists
- How aggressive to be in the school list, based on risk_tolerance and scores

CRITICAL FIT LOGIC (use this reasoning, do NOT ignore it):
1. If scores (GMAT/GRE/CAT/UG CGPA) are very strong AND risk_tolerance is "aggressive",
   you can include more top global / top IIM schools in "ambitious" tier.
2. If budget_level is "low" or max_tuition_in_lakhs is small, prioritize high ROI and
   affordable programs (e.g., FMS Delhi, JBIMS, good Indian public institutions).
3. If constraints.open_to_abroad is false or preferred_regions includes only "india",
   keep most recommendations in India (only add global schools if clearly acceptable).
4. If target_intake_year is near (e.g., this or next year), avoid programs that clearly
   do not match realistic timelines for the given profile.
5. Use goals.short_term, goals.long_term, target_functions, target_industries, and
   resume experience to align each school with relevant career paths (consulting,
   product, finance, tech, HR, entrepreneurship, etc.).

You MUST return ONLY a valid JSON object with this exact structure:

{
  "summary": {
    "profile_snapshot": "One-paragraph summary of the candidate",
    "target_strategy": "1–2 sentences explaining the overall application strategy",
    "key_factors": ["Factor 1", "Factor 2", "Factor 3"]
  },
  "matches": [
    {
      "school_name": "IIM Ahmedabad",
      "program_name": "PGP",
      "country": "India",
      "region": "Asia",
      "tier": "ambitious",
      "duration_years": 2,
      "program_type": "MBA/PGP",
      "notes": "Strong fit because of your consulting goals and quantitative background",
      "risks": "Highly competitive admission with low acceptance rate",
      "fit_scores": {
        "academic_fit": 8.5,
        "career_outcomes_fit": 9.0,
        "geography_fit": 10.0,
        "brand_prestige": 9.5,
        "roi_affordability": 7.0,
        "culture_personal_fit": 8.0
      }
    },
    {
      "school_name": "XLRI Jamshedpur",
      "program_name": "PGDM",
      "country": "India",
      "region": "Asia",
      "tier": "target",
      "duration_years": 2,
      "program_type": "MBA/PGP",
      "notes": "Excellent for HR and consulting careers, strong alumni network",
      "risks": "Located in smaller city, less international exposure",
      "fit_scores": {
        "academic_fit": 8.0,
        "career_outcomes_fit": 8.5,
        "geography_fit": 9.0,
        "brand_prestige": 8.5,
        "roi_affordability": 8.5,
        "culture_personal_fit": 8.5
      }
    }
  ],
  "tiers": {
    "ambitious": ["IIM Ahmedabad", "IIM Bangalore", "IIM Calcutta"],
    "target": ["XLRI Jamshedpur", "SP Jain Mumbai", "IMT Ghaziabad"],
    "safe": ["Great Lakes Chennai", "TAPMI Manipal", "XIMB Bhubaneswar"]
  }
}

STRICT RULES (CRITICAL):
1. You MUST include at least 6-9 schools total (2-3 per tier minimum).
2. Tiers must be exactly: "ambitious", "target", or "safe".
3. All fit_scores must be numbers between 0 and 10 (decimals allowed).
4. Tailor EVERY recommendation to THIS candidate's specific profile:
   - Their career goals and target industry (profile.goals.*).
   - Their academic scores (profile.scores.* and undergrad record).
   - Their geography preferences (profile.preferred_regions, open_to_abroad).
   - Their budget constraints (budget_level, max_tuition_in_lakhs, scholarship_need).
   - Their work experience level and leadership (total_work_experience_years, managerial_experience_years).
   - Their motivation and story (extra_context, resume_summary, resume_analysis).
5. For Indian-focused candidates, prioritize: IIMs, XLRI, SP Jain, FMS, ISB, MDI, IMT, Great Lakes, TAPMI, XIMB.
6. For candidates clearly open to international options, add: INSEAD, LBS, MIT Sloan, Wharton, Stanford GSB, Harvard, Kellogg, IESE, etc., but only where realistic for their scores, profile strength, and risk tolerance.
7. NEVER invent fake schools - only use real, well-known programs.
8. OUTPUT ONLY JSON - no markdown, no commentary, no code blocks, no backticks.

Generate the complete JSON response now:
"""
  )

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
  Maps internal tiers to frontend-expected names:
  - ambitious -> dream
  - target -> competitive
  - safe -> safe
  """
  tiers = {"dream": [], "competitive": [], "safe": []}
  for m in matches:
    tier = m.get("tier", "target")
    name = m.get("school_name", "Unknown School")

    # Map tiers
    if tier == "ambitious":
      tiers["dream"].append(name)
    elif tier == "target":
      tiers["competitive"].append(name)
    elif tier == "safe":
      tiers["safe"].append(name)
    else:
      # Default to competitive
      tiers["competitive"].append(name)

  return tiers


def _fallback_matches() -> List[Dict[str, Any]]:
  """
  Hardcoded fallback list so we NEVER return 0 schools.
  This will be used only if the model returns no matches.
  """
  return [
      # DREAM / AMBITIOUS
      {
          "school_name": "IIM Ahmedabad",
          "program_name": "PGP",
          "country": "India",
          "region": "Asia",
          "tier": "ambitious",
          "duration_years": 2,
          "program_type": "MBA/PGP",
          "notes": "Top Indian B-school with strong consulting and finance placements.",
          "risks": "Extremely competitive admission with very high cutoff.",
          "fit_scores": {
              "academic_fit": 8.5,
              "career_outcomes_fit": 9.0,
              "geography_fit": 9.0,
              "brand_prestige": 9.5,
              "roi_affordability": 8.0,
              "culture_personal_fit": 8.0,
          },
      },
      {
          "school_name": "IIM Bangalore",
          "program_name": "PGP",
          "country": "India",
          "region": "Asia",
          "tier": "ambitious",
          "duration_years": 2,
          "program_type": "MBA/PGP",
          "notes": "Excellent for strategy, product management, and leadership roles.",
          "risks": "Highly selective with strong peer competition.",
          "fit_scores": {
              "academic_fit": 8.0,
              "career_outcomes_fit": 9.0,
              "geography_fit": 9.0,
              "brand_prestige": 9.0,
              "roi_affordability": 8.0,
              "culture_personal_fit": 8.5,
          },
      },
      {
          "school_name": "ISB Hyderabad",
          "program_name": "PGP",
          "country": "India",
          "region": "Asia",
          "tier": "ambitious",
          "duration_years": 1,
          "program_type": "MBA/PGP",
          "notes": "Great for candidates with solid work experience targeting fast-track leadership roles.",
          "risks": "Prefers higher work-experience and strong profile for scholarships.",
          "fit_scores": {
              "academic_fit": 8.0,
              "career_outcomes_fit": 8.5,
              "geography_fit": 9.0,
              "brand_prestige": 8.8,
              "roi_affordability": 7.5,
              "culture_personal_fit": 8.0,
          },
      },
      # COMPETITIVE / TARGET
      {
          "school_name": "XLRI Jamshedpur",
          "program_name": "PGDM",
          "country": "India",
          "region": "Asia",
          "tier": "target",
          "duration_years": 2,
          "program_type": "MBA/PGP",
          "notes": "Strong HR and general management focus with excellent alumni network.",
          "risks": "Smaller city and niche HR brand compared to IIMs.",
          "fit_scores": {
              "academic_fit": 7.5,
              "career_outcomes_fit": 8.0,
              "geography_fit": 8.0,
              "brand_prestige": 8.5,
              "roi_affordability": 8.5,
              "culture_personal_fit": 8.0,
          },
      },
      {
          "school_name": "SP Jain Institute of Management and Research (SPJIMR)",
          "program_name": "PGDM",
          "country": "India",
          "region": "Asia",
          "tier": "target",
          "duration_years": 2,
          "program_type": "MBA/PGP",
          "notes": "Great option for marketing, operations, and finance within Mumbai ecosystem.",
          "risks": "Highly profile-based selection; essays and profile story matter.",
          "fit_scores": {
              "academic_fit": 7.5,
              "career_outcomes_fit": 8.0,
              "geography_fit": 9.0,
              "brand_prestige": 8.0,
              "roi_affordability": 8.0,
              "culture_personal_fit": 8.0,
          },
      },
      {
          "school_name": "MDI Gurgaon",
          "program_name": "PGPM",
          "country": "India",
          "region": "Asia",
          "tier": "target",
          "duration_years": 2,
          "program_type": "MBA/PGP",
          "notes": "Good mix of consulting, operations, and corporate roles with Delhi-NCR advantage.",
          "risks": "Cutoffs can be competitive; slightly lower brand than older IIMs.",
          "fit_scores": {
              "academic_fit": 7.0,
              "career_outcomes_fit": 7.8,
              "geography_fit": 8.5,
              "brand_prestige": 7.8,
              "roi_affordability": 8.0,
              "culture_personal_fit": 8.0,
          },
      },
      # SAFE
      {
          "school_name": "IMT Ghaziabad",
          "program_name": "PGDM",
          "country": "India",
          "region": "Asia",
          "tier": "safe",
          "duration_years": 2,
          "program_type": "MBA/PGP",
          "notes": "Strong for marketing and sales roles with good corporate connect in NCR.",
          "risks": "Placement outcomes more variable compared to top-tier institutes.",
          "fit_scores": {
              "academic_fit": 7.0,
              "career_outcomes_fit": 7.5,
              "geography_fit": 8.0,
              "brand_prestige": 7.0,
              "roi_affordability": 7.5,
              "culture_personal_fit": 7.8,
          },
      },
      {
          "school_name": "Great Lakes Institute of Management, Chennai",
          "program_name": "PGDM",
          "country": "India",
          "region": "Asia",
          "tier": "safe",
          "duration_years": 2,
          "program_type": "MBA/PGP",
          "notes": "Good option for analytics, technology, and general management roles.",
          "risks": "Relatively newer brand compared to legacy institutes.",
          "fit_scores": {
              "academic_fit": 7.0,
              "career_outcomes_fit": 7.2,
              "geography_fit": 7.5,
              "brand_prestige": 7.0,
              "roi_affordability": 8.0,
              "culture_personal_fit": 7.8,
          },
      },
      {
          "school_name": "TAPMI Manipal",
          "program_name": "PGDM",
          "country": "India",
          "region": "Asia",
          "tier": "safe",
          "duration_years": 2,
          "program_type": "MBA/PGP",
          "notes": "Stable placements and good learning environment with smaller cohort.",
          "risks": "City is less corporate than metro locations.",
          "fit_scores": {
              "academic_fit": 6.8,
              "career_outcomes_fit": 7.0,
              "geography_fit": 7.0,
              "brand_prestige": 6.8,
              "roi_affordability": 8.2,
              "culture_personal_fit": 7.8,
          },
      },
  ]


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
  print(f"LLM: {BSCHOOL_MODEL} (via gemini_client)", file=sys.stderr)
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

  # 2. Call Gemini with BSCHOOL_MODEL
  try:
    print(f"[bschool-match] Calling {BSCHOOL_MODEL} for matches...", file=sys.stderr)
    raw_output = call_gemini(
        prompt,
        temperature=0.2,
        max_output_tokens=2048,
        retry_count=3,
        timeout=120,
        model=BSCHOOL_MODEL,  # pass model explicitly
    )
    print(
        f"[bschool-match] Raw model output length = {len(raw_output)} chars",
        file=sys.stderr,
    )
  except Exception as e:
    elapsed = time.time() - start_time
    print(
        f"[bschool-match] ✗ Gemini call failed after {elapsed:.2f}s: {e}",
        file=sys.stderr,
    )
    # Hard fallback JSON
    return {
        "summary": {
            "profile_snapshot": "Unable to generate school matches due to an internal error.",
            "target_strategy": "Please try again in a few minutes.",
            "key_factors": [],
        },
        "matches": [],
        "tiers": {
            "dream": [],
            "competitive": [],
            "safe": [],
        },
        "meta": {
            "error": str(e),
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "pipeline_version": "1.0.0",
            "llm_status": "failed",
            "model_used": BSCHOOL_MODEL,
        },
    }

  # 3. Extract JSON
  try:
    print(f"[bschool-match] Raw output preview: {raw_output[:500]}", file=sys.stderr)
    parsed = extract_first_json(raw_output)
    print(f"[bschool-match] Parsed JSON keys: {list(parsed.keys())}", file=sys.stderr)
    print(
        f"[bschool-match] Matches count (raw): {len(parsed.get('matches', []))}",
        file=sys.stderr,
    )
  except Exception as e:
    elapsed = time.time() - start_time
    print(
        f"[bschool-match] ✗ JSON extraction failed after {elapsed:.2f}s: {e}",
        file=sys.stderr,
    )
    return {
        "summary": {
            "profile_snapshot": "Model response could not be parsed as JSON.",
            "target_strategy": "Please try again or contact support if the issue persists.",
            "key_factors": [],
        },
        "matches": [],
        "tiers": {
            "dream": [],
            "competitive": [],
            "safe": [],
        },
        "meta": {
            "error": f"JSON parse error: {e}",
            "raw_output_head": raw_output[:500],
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "pipeline_version": "1.0.0",
            "llm_status": "ok_but_parse_failed",
            "model_used": BSCHOOL_MODEL,
        },
    }

  # 4. Normalize structure
  summary = parsed.get("summary") or {}
  matches_raw = parsed.get("matches") or []
  tiers_raw = parsed.get("tiers") or {}

  matches = _normalize_matches(matches_raw)

  # 🚨 If LLM gave 0 matches, use fallback so UI never shows 0
  if not matches:
    print(
        "[bschool-match] ⚠ No matches from model, using fallback school list",
        file=sys.stderr,
    )
    matches = _normalize_matches(_fallback_matches())

  # If LLM didn't provide usable tiers, build from matches
  if not isinstance(tiers_raw, dict) or not tiers_raw:
    tiers = _build_tiers_from_matches(matches)
  else:
    # Normalize tiers and map to frontend names
    tiers = {
        "dream": list(tiers_raw.get("ambitious", [])),
        "competitive": list(tiers_raw.get("target", [])),
        "safe": list(tiers_raw.get("safe", [])),
    }

  # Log final counts for debugging
  print(f"[bschool-match] Final matches count: {len(matches)}", file=sys.stderr)
  print(
      f"[bschool-match] Tier counts -> "
      f"dream={len(tiers.get('dream', []))}, "
      f"competitive={len(tiers.get('competitive', []))}, "
      f"safe={len(tiers.get('safe', []))}",
      file=sys.stderr,
  )

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
          "model_used": BSCHOOL_MODEL,
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
    print(
        "Usage: python bschool_match_pipeline.py '<candidate_profile_json>'",
        file=sys.stderr,
    )
    sys.exit(1)

  try:
    candidate_profile = json.loads(sys.argv[1])
  except Exception as e:
    print(f"Invalid JSON: {e}", file=sys.stderr)
    sys.exit(1)

  result = run_bschool_match(candidate_profile)
  print(json.dumps(result, ensure_ascii=False, indent=2))
