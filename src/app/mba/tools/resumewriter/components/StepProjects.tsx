import React from "react";

type ProjectItem = {
  title?: string;
  organization?: string;
  location?: string;
  start_month?: string;
  start_year?: string;
  end_month?: string;
  end_year?: string;
  is_current?: boolean;
  context?: string; // short description of what this project is
  bullets?: string; // multi-line, one bullet per line
  outcome?: string; // what changed / numbers
};

type ProjectErrors = Array<Partial<Record<keyof ProjectItem, string>>>;

type StepProjectsProps = {
  value: ProjectItem[];
  errors?: ProjectErrors;
  onChange: (nextValue: ProjectItem[]) => void;
  onNext: () => void;
  onBack?: () => void;
  disableNext?: boolean;
  isSubmitting?: boolean;
};

export default function StepProjects({
  value,
  errors,
  onChange,
  onNext,
  onBack,
  disableNext,
  isSubmitting,
}: StepProjectsProps) {
  const handleItemChange =
    (index: number, field: keyof ProjectItem) =>
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

  const addProject = () => {
    const next = [
      ...value,
      {
        title: "",
        organization: "",
        location: "",
        start_month: "",
        start_year: "",
        end_month: "",
        end_year: "",
        is_current: false,
        context: "",
        bullets: "",
        outcome: "",
      },
    ];
    onChange(next);
  };

  const removeProject = (index: number) => {
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
          Step 4 — Projects & Major Work
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add 1–3 high–impact projects (academic, professional, or personal)
          that you want the resume to highlight with strong, outcome–driven
          bullets.
        </p>
      </div>

      {/* Project blocks */}
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
                      Project {index + 1}
                    </p>
                    <p className="text-xs text-slate-500">
                      Can be academic, internship, full–time, startup, or
                      personal.
                    </p>
                  </div>
                </div>
                {hasMultiple && (
                  <button
                    type="button"
                    onClick={() => removeProject(index)}
                    className="text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.title || ""}
                    onChange={handleItemChange(index, "title")}
                    placeholder="Market Entry Strategy for EV Start–up"
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 ${
                      itemErrors.title ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                  {itemErrors.title && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.title}
                    </p>
                  )}
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Organization / Context
                  </label>
                  <input
                    type="text"
                    value={item.organization || ""}
                    onChange={handleItemChange(index, "organization")}
                    placeholder="IIM Ahmedabad | Adani Enterprises | Personal Start–up"
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 ${
                      itemErrors.organization
                        ? "border-red-300"
                        : "border-slate-200"
                    }`}
                  />
                  {itemErrors.organization && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.organization}
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
                    placeholder="Bengaluru, India (Remote)"
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
                        placeholder="2023"
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
                        placeholder="2024"
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
                        id={`proj-current-${index}`}
                        type="checkbox"
                        checked={!!item.is_current}
                        onChange={handleItemChange(index, "is_current")}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <label
                        htmlFor={`proj-current-${index}`}
                        className="text-[11px] text-slate-600"
                      >
                        This project is ongoing
                      </label>
                    </div>
                  </div>
                </div>

                {/* Context */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    One–line Context (what is this project?)
                  </label>
                  <input
                    type="text"
                    value={item.context || ""}
                    onChange={handleItemChange(index, "context")}
                    placeholder="Capstone consulting project evaluating entry into Tier–2 Indian EV markets."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  {itemErrors.context && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.context}
                    </p>
                  )}
                </div>

                {/* Bullets */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Key Contributions (bullet points)
                  </label>
                  <textarea
                    value={item.bullets || ""}
                    onChange={handleItemChange(index, "bullets")}
                    rows={4}
                    placeholder={
                      "Write 2–5 bullets. One per line.\n" +
                      "Example:\n" +
                      "• Built a 3–year financial model comparing 2 market–entry scenarios; recommended strategy improving NPV by 18%\n" +
                      "• Led primary research with 25+ customers across 3 cities to validate pricing and feature preferences"
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  {itemErrors.bullets && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.bullets}
                    </p>
                  )}
                </div>

                {/* Outcome */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Outcome / Impact (optional)
                  </label>
                  <input
                    type="text"
                    value={item.outcome || ""}
                    onChange={handleItemChange(index, "outcome")}
                    placeholder="Recommended go–to–market plan adopted by sponsor; projected to increase revenue by 12% over baseline."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  {itemErrors.outcome && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.outcome}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add project button */}
      <div className="flex justify-between items-center pt-1">
        <button
          type="button"
          onClick={addProject}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
        >
          <span className="text-base leading-none">＋</span>
          Add another project
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
