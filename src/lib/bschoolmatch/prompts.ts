// src/lib/bschoolmatch/prompts.ts

// ---------------------------------------------------------------------
// UI copy
// ---------------------------------------------------------------------

export const BSMATCH_TITLE = "Find your best-fit B-schools";

export const BSMATCH_SUBTITLE =
  "Answer a few questions (or share your resume) and we’ll suggest Dream / Competitive / Safe options tailored to your profile.";

export const BSMATCH_DISCLAIMER =
  "These suggestions are for guidance only and do not guarantee admission. Always cross-check official school requirements before applying.";

export const BSMATCH_QUESTION_INSTRUCTIONS =
  "Be honest and realistic with your goals, work experience and preferences. The more specific you are, the smarter the matches.";

// Optional: helpful labels for modes (used in UI toggles/buttons)
export const MODE_LABELS = {
  "questions-only": "Answer questions only",
  "resume-upload": "Use my resume + questions",
  "resume-from-profile":
    "Use resume from Profile & Resume tool (if analyzed earlier)",
} as const;

// ---------------------------------------------------------------------
// LLM prompt template (logical contract with /bschool-match pipeline)
// ---------------------------------------------------------------------

/**
 * This is the logical prompt we use when calling the LLM in the
 * bschool_match_pipeline (Python version keeps the same contract).
 *
 * The Python pipeline will interpolate:
 * - {profile_json}
 * - {answers_json}
 * - {resume_analysis_json}
 *
 * and expect a JSON response that matches:
 *   BschoolMatchResponse (summary, matches, tiers, meta, processing_meta?)
 */
export const BSMATCH_LLM_PROMPT_TEMPLATE = `
You are an MBA admissions and B-school matching expert.

You will receive:
1) A structured candidate profile as JSON (profile_json).
2) Optional raw questionnaire answers as JSON (answers_json).
3) Optional resume analysis as JSON from the Profile & Resume tool (resume_analysis_json).

Your task:
- Use ALL specific data from the profile and resume analysis to recommend MBA/PGDM programs.
- Focus on Indian schools first (IIMs, ISB, XLRI, SPJIMR, FMS, MDI, etc.), but you may add global options if the candidate is open to abroad.
- Clearly separate schools into Dream, Competitive, and Safe buckets.
- Think like a practical admissions consultant: consider work experience, academic history, test scores, goals, geography, budget, and risk tolerance.

Input JSON examples (placeholders):

profile_json:
{profile_json}

answers_json (may be empty if not applicable):
{answers_json}

resume_analysis_json (from profileresumetool, may be null):
{resume_analysis_json}

You MUST return ONLY a single valid JSON object with this exact structure:

{
  "summary": {
    "headline": string,
    "narrative": string,
    "risk_profile": "safe" | "balanced" | "aggressive",
    "key_drivers": string[]
  },
  "matches": [
    {
      "id": string,            // e.g. "iim-a-pgp"
      "name": string,          // e.g. "IIM Ahmedabad PGP"
      "country": string,       // e.g. "India"
      "region": string,        // e.g. "india", "europe", "us"
      "program_type": string,  // e.g. "2-year", "1-year", "online"
      "tier": "dream" | "competitive" | "safe",
      "overall_match_score": number,  // 0-100
      "notes": string,         // 1–3 sentences why this school is suggested
      "reasons": string[]      // bullet list of concrete reasons
    }
  ],
  "tiers": {
    "dream": string[],        // list of school IDs that are dream
    "competitive": string[],  // list of school IDs that are competitive
    "safe": string[]          // list of school IDs that are safe
  },
  "meta": {
    "source": "llm-bschool-match",
    "llm_model": string,
    "generated_at": string    // ISO timestamp
  }
}

CRITICAL RULES:
- Use realistic judgement about competitiveness (do NOT put all schools in "dream").
- If test scores are weak or missing, prioritize schools that accept profiles with such scores.
- If the candidate strongly prefers India-only, do NOT recommend mostly international programs.
- Tie every recommended school to specific profile facts in the "notes" / "reasons" fields
  (e.g., work ex in consulting, strong quant background, geography, budget, goals, etc.).
- Do NOT invent fake schools or fake program names.

Output constraints:
- Return ONLY the JSON object described above.
- No markdown, no explanation, no backticks, no commentary outside the JSON.
`.trim();
