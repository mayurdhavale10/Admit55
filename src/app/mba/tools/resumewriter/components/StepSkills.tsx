import React from "react";

type SkillsValues = {
  technical_skills?: string;
  soft_skills?: string;
  languages?: string;
  certifications?: string;
  tools_software?: string;
};

type SkillsErrors = Partial<Record<keyof SkillsValues, string>>;

type StepSkillsProps = {
  value: SkillsValues;
  errors?: SkillsErrors;
  onChange: (updates: Partial<SkillsValues>) => void;
  onNext: () => void;
  onBack?: () => void;
  disableNext?: boolean;
  isSubmitting?: boolean;
};

export default function StepSkills({
  value,
  errors,
  onChange,
  onNext,
  onBack,
  disableNext,
  isSubmitting,
}: StepSkillsProps) {
  const handleChange =
    (field: keyof SkillsValues) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange({ [field]: e.target.value });
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableNext && !isSubmitting) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Step 4 — Skills & Certifications
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Highlight your technical expertise, soft skills, languages, and
          certifications. This helps recruiters quickly understand your
          capabilities.
        </p>
      </div>

      {/* Main form */}
      <div className="space-y-5">
        {/* Technical Skills */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm px-4 py-4 md:px-5 md:py-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                1
              </span>
              Technical Skills
            </h3>
            <p className="mt-1 text-xs text-slate-500 ml-8">
              Programming languages, frameworks, databases, analytics tools,
              etc.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Technical Skills (comma-separated or multi-line)
            </label>
            <textarea
              value={value.technical_skills || ""}
              onChange={handleChange("technical_skills")}
              rows={4}
              placeholder={
                "Python, SQL, Tableau, Power BI, Advanced Excel\n" +
                "Financial Modeling, Valuation (DCF, Comparable Company Analysis)\n" +
                "Data Analysis & Visualization, Machine Learning (scikit-learn, TensorFlow)"
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
            />
            {errors?.technical_skills && (
              <p className="mt-1 text-xs text-red-600">
                {errors.technical_skills}
              </p>
            )}
          </div>
        </div>

        {/* Soft Skills */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm px-4 py-4 md:px-5 md:py-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                2
              </span>
              Soft Skills & Competencies
            </h3>
            <p className="mt-1 text-xs text-slate-500 ml-8">
              Leadership, communication, problem-solving, teamwork, etc.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Soft Skills (comma-separated)
            </label>
            <textarea
              value={value.soft_skills || ""}
              onChange={handleChange("soft_skills")}
              rows={3}
              placeholder="Strategic Thinking, Cross-functional Collaboration, Stakeholder Management, Project Management, Problem Solving, Communication"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
            />
            {errors?.soft_skills && (
              <p className="mt-1 text-xs text-red-600">{errors.soft_skills}</p>
            )}
          </div>
        </div>

        {/* Languages */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm px-4 py-4 md:px-5 md:py-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                3
              </span>
              Languages
            </h3>
            <p className="mt-1 text-xs text-slate-500 ml-8">
              Specify proficiency level (e.g., native, fluent, intermediate).
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Languages & Proficiency
            </label>
            <textarea
              value={value.languages || ""}
              onChange={handleChange("languages")}
              rows={2}
              placeholder="English (Native), Hindi (Fluent), Spanish (Intermediate)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
            />
            {errors?.languages && (
              <p className="mt-1 text-xs text-red-600">{errors.languages}</p>
            )}
          </div>
        </div>

        {/* Certifications */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm px-4 py-4 md:px-5 md:py-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                4
              </span>
              Certifications & Licenses
            </h3>
            <p className="mt-1 text-xs text-slate-500 ml-8">
              Professional certifications, licenses, or credentials.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Certifications (one per line)
            </label>
            <textarea
              value={value.certifications || ""}
              onChange={handleChange("certifications")}
              rows={4}
              placeholder={
                "CFA Level I Candidate (expected Dec 2025)\n" +
                "Google Data Analytics Professional Certificate\n" +
                "Project Management Professional (PMP)\n" +
                "Six Sigma Green Belt"
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
            />
            {errors?.certifications && (
              <p className="mt-1 text-xs text-red-600">
                {errors.certifications}
              </p>
            )}
          </div>
        </div>

        {/* Tools & Software */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm px-4 py-4 md:px-5 md:py-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                5
              </span>
              Tools & Software
            </h3>
            <p className="mt-1 text-xs text-slate-500 ml-8">
              Specific tools, platforms, or software you're proficient in.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tools & Software (comma-separated)
            </label>
            <textarea
              value={value.tools_software || ""}
              onChange={handleChange("tools_software")}
              rows={3}
              placeholder="SAP, Salesforce, JIRA, Confluence, Bloomberg Terminal, Microsoft Office Suite, Google Workspace, Slack"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
            />
            {errors?.tools_software && (
              <p className="mt-1 text-xs text-red-600">
                {errors.tools_software}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Helper text */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="text-xs font-semibold text-blue-900 mb-1">
              Tips for This Section
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>
                • Be specific — list actual tools/languages rather than generic
                terms
              </li>
              <li>
                • Prioritize skills most relevant to your target MBA recruiting
                path
              </li>
              <li>
                • For certifications, include completion dates or "in progress"
                status
              </li>
              <li>
                • Group similar skills together for easier reading (e.g., all
                analytics tools)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="pt-4 flex items-center justify-between">
        <div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.6}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={disableNext || isSubmitting}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all ${
            disableNext || isSubmitting
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-slate-900 hover:bg-slate-800"
          }`}
        >
          {isSubmitting ? (
            <>
              <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Continue
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}