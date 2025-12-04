#!/usr/bin/env python3
"""
bschool_match_pipeline.py - COMPLETE FIXED VERSION

Key fixes:
1. Payload reduced from 180KB to <10KB
2. Resume text: 500 chars max (was 3000)
3. Removed raw_answers entirely
4. Added 'id' field to all matches
5. Increased max_output_tokens to 16000
6. Better error handling and logging
"""

import json
import os
import sys
import time
from typing import Any, Dict, List

from gemini_client import call_gemini
from pipeline.mba_hybrid_pipeline import extract_first_json

BSCHOOL_MODEL = os.getenv("GEMINI_BSCHOOL", "gemini-2.5-flash")


def _build_llm_payload_from_request(request_body: Dict[str, Any]) -> Dict[str, Any]:
  """
  Build ULTRA-SLIM payload - target < 10,000 chars total
  """
  mode = request_body.get("mode")
  profile = request_body.get("profile") or {}
  
  # Only extract essential fields
  slim_profile = {
    "gmat_score": profile.get("gmat_score"),
    "gre_score": profile.get("gre_score"),
    "cat_percentile": profile.get("cat_percentile"),
    "undergrad_gpa": profile.get("undergrad_gpa"),
    "undergrad_major": profile.get("undergrad_major"),
    "work_experience_years": profile.get("work_experience_years"),
    "current_industry": profile.get("current_industry"),
    "target_industry": profile.get("target_industry"),
    "career_goals": profile.get("career_goals"),
    "geography_preferences": profile.get("geography_preferences"),
    "budget_max": profile.get("budget_max"),
    "total_work_experience_years": profile.get("total_work_experience_years"),
    "current_role": profile.get("current_role"),
    "target_intake_year": profile.get("target_intake_year"),
    "preferred_regions": profile.get("preferred_regions"),
  }
  
  # Add MINIMAL resume (500 chars max)
  resume_text = profile.get("resume_text")
  if isinstance(resume_text, str) and len(resume_text) > 500:
    slim_profile["resume_summary"] = resume_text[:500] + "...[truncated]"
  elif resume_text:
    slim_profile["resume_summary"] = resume_text
  
  # Get test scores
  scores = profile.get("scores") or {}
  if scores:
    slim_profile["test_scores"] = {
      "test_score_raw": scores.get("test_score_raw"),
      "test_score_numeric": scores.get("test_score_numeric"),
      "undergrad_gpa_raw": scores.get("undergrad_gpa_raw"),
    }
  
  # Get constraints
  constraints = profile.get("constraints") or {}
  if constraints:
    slim_profile["constraints"] = {
      "risk_tolerance": constraints.get("risk_tolerance", "balanced"),
      "max_budget_total": constraints.get("max_budget_total"),
    }
  
  # Get goals
  goals = profile.get("goals") or {}
  if goals:
    slim_profile["goals"] = {
      "short_term": goals.get("short_term"),
      "post_mba_goal": goals.get("post_mba_goal"),
    }
  
  llm_payload = {
    "mode": mode,
    "profile": slim_profile,
  }
  
  return llm_payload


