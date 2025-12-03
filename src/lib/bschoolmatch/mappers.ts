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

  // --- Work experience ---
  const totalExp = toNumberOrNull(answers["total_experience"]);
  const hasManagerial = String(
    answers["has_managerial_experience"] ?? "no"
  ).toLowerCase();

  // Simple heuristic: if they say "formal", give at least 1 year
  const managerialYears =
    hasManagerial === "formal" ? Math.max(1, totalExp ?? 0) : 0;

  // --- Constraints / preferences ---
  const constraints: CandidateConstraints = {
    budget_level: (answers["budget_level"] as any) || undefined,
    risk_tolerance: (answers["risk_tolerance"] as any) || "balanced",
    // can extend later: prefers_one_year, scholarship_need, etc.
  };

  // --- Goals ---
  const goals: CandidateGoals = {
    short_term: (answers["career_goals_short"] as string) || "",
    long_term: (answers["career_goals_long"] as string) || "",
    // In v1 we keep these empty; later we can derive from text using LLM
    target_functions: [],
    target_industries: [],
  };

  const profile: CandidateProfile = {
    // Meta
    name,
    email,
    mode,

    // Background (minimal for v1 – you can enrich later)
    current_role: undefined,
    current_company: undefined,
    total_work_experience_years: totalExp ?? undefined,
    managerial_experience_years: managerialYears || undefined,
    has_international_experience: undefined,

    // Academics / tests (hook for future)
    undergrad_degree: undefined,
    undergrad_institution: undefined,
    undergrad_grad_year: null,
    scores: {
      // For now, we’re not mapping test_status → numeric score here.
      // That logic can live in the backend match pipeline if needed.
    },

    // Preferences
    target_intake_year: toNumberOrNull(answers["target_intake_year"]),
    preferred_regions: toStringArray(answers["preferred_regions"]),
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

    // Free-form extra context, if you add such a question later
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
    },

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
