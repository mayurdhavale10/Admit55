import React from "react";

type PreferencesValues = {
  tone_preference?: "conservative" | "balanced" | "aggressive";
  length_preference?: "one_page" | "two_page" | "auto";
  highlight_skills?: boolean;
  emphasize_leadership?: boolean;
  include_summary?: boolean;
  additional_notes?: string;
};

type PreferencesErrors = Partial<Record<keyof PreferencesValues, string>>;

type StepPreferencesProps = {
  value: PreferencesValues;
  errors?: PreferencesErrors;
  onChange: (updates: Partial<PreferencesValues>) => void;
  onNext: () => void;
  onBack?: () => void;
  disableNext?: boolean;
  isSubmitting?: boolean;
};

export default function StepPreferences({
  value,
  errors,
  onChange,
  onNext,
  onBack,
  disableNext,
  isSubmitting,
}: StepPreferencesProps) {
  const handleChange =
    (field: keyof PreferencesValues) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
        | React.ChangeEvent<HTMLSelectElement>
    ) => {
      if (e.target.type === "checkbox") {
        onChange({ [field]: (e.target as HTMLInputElement).checked });
      } else {
        onChange({ [field]: e.target.value });
      }
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
          Step 6 — Resume Preferences
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Customize how your resume should be formatted and what aspects to
          emphasize. These preferences help tailor the final output to your
          target roles.
        </p>
      </div>

      {/* Tone Preference */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm px-4 py-4 md:px-5 md:py-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              1
            </span>
            Writing Tone
          </h3>
          <p className="mt-1 text-xs text-slate-500 ml-8">
            How assertive should the language be in your bullet points?
          </p>
        </div>

        <div className="space-y-3 ml-8">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="radio"
              name="tone"
              value="conservative"
              checked={value.tone_preference === "conservative"}
              onChange={handleChange("tone_preference")}
              className="mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <div>
              <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                Conservative
              </div>
              <div className="text-xs text-slate-600">
                Traditional, understated language. Best for formal sectors like
                banking, consulting, or law.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="radio"
              name="tone"
              value="balanced"
              checked={value.tone_preference === "balanced"}
              onChange={handleChange("tone_preference")}
              className="mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <div>
              <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                Balanced (Recommended)
              </div>
              <div className="text-xs text-slate-600">
                Confident yet professional. Suitable for most MBA recruiting
                scenarios.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="radio"
              name="tone"
              value="aggressive"
              checked={value.tone_preference === "aggressive"}
              onChange={handleChange("tone_preference")}
              className="mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <div>
              <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                Aggressive
              </div>
              <div className="text-xs text-slate-600">
                Bold, action-oriented language. Best for startups, tech, or
                entrepreneurial roles.
              </div>
            </div>
          </label>
        </div>
        {errors?.tone_preference && (
          <p className="mt-2 text-xs text-red-600 ml-8">
            {errors.tone_preference}
          </p>
        )}
      </div>

      {/* Length Preference */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm px-4 py-4 md:px-5 md:py-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              2
            </span>
            Resume Length
          </h3>
          <p className="mt-1 text-xs text-slate-500 ml-8">
            How long should your resume be?
          </p>
        </div>

        <div className="space-y-3 ml-8">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="radio"
              name="length"
              value="one_page"
              checked={value.length_preference === "one_page"}
              onChange={handleChange("length_preference")}
              className="mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <div>
              <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                One Page
              </div>
              <div className="text-xs text-slate-600">
                Concise format, ideal for early-career professionals (0–5
                years).
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="radio"
              name="length"
              value="auto"
              checked={value.length_preference === "auto"}
              onChange={handleChange("length_preference")}
              className="mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <div>
              <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                Auto (Recommended)
              </div>
              <div className="text-xs text-slate-600">
                Let the system decide based on your experience level and
                content.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="radio"
              name="length"
              value="two_page"
              checked={value.length_preference === "two_page"}
              onChange={handleChange("length_preference")}
              className="mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <div>
              <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                Two Pages
              </div>
              <div className="text-xs text-slate-600">
                More detailed format for experienced professionals (5+ years).
              </div>
            </div>
          </label>
        </div>
        {errors?.length_preference && (
          <p className="mt-2 text-xs text-red-600 ml-8">
            {errors.length_preference}
          </p>
        )}
      </div>

      {/* Emphasis Options */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm px-4 py-4 md:px-5 md:py-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              3
            </span>
            Content Emphasis
          </h3>
          <p className="mt-1 text-xs text-slate-500 ml-8">
            What should the resume highlight prominently?
          </p>
        </div>

        <div className="space-y-3 ml-8">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={value.include_summary ?? true}
              onChange={handleChange("include_summary")}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <div>
              <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                Include Professional Summary
              </div>
              <div className="text-xs text-slate-600">
                Add a 2–3 sentence summary at the top highlighting your
                background and goals.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={value.highlight_skills ?? false}
              onChange={handleChange("highlight_skills")}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <div>
              <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                Highlight Technical Skills
              </div>
              <div className="text-xs text-slate-600">
                Place skills section prominently near the top of the resume.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={value.emphasize_leadership ?? false}
              onChange={handleChange("emphasize_leadership")}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <div>
              <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                Emphasize Leadership & Extracurriculars
              </div>
              <div className="text-xs text-slate-600">
                Give more space and prominence to leadership roles and
                activities.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm px-4 py-4 md:px-5 md:py-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              4
            </span>
            Additional Instructions
          </h3>
          <p className="mt-1 text-xs text-slate-500 ml-8">
            Any specific requests or notes for the resume generator?
          </p>
        </div>

        <div className="ml-8">
          <textarea
            value={value.additional_notes || ""}
            onChange={handleChange("additional_notes")}
            rows={4}
            placeholder={
              "Optional: Add any specific instructions...\n" +
              "Examples:\n" +
              "• Please emphasize my experience in renewable energy projects\n" +
              "• Focus on quantitative achievements and data-driven results\n" +
              "• Use action verbs suitable for consulting roles"
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
          />
          {errors?.additional_notes && (
            <p className="mt-1 text-xs text-red-600">
              {errors.additional_notes}
            </p>
          )}
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
              Continue to Review
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