def build_match_prompt(request_body: Dict[str, Any]) -> str:
  """Build ultra-compact prompt"""
  llm_payload = _build_llm_payload_from_request(request_body)
  candidate_json = json.dumps(llm_payload, ensure_ascii=False, indent=2)
  
  payload_size = len(candidate_json)
  print(f"[bschool-match] LLM payload size: {payload_size} chars", file=sys.stderr)
  
  if payload_size > 15000:
    print(f"[bschool-match] ⚠️ WARNING: Payload large at {payload_size} chars", file=sys.stderr)

  prompt = (
    "You are an expert MBA admissions consultant.\n\n"
    "CANDIDATE PROFILE:\n"
    + candidate_json
    + """

Recommend 9 MBA programs split across 3 tiers (3 per tier: ambitious/target/safe).

Return ONLY valid JSON:

{
  "summary": {
    "profile_snapshot": "1-2 sentence candidate summary",
    "target_strategy": "1 sentence application strategy",
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
      "notes": "Strong fit for consulting goals",
      "risks": "Highly competitive",
      "fit_scores": {
        "academic_fit": 8.5,
        "career_outcomes_fit": 9.0,
        "geography_fit": 10.0,
        "brand_prestige": 9.5,
        "roi_affordability": 7.0,
        "culture_personal_fit": 8.0
      }
    }
  ],
  "tiers": {
    "ambitious": ["IIM Ahmedabad", "IIM Bangalore", "IIM Calcutta"],
    "target": ["XLRI Jamshedpur", "SP Jain Mumbai", "MDI Gurgaon"],
    "safe": ["IMT Ghaziabad", "Great Lakes Chennai", "TAPMI Manipal"]
  }
}

RULES:
1. EXACTLY 9 schools (3 per tier)
2. fit_scores: numbers 0-10
3. Tiers: "ambitious", "target", "safe"
4. Output ONLY JSON - no markdown
5. Indian schools: IIMs, XLRI, SP Jain, FMS, ISB, MDI, IMT, Great Lakes, TAPMI, XIMB
6. International: INSEAD, LBS, MIT Sloan, Wharton, Stanford, Harvard

Generate JSON now:
"""
  )
  
  return prompt


def _normalize_fit_scores(raw_scores: Dict[str, Any]) -> Dict[str, float]:
  """Ensure all fit_scores are numeric 0-10"""
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
    "academic_fit", "career_outcomes_fit", "geography_fit",
    "brand_prestige", "roi_affordability", "culture_personal_fit",
  ]
  for k in keys:
    v = raw_scores.get(k, 5.0)
    try:
      num = float(v)
      num = max(0.0, min(10.0, num))
    except Exception:
      num = 5.0
    out[k] = round(num, 2)
  return out


def _normalize_matches(matches: Any) -> List[Dict[str, Any]]:
  """Normalize matches and ADD UNIQUE ID"""
  if not isinstance(matches, list):
    return []

  normalized: List[Dict[str, Any]] = []
  for idx, m in enumerate(matches):
    if not isinstance(m, dict):
      continue

    tier = m.get("tier", "target") or "target"
    if tier not in ("ambitious", "target", "safe"):
      tier = "target"

    fit_scores = _normalize_fit_scores(m.get("fit_scores", {}))
    school_name = m.get("school_name", "").strip() or f"Unknown School {idx+1}"

    normalized.append({
      "id": f"{school_name.lower().replace(' ', '_')}_{idx}",
      "school_name": school_name,
      "program_name": m.get("program_name", "").strip() or "MBA / PGP",
      "country": m.get("country", "").strip() or "Unknown",
      "region": m.get("region", "").strip() or "Unknown",
      "tier": tier,
      "duration_years": m.get("duration_years", 2),
      "program_type": m.get("program_type", "MBA/PGP"),
      "notes": m.get("notes", "").strip(),
      "risks": m.get("risks", "").strip(),
      "fit_scores": fit_scores,
    })
  return normalized


def _build_tiers_from_matches(matches: List[Dict[str, Any]]) -> Dict[str, List[str]]:
  """Build tiers dict from matches"""
  tiers = {"dream": [], "competitive": [], "safe": []}
  for m in matches:
    tier = m.get("tier", "target")
    name = m.get("school_name", "Unknown School")

    if tier == "ambitious":
      tiers["dream"].append(name)
    elif tier == "target":
      tiers["competitive"].append(name)
    elif tier == "safe":
      tiers["safe"].append(name)
    else:
      tiers["competitive"].append(name)
  return tiers


