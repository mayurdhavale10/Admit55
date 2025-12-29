"use client";

import { useMemo, useState } from "react";
import {
  BSCHOOL_MATCH_MODES,
  BschoolMatchMode,
  QuestionAnswerMap,
  BschoolQuestion,
} from "@src/lib/bschoolmatch/types";

import QuestionField from "./QuestionField";

export interface MatchFormProps {
  mode: BschoolMatchMode;
  isSubmitting: boolean;
  onSubmit: (payload: {
    answers: QuestionAnswerMap;
    resumeFile: File | null;
  }) => Promise<void>;
}

// ----------------------
// Question banks
// ----------------------

const REQUIRED_CORE: BschoolQuestion[] = [
  {
    id: "target_role",
    label: "Target Role *",
    helperText: "e.g., Strategy Consultant, Product Manager, Investment Banker",
    type: "textarea",
    required: true,
    placeholder: "e.g., Product Manager",
  },
  {
    id: "target_industry",
    label: "Target Industry *",
    helperText: "e.g., Technology, Healthcare, Finance, CPG",
    type: "textarea",
    required: true,
    placeholder: "e.g., Technology",
  },
  {
    id: "preferred_work_location",
    label: "Location Preference *",
    type: "single-select",
    required: true,
    options: [
      { value: "no_preference", label: "No preference" },
      { value: "india", label: "India" },
      { value: "us", label: "United States" },
      { value: "europe", label: "Europe" },
      { value: "uk", label: "UK" },
      { value: "canada", label: "Canada" },
      { value: "asia", label: "Asia (ex-India)" },
      { value: "middle_east", label: "Middle East" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "test_status",
    label: "GMAT / GRE Status *",
    type: "single-select",
    required: true,
    options: [
      { value: "have_score", label: "Have a score" },
      { value: "planning", label: "Planning to take" },
      { value: "waiver", label: "Waiver / Not taking" },
    ],
  },
  // only show if have_score
  {
    id: "test_type",
    label: "Test Type *",
    type: "single-select",
    required: true,
    options: [
      { value: "gmat", label: "GMAT" },
      { value: "gre", label: "GRE" },
      { value: "cat", label: "CAT (India)" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "actual_score",
    label: "Actual Score *",
    helperText: "e.g., GMAT 720",
    type: "number",
    required: true,
    min: 0,
    max: 800,
  },
];

const QUICK_PROFILE_REQUIRED: BschoolQuestion[] = [
  {
    id: "total_experience",
    label: "Years of Work Experience *",
    helperText: "e.g., 5",
    type: "number",
    required: true,
    min: 0,
    max: 40,
  },
  {
    id: "current_role",
    label: "Current / Most Recent Role *",
    helperText: "e.g., Senior Product Manager",
    type: "textarea",
    required: true,
    placeholder: "e.g., Senior Product Manager",
  },
  {
    id: "key_achievements",
    label: "Key Achievements (3 bullet points) *",
    helperText: "Use bullets like: • Led X • Built Y • Improved Z",
    type: "textarea",
    required: true,
    placeholder:
      "• Led product launch that generated $2M revenue\n• Managed team of 8 across 3 geographies\n• Increased user engagement by 40%",
  },
  {
    id: "leadership_experience",
    label: "Leadership Experience *",
    helperText: "Describe leadership roles and impact",
    type: "textarea",
    required: true,
    placeholder: "Team size, cross-functional leadership, mentoring, etc.",
  },
  {
    id: "international_exposure",
    label: "International Exposure",
    type: "single-select",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "education_degree",
    label: "Education - Degree *",
    helperText: "e.g., B.Tech in Computer Science",
    type: "textarea",
    required: true,
    placeholder: "e.g., B.Tech in Computer Science",
  },
  {
    id: "education_institution",
    label: "Education - Institution *",
    helperText: "e.g., IIT Delhi",
    type: "textarea",
    required: true,
    placeholder: "e.g., IIT Delhi",
  },
];

const OPTIONAL_RECOMMENDED: BschoolQuestion[] = [
  {
    id: "post_mba_goal",
    label: "Post-MBA Goals",
    type: "textarea",
    placeholder: "What do you want immediately after MBA and 5–10 years later?",
  },
  {
    id: "why_mba_now",
    label: "Why MBA now?",
    type: "textarea",
    placeholder: "Briefly explain why now is the right time.",
  },
  {
    id: "preferred_program_type",
    label: "Program Type Preference",
    type: "single-select",
    options: [
      { value: "no_preference", label: "No preference" },
      { value: "two_year", label: "2-year MBA" },
      { value: "one_year", label: "1-year MBA" },
      { value: "exec", label: "Executive MBA" },
    ],
  },
  {
    id: "risk_tolerance",
    label: "Risk Tolerance",
    type: "single-select",
    options: [
      { value: "safe", label: "Safe (more targets/safes)" },
      { value: "balanced", label: "Balanced" },
      { value: "aggressive", label: "Aggressive (more ambitious)" },
    ],
  },
  {
    id: "schools_already_considering",
    label: "Schools you’re already considering",
    type: "textarea",
    placeholder: "e.g., ISB, INSEAD, LBS, Wharton…",
  },
];

// ----------------------
// Helpers
// ----------------------

function isFilled(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

export default function MatchForm({ mode, isSubmitting, onSubmit }: MatchFormProps) {
  const [answers, setAnswers] = useState<QuestionAnswerMap>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Optional section: ALWAYS show the header text; allow hide/show fields
  const [showOptional, setShowOptional] = useState(true);

  const testStatus = String(answers.test_status ?? "");
  const hasScore = testStatus === "have_score";

  const showQuickProfile = mode === BSCHOOL_MATCH_MODES.QUICK_PROFILE;
  const showResumeUpload = mode === BSCHOOL_MATCH_MODES.RESUME_UPLOAD;

  const visibleCore = useMemo(() => {
    return REQUIRED_CORE.filter((q) => {
      if (q.id === "test_type" || q.id === "actual_score") return hasScore;
      return true;
    });
  }, [hasScore]);

  const requiredBlock = useMemo(() => {
    return showQuickProfile ? QUICK_PROFILE_REQUIRED : [];
  }, [showQuickProfile]);

  const missingRequired = useMemo(() => {
    const missing: string[] = [];

    // Resume required only in resume-upload mode
    if (showResumeUpload && !resumeFile) missing.push("Resume / CV");

    // Core required
    for (const q of visibleCore) {
      if (q.required && !isFilled(answers[q.id])) missing.push(q.label);
    }

    // Quick profile required
    for (const q of requiredBlock) {
      if (q.required && !isFilled(answers[q.id])) missing.push(q.label);
    }

    return missing;
  }, [answers, visibleCore, requiredBlock, showResumeUpload, resumeFile]);

  const canSubmit = missingRequired.length === 0 && !isSubmitting;

  const handleAnswerChange = (id: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setResumeFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add simple compatibility fields (optional)
    const finalAnswers: QuestionAnswerMap = { ...answers };

    // Build a "test_score" string if you want legacy support downstream
    if (!isFilled(finalAnswers.test_score) && hasScore) {
      const tt = String(finalAnswers.test_type ?? "").toUpperCase();
      const sc = finalAnswers.actual_score;
      if (tt && isFilled(sc)) finalAnswers.test_score = `${tt} ${sc}`;
    }

    await onSubmit({
      answers: finalAnswers,
      resumeFile: showResumeUpload ? resumeFile : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          {showResumeUpload ? "Upload Resume + Questions" : "Quick Profile Form"}
        </h2>
        <p className="text-sm text-slate-600">
          {showResumeUpload
            ? "Upload your résumé and answer a few questions to improve match accuracy."
            : "No résumé needed. Answer the quick profile questions to get strong matches."}
        </p>

        {/* Resume upload */}
        {showResumeUpload && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <label className="block text-sm font-semibold text-slate-900">
              Resume / CV <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              disabled={isSubmitting}
              className="mt-2 block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50"
            />
            {resumeFile && (
              <p className="mt-2 text-xs text-slate-600">Selected: {resumeFile.name}</p>
            )}
          </div>
        )}

        {/* Quick profile required block */}
        {showQuickProfile && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Quick Profile</h3>
            {requiredBlock.map((q) => (
              <QuestionField
                key={q.id}
                question={q}
                value={answers[q.id]}
                onChange={handleAnswerChange}
              />
            ))}
          </div>
        )}

        {/* Core required questions */}
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Required (Improves match quality)
          </h3>
          {visibleCore.map((q) => (
            <QuestionField
              key={q.id}
              question={q}
              value={answers[q.id]}
              onChange={handleAnswerChange}
            />
          ))}
        </div>

        {/* Optional recommended section (always show header) */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Optional (Recommended)
              </h3>
              <p className="mt-0.5 text-xs text-slate-600">
                Answering these improves match accuracy and strategy depth.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowOptional((s) => !s)}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              {showOptional ? "Hide optional" : "Show optional"}
            </button>
          </div>

          {showOptional && (
            <div className="mt-4 space-y-3">
              {OPTIONAL_RECOMMENDED.map((q) => (
                <QuestionField
                  key={q.id}
                  question={q}
                  value={answers[q.id]}
                  onChange={handleAnswerChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* Missing required warning */}
        {missingRequired.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="text-sm font-semibold">Please complete required fields:</p>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {missingRequired.slice(0, 12).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors duration-200
              ${canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}
          >
            {isSubmitting ? "Finding Your Matches..." : "Find My B-School Matches"}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span>🔒</span>
          <span>Your data is secure and confidential. We never share your information.</span>
        </div>
      </div>
    </form>
  );
}
