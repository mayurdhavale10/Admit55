import React from "react";

type ExperienceItem = {
  company?: string;
  role?: string;
  location?: string;
  start_month?: string;
  start_year?: string;
  end_month?: string;
  end_year?: string;
  is_current?: boolean;
  bullets?: string; // multi-line, each line one bullet
  impact_summary?: string;
};

type ExperienceErrors = Array<Partial<Record<keyof ExperienceItem, string>>>;

type StepExperienceProps = {
  value: ExperienceItem[];
  errors?: ExperienceErrors;
  onChange: (nextValue: ExperienceItem[]) => void;
  onNext: () => void;
  onBack?: () => void;
  disableNext?: boolean;
  isSubmitting?: boolean;
};

export default function StepExperience({
  value,
  errors,
  onChange,
  onNext,
  onBack,
  disableNext,
  isSubmitting,
}: StepExperienceProps) {
  const handleItemChange =
    (index: number, field: keyof ExperienceItem) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
        | React.ChangeEvent<HTMLSelectElement>
    ) => {
      const next = [...value];
      next[index] = {
        ...next[index],
        [field]:
          e.target.type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : e.target.value,
      };
      onChange(next);
    };

  const addExperience = () => {
    const next = [
      ...value,
      {
        company: "",
        role: "",
        location: "",
        start_month: "",
        start_year: "",
        end_month: "",
        end_year: "",
        is_current: false,
        bullets: "",
        impact_summary: "",
      },
    ];
    onChange(next);
  };

  const removeExperience = (index: number) => {
    if (value.length === 1) return; // keep at least one
    const next = value.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableNext && !isSubmitting) {
      onNext();
    }
  };

  const hasMultiple = value.length > 1;

  const monthOptions = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Step 3 — Work Experience
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add your professional roles with impact-focused bullet points. We’ll
          convert this into a strong MBA-ready experience section.
        </p>
      </div>

      {/* Experience blocks */}
      <div className="space-y-5">
        {value.map((item, index) => {
          const itemErrors = errors?.[index] || {};
          return (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm px-4 py-4 md:px-5 md:py-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Experience {index + 1}
                    </p>
                    <p className="text-xs text-slate-500">
                      Current or past full-time role, internship, or part-time.
                    </p>
                  </div>
                </div>
                {hasMultiple && (
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Role / Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.role || ""}
                    onChange={handleItemChange(index, "role")}
                    placeholder="Senior Product Manager"
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 ${
                      itemErrors.role ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                  {itemErrors.role && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.role}
                    </p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Company / Organization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.company || ""}
                    onChange={handleItemChange(index, "company")}
                    placeholder="Adani Enterprises"
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 ${
                      itemErrors.company ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                  {itemErrors.company && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.company}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={item.location || ""}
                    onChange={handleItemChange(index, "location")}
                    placeholder="Mumbai, India (Hybrid)"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  {itemErrors.location && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.location}
                    </p>
                  )}
                </div>

                {/* Period */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Start
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={item.start_month || ""}
                        onChange={handleItemChange(index, "start_month")}
                        className="w-1/2 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                      >
                        {monthOptions.map((m) => (
                          <option key={m} value={m}>
                            {m || "Month"}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={item.start_year || ""}
                        onChange={handleItemChange(index, "start_year")}
                        placeholder="2019"
                        className="w-1/2 rounded-lg border border-slate-200 px-2 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                      />
                    </div>
                    {(itemErrors.start_month || itemErrors.start_year) && (
                      <p className="mt-1 text-xs text-red-600">
                        {itemErrors.start_month || itemErrors.start_year}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      End
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={item.is_current ? "" : item.end_month || ""}
                        onChange={handleItemChange(index, "end_month")}
                        disabled={item.is_current}
                        className={`w-1/2 rounded-lg border bg-white px-2 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 ${
                          item.is_current ? "border-slate-100 text-slate-400" : "border-slate-200"
                        }`}
                      >
                        {monthOptions.map((m) => (
                          <option key={m} value={m}>
                            {m || "Month"}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={item.is_current ? "" : item.end_year || ""}
                        onChange={handleItemChange(index, "end_year")}
                        disabled={item.is_current}
                        placeholder="2023"
                        className={`w-1/2 rounded-lg border px-2 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 ${
                          item.is_current ? "border-slate-100 text-slate-400" : "border-slate-200"
                        }`}
                      />
                    </div>
                    {(itemErrors.end_month || itemErrors.end_year) && !item.is_current && (
                      <p className="mt-1 text-xs text-red-600">
                        {itemErrors.end_month || itemErrors.end_year}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-1.5">
                      <input
                        id={`current-${index}`}
                        type="checkbox"
                        checked={!!item.is_current}
                        onChange={handleItemChange(index, "is_current")}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <label
                        htmlFor={`current-${index}`}
                        className="text-[11px] text-slate-600"
                      >
                        I currently work here
                      </label>
                    </div>
                  </div>
                </div>

                {/* Bullets */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Key Achievements / Responsibilities (bullet points)
                  </label>
                  <textarea
                    value={item.bullets || ""}
                    onChange={handleItemChange(index, "bullets")}
                    rows={4}
                    placeholder={
                      "Write 3–6 bullets. One per line.\n" +
                      "Example:\n" +
                      "• Led a 5-member cross-functional team to launch X, improving Y by 20%\n" +
                      "• Managed P&L of INR 5 Cr for Z product line"
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  {itemErrors.bullets && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.bullets}
                    </p>
                  )}
                </div>

                {/* Impact summary */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    One-line Impact Summary (optional)
                  </label>
                  <input
                    type="text"
                    value={item.impact_summary || ""}
                    onChange={handleItemChange(index, "impact_summary")}
                    placeholder="Drove expansion strategy across 3 states, targeting 2x revenue growth in 3 years."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  {itemErrors.impact_summary && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.impact_summary}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add experience button */}
      <div className="flex justify-between items-center pt-1">
        <button
          type="button"
          onClick={addExperience}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
        >
          <span className="text-base leading-none">＋</span>
          Add another experience
        </button>
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
