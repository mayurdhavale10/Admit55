// src/app/mba/tools/bschool-match/components/questions.ts
import { BschoolQuestion } from "@src/lib/bschoolmatch/types";

/**
 * Two-mode system:
 * - "questions-only"   => Quick Profile Form
 * - "resume-upload"    => Upload Resume + Required Questions + Optional Questions
 */

export const LOCATION_OPTIONS = [
  { label: "No preference", value: "no_preference" },
  { label: "US", value: "us" },
  { label: "Europe / UK", value: "europe_uk" },
  { label: "Canada", value: "canada" },
  { label: "Middle East", value: "middle_east" },
  { label: "India", value: "india" },
  { label: "Singapore / Asia", value: "singapore_asia" },
  { label: "Other", value: "other" },
];

export const TEST_STATUS_OPTIONS = [
  { label: "Have a score", value: "have_score" },
  { label: "Planning to take", value: "planning" },
  { label: "Waiver / Not taking", value: "waiver" },
];

export const TEST_TYPE_OPTIONS = [
  { label: "GMAT", value: "gmat" },
  { label: "GRE", value: "gre" },
  { label: "CAT", value: "cat" },
];

export const YES_NO = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

export const INDUSTRY_OPTIONS = [
  { label: "Consulting", value: "consulting" },
  { label: "Technology", value: "technology" },
  { label: "Finance / Banking", value: "finance" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Manufacturing", value: "manufacturing" },
  { label: "Non-profit", value: "non_profit" },
  { label: "Government", value: "government" },
  { label: "Other", value: "other" },
];

export const SCHOOL_LOCATION_OPTIONS = [
  { label: "No preference", value: "no_preference" },
  { label: "US - East Coast", value: "us_east" },
  { label: "US - West Coast", value: "us_west" },
  { label: "US - Midwest", value: "us_midwest" },
  { label: "US - South", value: "us_south" },
  { label: "Europe / UK", value: "europe_uk" },
  { label: "Canada", value: "canada" },
  { label: "Asia", value: "asia" },
  { label: "Other", value: "other" },
];

export const BUDGET_OPTIONS = [
  { label: "No constraint", value: "no_constraint" },
  { label: "Need significant financial aid", value: "need_aid" },
  { label: "Prefer lower tuition", value: "lower_tuition" },
  { label: "Prefer 1-year programs (lower cost)", value: "prefer_1_year" },
];

export const PROGRAM_LENGTH_OPTIONS = [
  { label: "No preference", value: "no_preference" },
  { label: "1-year MBA", value: "1_year" },
  { label: "2-year MBA", value: "2_year" },
  { label: "Part-time / Executive MBA", value: "pt_emba" },
];

export const CLASS_SIZE_OPTIONS = [
  { label: "No preference", value: "no_preference" },
  { label: "Small (< 200)", value: "small" },
  { label: "Medium (200-500)", value: "medium" },
  { label: "Large (500+)", value: "large" },
];

export const LEARNING_STYLE_OPTIONS = [
  { label: "No preference", value: "no_preference" },
  { label: "Case method (discussion-based)", value: "case" },
  { label: "Lecture-based", value: "lecture" },
  { label: "Mix of both", value: "mix" },
];

export const CULTURE_OPTIONS = [
  { label: "No preference", value: "no_preference" },
  { label: "Collaborative", value: "collaborative" },
  { label: "Competitive", value: "competitive" },
  { label: "Entrepreneurial", value: "entrepreneurial" },
];

export const RESUME_REQUIRED_QUESTIONS: BschoolQuestion[] = [
  {
    id: "target_role",
    label: "Target Role",
    type: "text",
    required: true,
    placeholder: "e.g., Strategy Consultant, Product Manager, Investment Banker",
  },
  {
    id: "target_industry",
    label: "Target Industry",
    type: "text",
    required: true,
    placeholder: "e.g., Technology, Healthcare, Finance, CPG",
  },
  {
    id: "preferred_work_location",
    label: "Preferred Work Location",
    type: "single-select",
    required: true,
    options: LOCATION_OPTIONS,
  },
  {
    id: "test_status",
    label: "GMAT / GRE Status",
    type: "single-select",
    required: true,
    options: TEST_STATUS_OPTIONS,
    helperText: 'If "Have a score", we’ll ask for test type + score.',
  },
];

// Only shown when test_status === "have_score"
export const RESUME_TEST_DETAILS: BschoolQuestion[] = [
  {
    id: "test_type",
    label: "Test Type",
    type: "single-select",
    required: true,
    options: TEST_TYPE_OPTIONS,
  },
  {
    id: "test_score",
    label: "Actual Score",
    type: "number",
    required: true,
    placeholder: "e.g., 720 (GMAT) or 330 (GRE)",
    helperText: "GMAT: 200–800 • GRE: 260–340 • CAT: enter percentile (0–100)",
    min: 0,
    max: 800,
  },
];

export const RESUME_OPTIONAL_QUESTIONS: BschoolQuestion[] = [
  // Academic
  {
    id: "undergrad_gpa",
    label: "Undergraduate GPA (0.0 - 4.0)",
    type: "number",
    required: false,
    min: 0,
    max: 4,
    step: 0.1,
    placeholder: "e.g., 3.6",
  },

  // Professional
  {
    id: "years_work_experience",
    label: "Years of Work Experience",
    type: "number",
    required: false,
    min: 0,
    max: 40,
    placeholder: "e.g., 5",
  },
  {
    id: "current_industry",
    label: "Current Industry",
    type: "single-select",
    required: false,
    options: INDUSTRY_OPTIONS,
  },
  {
    id: "current_role",
    label: "Current Role / Function",
    type: "text",
    required: false,
    placeholder: "e.g., Senior Product Manager",
  },
  {
    id: "managed_teams",
    label: "Have you managed people or teams?",
    type: "single-select",
    required: false,
    options: YES_NO,
  },

  // Career goals
  {
    id: "switching_careers",
    label: "Are you switching careers?",
    type: "single-select",
    required: false,
    options: YES_NO,
  },
  {
    id: "career_switch_from_to",
    label: "If yes: From what → to what?",
    type: "text",
    required: false,
    placeholder: "e.g., Product Management → Investment Banking",
    helperText: 'Only fill if you selected "Yes" above.',
  },

  // Personal context
  {
    id: "nationality",
    label: "Nationality (optional)",
    type: "text",
    required: false,
    placeholder: "e.g., India",
  },
  {
    id: "preferred_school_location",
    label: "Preferred School Location",
    type: "single-select",
    required: false,
    options: SCHOOL_LOCATION_OPTIONS,
  },
  {
    id: "budget_consideration",
    label: "Budget Consideration",
    type: "single-select",
    required: false,
    options: BUDGET_OPTIONS,
  },

  // Program preferences
  {
    id: "program_length_preference",
    label: "Program Length Preference",
    type: "single-select",
    required: false,
    options: PROGRAM_LENGTH_OPTIONS,
  },
  {
    id: "class_size_preference",
    label: "Class Size Preference",
    type: "single-select",
    required: false,
    options: CLASS_SIZE_OPTIONS,
  },
  {
    id: "learning_style_preference",
    label: "Learning Style Preference",
    type: "single-select",
    required: false,
    options: LEARNING_STYLE_OPTIONS,
  },
  {
    id: "culture_preference",
    label: "Culture Preference",
    type: "single-select",
    required: false,
    options: CULTURE_OPTIONS,
  },

  // Calibration
  {
    id: "schools_already_considering",
    label: "Any specific schools you're already considering?",
    type: "textarea",
    required: false,
    placeholder: "e.g., INSEAD, LBS, ISB, Kellogg...",
  },
];

export const QUICK_PROFILE_REQUIRED_QUESTIONS: BschoolQuestion[] = [
  {
    id: "years_work_experience",
    label: "Years of Work Experience",
    type: "number",
    required: true,
    min: 0,
    max: 40,
    placeholder: "e.g., 5",
  },
  {
    id: "current_role",
    label: "Current / Most Recent Role",
    type: "text",
    required: true,
    placeholder: "e.g., Senior Product Manager",
  },
  {
    id: "key_achievements",
    label: "Key Achievements (3 bullet points)",
    type: "textarea",
    required: true,
    placeholder: "• Led product launch that generated $2M revenue\n• Managed team of 8 across 3 geographies\n• Increased engagement by 40%",
  },
  {
    id: "leadership_experience",
    label: "Leadership Experience",
    type: "textarea",
    required: true,
    placeholder: "Describe your leadership roles and impact",
  },
  {
    id: "international_exposure",
    label: "International Exposure",
    type: "single-select",
    required: true,
    options: YES_NO,
  },
  {
    id: "education_degree",
    label: "Education - Degree",
    type: "text",
    required: true,
    placeholder: "e.g., B.Tech in Computer Science",
  },
  {
    id: "education_institution",
    label: "Education - Institution",
    type: "text",
    required: true,
    placeholder: "e.g., IIT Delhi",
  },

  // still ask the core 4
  ...RESUME_REQUIRED_QUESTIONS,
];
