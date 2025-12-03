// src/lib/bschoolmatch/types.ts

// =============================
// Core modes
// =============================

export type BschoolMatchMode =
  | "questions-only"
  | "resume-upload"
  | "resume-from-profile";

// =============================
// Candidate scoring / constraints
// =============================

export interface CandidateScores {
  gmat?: number | null;
  gre?: number | null;
  cat?: number | null;
  x_percentage?: number | null; // Class 10
  xii_percentage?: number | null; // Class 12
  ug_cgpa?: number | null;
  other_tests?: string | null; // e.g. "IELTS 7.5"
}

export interface CandidateConstraints {
  budget_level?: "low" | "medium" | "high";
  prefers_one_year?: boolean;
  open_to_abroad?: boolean;
  max_tuition_in_lakhs?: number | null;
  scholarship_need?: "none" | "helpful" | "strong-need";
  risk_tolerance?: "safe" | "balanced" | "aggressive";
}

// =============================
// Goals / aspirations
// =============================

export interface CandidateGoals {
  short_term?: string;
  long_term?: string;
  target_functions?: string[]; // e.g. ["consulting", "product management"]
  target_industries?: string[]; // e.g. ["tech", "finance"]
}

// =============================
// Canonical candidate profile
// =============================

export interface CandidateProfile {
  // Meta
  name?: string;
  email?: string;
  mode?: BschoolMatchMode;

  // Work background
  current_role?: string;
  current_company?: string;
  total_work_experience_years?: number;
  managerial_experience_years?: number;
  has_international_experience?: boolean;

  // Academics & tests
  undergrad_degree?: string;
  undergrad_institution?: string;
  undergrad_grad_year?: number | null;
  scores?: CandidateScores;

  // Preferences & constraints
  target_intake_year?: number | null;
  preferred_regions?: string[]; // e.g. ["india", "europe", "us"]
  preferred_program_types?: string[]; // e.g. ["1-year", "2-year", "online"]
  constraints?: CandidateConstraints;

  // Goals
  goals?: CandidateGoals;

  // Optional: LLM / resume integration
  resume_text?: string;
  resume_summary?: string;
  resume_analysis?: any; // shape from profileresume tool, if present

  // Free-form notes
  extra_context?: string;
}

// =============================
// Match result structures
// =============================

export interface BschoolTierCluster {
  dream: string[];
  competitive: string[];
  safe: string[];
}

export interface BschoolMatchSchool {
  id: string; // e.g. "iim-a-pgp"
  name: string; // e.g. "IIM Ahmedabad PGP"
  country: string;
  region: string; // "india", "europe", etc.
  program_type: string; // "2-year", "1-year", "online"
  tier: "dream" | "competitive" | "safe";
  overall_match_score: number; // 0–100
  notes?: string;
  reasons?: string[];
}

export interface BschoolMatchSummary {
  headline: string;
  narrative: string;
  risk_profile: "safe" | "balanced" | "aggressive";
  key_drivers: string[];
}

export interface BschoolMatchResponse {
  summary: BschoolMatchSummary;
  matches: BschoolMatchSchool[];
  tiers: BschoolTierCluster;
  raw_profile?: CandidateProfile;
  meta?: {
    source?: string;
    llm_model?: string;
    generated_at?: string;
    [key: string]: unknown;
  };
  processing_meta?: {
    total_duration_seconds?: number;
    ml_service_url?: string;
    timestamp?: string;
    [key: string]: unknown;
  };
}

// =============================
// Questionnaire types
// =============================

export type QuestionType =
  | "single-select"
  | "multi-select"
  | "number"
  | "slider"
  | "textarea";

export interface QuestionOption {
  value: string;
  label: string;
  helperText?: string;
}

export interface BschoolQuestion {
  id: string;
  label: string;
  helperText?: string;
  type: QuestionType;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: QuestionOption[];
  placeholder?: string;
}

export type QuestionAnswerMap = Record<string, unknown>;

// =============================
// Request payload to ML / API
// =============================

export interface BschoolMatchRequest {
  /** How the user is running the tool (questions-only / resume-upload / resume-from-profile) */
  mode: BschoolMatchMode;

  /** Canonical structured profile that the ML / match engine consumes */
  profile: CandidateProfile;

  /**
   * Optional: raw form answers (useful for debugging / future rule-based logic).
   * Only populated for questions-only / hybrid flows.
   */
  raw_answers?: QuestionAnswerMap;

  /**
   * Optional: full JSON report from Profile & Resume tool
   * (if user chose “resume-from-profile” mode). Forwarded so the ML service
   * can reuse scoring/strengths instead of re-running heavy analysis.
   */
  profile_resume_report?: any;
}
