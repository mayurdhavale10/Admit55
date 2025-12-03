// src/lib/bschoolmatch/questionBank.ts

import type { BschoolQuestion } from "./types";

export const BSMATCH_QUESTIONS: BschoolQuestion[] = [
  {
    id: "current_profile",
    label: "What best describes your current profile?",
    helperText: "We use this to understand your starting point and context.",
    type: "single-select",
    required: true,
    options: [
      { value: "student", label: "Final-year student / recent graduate" },
      { value: "early_professional", label: "0–3 years work experience" },
      { value: "mid_career", label: "3–7 years work experience" },
      { value: "senior", label: "7+ years work experience" },
      { value: "entrepreneur", label: "Entrepreneur / startup founder" },
    ],
  },
  {
    id: "total_experience",
    label: "Total full-time work experience (in years)",
    helperText:
      "Round to the nearest number. Exclude internships unless they were full-time and long-term.",
    type: "slider",
    required: true,
    min: 0,
    max: 15,
    step: 0.5,
  },
  {
    id: "has_managerial_experience",
    label: "Have you directly managed people or led teams?",
    type: "single-select",
    options: [
      { value: "no", label: "No" },
      { value: "informal", label: "Informal / project-based leadership" },
      { value: "formal", label: "Yes, formal people management" },
    ],
  },
  {
    id: "target_intake_year",
    label: "Target intake year for MBA / PGDM",
    helperText: "For example: 2026 or 2027.",
    type: "number",
    required: true,
    min: 2025,
    max: 2030,
  },
  {
    id: "preferred_regions",
    label: "Preferred study regions",
    helperText: "You can select multiple regions you’re open to.",
    type: "multi-select",
    required: true,
    options: [
      { value: "india", label: "India" },
      { value: "europe", label: "Europe (incl. UK)" },
      { value: "us", label: "United States" },
      { value: "canada", label: "Canada" },
      { value: "asia", label: "Other Asia (e.g. Singapore, HK)" },
      { value: "anywhere", label: "Open to any strong program" },
    ],
  },
  {
    id: "preferred_program_types",
    label: "Program type preference",
    helperText: "You can pick more than one.",
    type: "multi-select",
    options: [
      { value: "2-year", label: "2-year full-time MBA" },
      { value: "1-year", label: "1-year full-time MBA / PGP" },
      { value: "executive", label: "Executive / Part-time MBA" },
      { value: "online", label: "Online / Hybrid programs" },
    ],
  },
  {
    id: "test_status",
    label: "Standardized test status",
    helperText:
      "Share your GMAT / GRE / CAT status so we can calibrate Dream / Competitive / Safe.",
    type: "single-select",
    options: [
      { value: "not_taken", label: "Not taken yet" },
      { value: "planning", label: "Planning to take (no score yet)" },
      { value: "taken_mid", label: "Taken – average score" },
      { value: "taken_strong", label: "Taken – strong score" },
    ],
  },
  {
    id: "budget_level",
    label: "Budget comfort for tuition (excluding living costs)",
    type: "single-select",
    options: [
      { value: "low", label: "Budget-sensitive – prefer lower fee programs" },
      { value: "medium", label: "Balanced – open to mid-range fees" },
      {
        value: "high",
        label: "Comfortable with premium / global program fees",
      },
    ],
  },
  {
    id: "risk_tolerance",
    label: "How aggressive do you want your B-school list to be?",
    helperText:
      "‘Aggressive’ = more Dream schools, ‘Safe’ = more achievable options.",
    type: "single-select",
    options: [
      { value: "safe", label: "More safe / achievable options" },
      { value: "balanced", label: "Balanced mix of all three" },
      { value: "aggressive", label: "Heavier on Dream schools" },
    ],
  },
  {
    id: "career_goals_short",
    label: "Short-term post-MBA goal (2–3 lines)",
    helperText:
      "Example: ‘Move from software engineering into product management at a global tech company’.",
    type: "textarea",
    required: true,
    placeholder: "Describe your target role, geography and industry...",
  },
  {
    id: "career_goals_long",
    label: "Long-term vision (optional, 2–3 lines)",
    helperText:
      "Example: ‘Build my own fintech startup focused on SME lending in India’.",
    type: "textarea",
    placeholder: "Optional but very helpful for fine-tuning matches...",
  },
] as const;
