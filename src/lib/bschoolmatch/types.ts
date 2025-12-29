// src/lib/bschoolmatch/types.ts

// =============================
// Core modes (✅ ONLY TWO)
// =============================

export const BSCHOOL_MATCH_MODES = {
  QUICK_PROFILE: "quick-profile",
  RESUME_UPLOAD: "resume-upload",
} as const;

export type BschoolMatchMode =
  (typeof BSCHOOL_MATCH_MODES)[keyof typeof BSCHOOL_MATCH_MODES];

// =============================
// Candidate scoring / constraints
// =============================

export interface CandidateScores {
  gmat?: number | null;
  gre?: number | null;
  cat?: number | null;

  x_percentage?: number | null;
  xii_percentage?: number | null;
  ug_cgpa?: number | null;

  other_tests?: string | null;

  test_score_raw?: string;
  test_score_numeric?: number | null;

  undergrad_gpa_raw?: string;
}

export interface CandidateConstraints {
  budget_level?: "low" | "medium" | "high";
  prefers_one_year?: boolean;
  open_to_abroad?: boolean;

  max_tuition_in_lakhs?: number | null;
  scholarship_need?: "none" | "helpful" | "strong-need";

  risk_tolerance?: "safe" | "balanced" | "aggressive";

  max_budget_total?: number | null;

  flexible_budget?: boolean;
  flexible_geography?: boolean;
  flexible_risk?: boolean;
  flexible_program_length?: boolean;
}

export interface CandidateGoals {
  short_term?: string;
  long_term?: string;

  target_functions?: string[];
  target_industries?: string[];

  post_mba_goal?: string;
  why_mba_now?: string;
}

export interface CandidateProfile {
  name?: string;
  email?: string;

  mode?: BschoolMatchMode;

  current_role?: string;
  current_company?: string;

  total_work_experience_years?: number;
  managerial_experience_years?: number;
  has_international_experience?: boolean;

  undergrad_degree?: string;
  undergrad_institution?: string;
  undergrad_grad_year?: number | null;

  scores?: CandidateScores;

  target_intake_year?: number | null;

  preferred_regions?: string[];
  preferred_program_types?: string[];

  constraints?: CandidateConstraints;
  goals?: CandidateGoals;

  resume_text?: string;
  resume_summary?: string;
  resume_analysis?: any;

  extra_context?: string;
}

// =============================
// Match result structures (✅ align with Python backend)
// =============================

export interface BschoolTierCluster {
  dream: string[];
  competitive: string[];
  safe: string[];
}

export interface BschoolMatchSchool {
  id: string;

  school_name: string;
  program_name: string;

  country: string;
  region: string;

  program_type: string;

  // Python uses these tiers
  tier: "ambitious" | "target" | "safe";

  duration_years: number;

  notes: string;
  risks: string;

  fit_scores: {
    academic_fit: number;
    career_outcomes_fit: number;
    geography_fit: number;
    brand_prestige: number;
    roi_affordability: number;
    culture_personal_fit: number;
  };
}

export interface BschoolMatchSchoolDisplay extends BschoolMatchSchool {
  name: string; // alias for school_name
  overall_match_score: number; // computed
  reasons?: string[]; // derived
}

export interface BschoolMatchSummary {
  profile_snapshot: string;
  target_strategy: string;
  key_factors: string[];

  // legacy optional
  headline?: string;
  narrative?: string;
  risk_profile?: "safe" | "balanced" | "aggressive";
  key_drivers?: string[];
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
    pipeline_version?: string;
    llm_status?: string;
    model_used?: string;
    latency_seconds?: number;
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
  | "textarea"
  | "text"; // ✅ included to prevent TS2322 in questions.ts

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
  mode: BschoolMatchMode;
  profile: CandidateProfile;
  raw_answers?: QuestionAnswerMap;
  profile_resume_report?: any;
}

// =============================
// Helper functions
// =============================

export function toDisplaySchool(
  school: BschoolMatchSchool
): BschoolMatchSchoolDisplay {
  const fit = school.fit_scores;

  const overall_match_score = Math.round(
    (fit.academic_fit +
      fit.career_outcomes_fit +
      fit.geography_fit +
      fit.brand_prestige +
      fit.roi_affordability +
      fit.culture_personal_fit) / 6
  );

  const reasons = school.notes
    ? school.notes
        .split(/[.\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10)
        .slice(0, 3)
    : [];

  return {
    ...school,
    name: school.school_name,
    overall_match_score,
    reasons,
  };
}

export function mapTierForDisplay(
  tier: "ambitious" | "target" | "safe"
): "dream" | "competitive" | "safe" {
  switch (tier) {
    case "ambitious":
      return "dream";
    case "target":
      return "competitive";
    case "safe":
      return "safe";
    default:
      return "competitive";
  }
}