def _fallback_matches() -> List[Dict[str, Any]]:
  """Hardcoded fallback with IDs and proper fit_scores"""
  return [
    {
      "id": "iim_ahmedabad_0",
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
      "id": "iim_bangalore_1",
      "school_name": "IIM Bangalore",
      "program_name": "PGP",
      "country": "India",
      "region": "Asia",
      "tier": "ambitious",
      "duration_years": 2,
      "program_type": "MBA/PGP",
      "notes": "Excellent for strategy and product management.",
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
      "id": "isb_hyderabad_2",
      "school_name": "ISB Hyderabad",
      "program_name": "PGP",
      "country": "India",
      "region": "Asia",
      "tier": "ambitious",
      "duration_years": 1,
      "program_type": "MBA/PGP",
      "notes": "Great for candidates with solid work experience.",
      "risks": "Prefers higher work-experience.",
      "fit_scores": {
        "academic_fit": 8.0,
        "career_outcomes_fit": 8.5,
        "geography_fit": 9.0,
        "brand_prestige": 8.8,
        "roi_affordability": 7.5,
        "culture_personal_fit": 8.0,
      },
    },
    {
      "id": "xlri_jamshedpur_3",
      "school_name": "XLRI Jamshedpur",
      "program_name": "PGDM",
      "country": "India",
      "region": "Asia",
      "tier": "target",
      "duration_years": 2,
      "program_type": "MBA/PGP",
      "notes": "Strong HR and general management focus.",
      "risks": "Smaller city location.",
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
      "id": "sp_jain_4",
      "school_name": "SP Jain Mumbai",
      "program_name": "PGDM",
      "country": "India",
      "region": "Asia",
      "tier": "target",
      "duration_years": 2,
      "program_type": "MBA/PGP",
      "notes": "Great for marketing and operations.",
      "risks": "Profile-based selection.",
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
      "id": "mdi_gurgaon_5",
      "school_name": "MDI Gurgaon",
      "program_name": "PGPM",
      "country": "India",
      "region": "Asia",
      "tier": "target",
      "duration_years": 2,
      "program_type": "MBA/PGP",
      "notes": "Good for consulting and operations.",
      "risks": "Lower brand than older IIMs.",
      "fit_scores": {
        "academic_fit": 7.0,
        "career_outcomes_fit": 7.8,
        "geography_fit": 8.5,
        "brand_prestige": 7.8,
        "roi_affordability": 8.0,
        "culture_personal_fit": 8.0,
      },
    },
    {
      "id": "imt_ghaziabad_6",
      "school_name": "IMT Ghaziabad",
      "program_name": "PGDM",
      "country": "India",
      "region": "Asia",
      "tier": "safe",
      "duration_years": 2,
      "program_type": "MBA/PGP",
      "notes": "Strong for marketing and sales.",
      "risks": "Variable placement outcomes.",
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
      "id": "great_lakes_7",
      "school_name": "Great Lakes Chennai",
      "program_name": "PGDM",
      "country": "India",
      "region": "Asia",
      "tier": "safe",
      "duration_years": 2,
      "program_type": "MBA/PGP",
      "notes": "Good for analytics and technology.",
      "risks": "Relatively newer brand.",
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
      "id": "tapmi_manipal_8",
      "school_name": "TAPMI Manipal",
      "program_name": "PGDM",
      "country": "India",
      "region": "Asia",
      "tier": "safe",
      "duration_years": 2,
      "program_type": "MBA/PGP",
      "notes": "Stable placements with smaller cohort.",
      "risks": "Less corporate than metros.",
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


def run_bschool_match(request_body: Dict[str, Any]) -> Dict[str, Any]:
  """Main pipeline entry point"""
  print("\n" + "=" * 60, file=sys.stderr)
  print("B-SCHOOL MATCH PIPELINE v1.3 (FINAL FIX)", file=sys.stderr)
  print(f"LLM: {BSCHOOL_MODEL}", file=sys.stderr)
  print("=" * 60 + "\n", file=sys.stderr)

  start_time = time.time()

  try:
    input_size = len(json.dumps(request_body))
    print(f"[bschool-match] Input request size: {input_size:,} chars", file=sys.stderr)
  except Exception:
    pass

  prompt = build_match_prompt(request_body)
  print(f"[bschool-match] Final prompt size: {len(prompt):,} chars", file=sys.stderr)

  try:
    print(f"[bschool-match] Calling {BSCHOOL_MODEL}...", file=sys.stderr)
    raw_output = call_gemini(
      prompt,
      temperature=0.2,
      max_output_tokens=16000,
      retry_count=3,
      timeout=120,
      model=BSCHOOL_MODEL,
    )
    output_len = len(raw_output)
    print(f"[bschool-match] ✓ Got {output_len:,} chars from model", file=sys.stderr)
    
    if output_len < 500:
      print(f"[bschool-match] ⚠️ Output short: {output_len} chars", file=sys.stderr)
      
  except Exception as e:
    elapsed = time.time() - start_time
    print(f"[bschool-match] ✗ Gemini failed: {e}", file=sys.stderr)
    
    matches = _normalize_matches(_fallback_matches())
    tiers = _build_tiers_from_matches(matches)
    
    return {
      "summary": {
        "profile_snapshot": "Using standard Indian B-school recommendations.",
        "target_strategy": "Baseline list provided.",
        "key_factors": ["Fallback recommendations", "Mix of tiers"],
      },
      "matches": matches,
      "tiers": tiers,
      "meta": {
        "error": str(e),
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "pipeline_version": "1.3.0",
        "llm_status": "failed_fallback",
        "model_used": BSCHOOL_MODEL,
      },
    }

  try:
    parsed = extract_first_json(raw_output)
    print(f"[bschool-match] ✓ Parsed keys: {list(parsed.keys())}", file=sys.stderr)
    
  except Exception as e:
    elapsed = time.time() - start_time
    print(f"[bschool-match] ✗ Parse failed: {e}", file=sys.stderr)
    
    matches = _normalize_matches(_fallback_matches())
    tiers = _build_tiers_from_matches(matches)
    
    return {
      "summary": {
        "profile_snapshot": "Parse error - using fallback.",
        "target_strategy": "Baseline list provided.",
        "key_factors": [],
      },
      "matches": matches,
      "tiers": tiers,
      "meta": {
        "error": f"Parse error: {e}",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "pipeline_version": "1.3.0",
        "llm_status": "parse_failed",
        "model_used": BSCHOOL_MODEL,
      },
    }

  summary = parsed.get("summary") or {}
  matches_raw = parsed.get("matches") or []
  tiers_raw = parsed.get("tiers") or {}

  matches = _normalize_matches(matches_raw)
  
  if not matches:
    print("[bschool-match] ⚠️ No matches, using fallback", file=sys.stderr)
    matches = _normalize_matches(_fallback_matches())

  if not isinstance(tiers_raw, dict) or not tiers_raw:
    tiers = _build_tiers_from_matches(matches)
  else:
    tiers = {
      "dream": list(tiers_raw.get("ambitious", [])),
      "competitive": list(tiers_raw.get("target", [])),
      "safe": list(tiers_raw.get("safe", [])),
    }

  print(f"[bschool-match] ✓ Final: {len(matches)} matches", file=sys.stderr)

  summary_out = {
    "profile_snapshot": summary.get("profile_snapshot", "").strip() 
      or "Profile analyzed.",
    "target_strategy": summary.get("target_strategy", "").strip()
      or "Balance ambitious, competitive, safe.",
    "key_factors": summary.get("key_factors", []) or [],
  }

  elapsed = time.time() - start_time
  print(f"[bschool-match] ✓ Complete in {elapsed:.2f}s", file=sys.stderr)

  return {
    "summary": summary_out,
    "matches": matches,
    "tiers": tiers,
    "meta": {
      "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
      "pipeline_version": "1.3.0",
      "llm_status": "ok",
      "latency_seconds": round(elapsed, 2),
      "model_used": BSCHOOL_MODEL,
    },
  }


if __name__ == "__main__":
  if len(sys.argv) < 2:
    print("Usage: python bschool_match_pipeline.py '<json>'", file=sys.stderr)
    sys.exit(1)

  try:
    request_body = json.loads(sys.argv[1])
  except Exception as e:
    print(f"Invalid JSON: {e}", file=sys.stderr)
    sys.exit(1)

  result = run_bschool_match(request_body)
  print(json.dumps(result, ensure_ascii=False, indent=2))