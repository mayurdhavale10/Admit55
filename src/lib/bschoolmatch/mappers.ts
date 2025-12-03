// src/lib/bschoolmatch/mappers.ts

import {
  CandidateProfile,
  CandidateConstraints,
  CandidateGoals,
  QuestionAnswerMap,
  BschoolMatchMode,
  BschoolMatchRequest,
} from "./types";

/**
 * Safe helper: convert unknown → number | null
 */
function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Safe helper: convert unknown → string[]
 */
function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }
  return [String(value)];
}

/**
 * Safe helper: convert unknown → boolean | undefined
 */
function toBoolOrUndefined(value: unknown): boolean | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "boolean") return value;
  const s = String(value).trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(s)) return true;
  if (["no", "n", "false", "0"].includes(s)) return false;
  return undefined;
}

export interface BuildProfileOptions {
  mode: BschoolMatchMode;
  name?: string;
  email?: string;
  resumeText?: string | null;
  resumeSummary?: string | null;
  resumeAnalysis?: any; // shape from profileresume tool
}

/**
 * Convert questionnaire answers + optional resume context
 * into the canonical CandidateProfile we send to the ML service.
 */
export function buildCandidateProfileFromAnswers(
  answers: QuestionAnswerMap,
  options: BuildProfileOptions
): CandidateProfile {
  const {
    mode,
    name,
    email,
    resumeText,
    resumeSummary,
    resumeAnalysis,
  } = options;

  // ---------------------------------------
  // Work experience
  // ---------------------------------------
  const totalExp =
    toNumberOrNull(answers["total_experience"]) ??
    toNumberOrNull(answers["experience_years"]);
  const hasManagerial = String(
    answers["has_managerial_experience"] ?? "no"
  ).toLowerCase();

  // Simple heuristic: if they say "formal", give at least 1 year
  const managerialYears =
    hasManagerial === "formal" ? Math.max(1, totalExp ?? 0) : 0;

  // ---------------------------------------
  // Test scores (GMAT / GRE / CAT etc.)
  // You can keep both numeric + raw
  // ---------------------------------------
  const testScoreRaw =
    typeof answers["test_score"] === "string"
      ? (answers["test_score"] as string).trim()
      : answers["test_score"] != null
      ? String(answers["test_score"])
      : "";

  const testScoreNumeric = toNumberOrNull(answers["test_score"]);
  const ugGpaRaw =
    typeof answers["ug_gpa"] === "string"
      ? (answers["ug_gpa"] as string).trim()
      : answers["ug_gpa"] != null
      ? String(answers["ug_gpa"])
      : "";

  const intakeYear =
    toNumberOrNull(answers["intake_year"]) ??
    toNumberOrNull(answers["target_intake_year"]);

  // ---------------------------------------
  // Constraints / preferences
  // ---------------------------------------
  const maxBudgetTotal =
    toNumberOrNull(answers["max_budget"]) ??
    toNumberOrNull(answers["budget"]) ??
    toNumberOrNull(answers["max_budget_total"]);

  const geoAnswer = answers["geography"];
  const preferredRegions = [
    ...toStringArray(answers["preferred_regions"]),
    ...toStringArray(geoAnswer),
  ].filter(Boolean);

  const constraintsBase: CandidateConstraints = {
    budget_level: (answers["budget_level"] as any) || undefined,
    risk_tolerance: (answers["risk_tolerance"] as any) || "balanced",
  };

  // Extend constraints with richer info (cast to any for safety)
  const constraints: CandidateConstraints = {
    ...constraintsBase,
    ...(maxBudgetTotal != null && { max_budget_total: maxBudgetTotal } as any),
    ...(toBoolOrUndefined(answers["flexible_budget"]) !== undefined && {
      flexible_budget: toBoolOrUndefined(answers["flexible_budget"]),
    } as any),
    ...(toBoolOrUndefined(answers["flexible_geography"]) !== undefined && {
      flexible_geography: toBoolOrUndefined(answers["flexible_geography"]),
    } as any),
    ...(toBoolOrUndefined(answers["flexible_risk"]) !== undefined && {
      flexible_risk: toBoolOrUndefined(answers["flexible_risk"]),
    } as any),
    ...(toBoolOrUndefined(answers["flexible_program_length"]) !== undefined && {
      flexible_program_length: toBoolOrUndefined(
        answers["flexible_program_length"]
      ),
    } as any),
  };

  // ---------------------------------------
  // Goals
  // ---------------------------------------
  const postMbaGoal =
    typeof answers["post_mba_goal"] === "string"
      ? (answers["post_mba_goal"] as string).trim()
      : "";

  const whyMbaNow =
    typeof answers["why_mba_now"] === "string"
      ? (answers["why_mba_now"] as string).trim()
      : "";

  const goals: CandidateGoals = {
    short_term:
      postMbaGoal ||
      ((answers["career_goals_short"] as string) || ""),
    long_term: (answers["career_goals_long"] as string) || "",
    // In v1 we keep these empty; later we can derive from text using LLM
    target_functions: [],
    target_industries: [],
  };

  // Attach extra goal metadata without breaking older types
  if (whyMbaNow) {
    (goals as any).why_mba_now = whyMbaNow;
  }
  if (postMbaGoal) {
    (goals as any).post_mba_goal = postMbaGoal;
  }

  const profile: CandidateProfile = {
    // Meta
    name,
    email,
    mode,

    // Background
    current_role:
      typeof answers["current_role"] === "string"
        ? (answers["current_role"] as string)
        : undefined,
    current_company:
      typeof answers["current_company"] === "string"
        ? (answers["current_company"] as string)
        : undefined,
    total_work_experience_years: totalExp ?? undefined,
    managerial_experience_years: managerialYears || undefined,
    has_international_experience: toBoolOrUndefined(
      answers["has_international_experience"]
    ),

    // Academics / tests
    undergrad_degree:
      typeof answers["ug_degree"] === "string"
        ? (answers["ug_degree"] as string)
        : undefined,
    undergrad_institution:
      typeof answers["ug_institution"] === "string"
        ? (answers["ug_institution"] as string)
        : undefined,
    undergrad_grad_year: toNumberOrNull(answers["ug_grad_year"]),
    scores: {
      ...(testScoreRaw && { test_score_raw: testScoreRaw }),
      ...(testScoreNumeric != null && { test_score_numeric: testScoreNumeric }),
      ...(ugGpaRaw && { undergrad_gpa_raw: ugGpaRaw }),
    } as any,

    // Preferences
    target_intake_year: intakeYear,
    preferred_regions: preferredRegions,
    preferred_program_types: toStringArray(
      answers["preferred_program_types"]
    ),
    constraints,

    // Goals
    goals,

    // Resume / LLM integration (optional)
    resume_text: resumeText || undefined,
    resume_summary: resumeSummary || undefined,
    resume_analysis: resumeAnalysis,

    // Free-form extra context
    extra_context:
      typeof answers["extra_context"] === "string"
        ? (answers["extra_context"] as string)
        : undefined,
  };

  return profile;
}

/**
 * Build a full BschoolMatchRequest from questionnaire answers.
 * This is what you POST to /api/bschool/match.
 */
export function buildBschoolMatchRequestFromAnswers(
  answers: QuestionAnswerMap,
  options: BuildProfileOptions & { profileResumeReport?: any }
): BschoolMatchRequest {
  const profile = buildCandidateProfileFromAnswers(answers, options);

  const request: BschoolMatchRequest = {
    mode: options.mode,
    profile,
    raw_answers: answers,
    profile_resume_report: options.profileResumeReport,
  };

  return request;
}

/**
 * Build a minimal BschoolMatchRequest when you ONLY have resume data
 * (e.g. mode = "resume-upload" or "resume-from-profile").
 *
 * You can still pass some manual overrides later (regions, risk, etc.).
 */
export interface BuildFromResumeOptions {
  mode: Extract<BschoolMatchMode, "resume-upload" | "resume-from-profile">;
  name?: string;
  email?: string;
  resumeText: string;
  resumeSummary?: string | null;
  resumeAnalysis?: any; // from profileresumetool ML
  // Optional: lightweight overrides
  preferred_regions?: string[];
  preferred_program_types?: string[];
  target_intake_year?: number | null;
}

export function buildBschoolMatchRequestFromResume(
  opts: BuildFromResumeOptions
): BschoolMatchRequest {
  const {
    mode,
    name,
    email,
    resumeText,
    resumeSummary,
    resumeAnalysis,
    preferred_regions,
    preferred_program_types,
    target_intake_year,
  } = opts;

  const profile: CandidateProfile = {
    name,
    email,
    mode,

    // Background – could be enriched from resumeAnalysis later
    current_role: undefined,
    current_company: undefined,
    total_work_experience_years: undefined,
    managerial_experience_years: undefined,
    has_international_experience: undefined,

    undergrad_degree: undefined,
    undergrad_institution: undefined,
    undergrad_grad_year: null,
    scores: {},

    target_intake_year: target_intake_year ?? null,
    preferred_regions: preferred_regions ?? [],
    preferred_program_types: preferred_program_types ?? [],
    constraints: {
      // Default to balanced risk if unknown
      risk_tolerance: "balanced",
    } as any,

    goals: {
      short_term: "",
      long_term: "",
      target_functions: [],
      target_industries: [],
    },

    resume_text: resumeText,
    resume_summary: resumeSummary ?? undefined,
    resume_analysis: resumeAnalysis,
    extra_context: undefined,
  };

  const request: BschoolMatchRequest = {
    mode,
    profile,
    // no raw_answers in pure-resume flow
    profile_resume_report: resumeAnalysis,
  };

  return request;
}
