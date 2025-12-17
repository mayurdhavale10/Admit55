import React from "react";

type LeadershipItem = {
  title?: string;
  organization?: string;
  location?: string;
  start_month?: string;
  start_year?: string;
  end_month?: string;
  end_year?: string;
  is_current?: boolean;
  description?: string;
  impact?: string;
};

type LeadershipErrors = Array<Partial<Record<keyof LeadershipItem, string>>>;

type StepLeadershipProps = {
  value: LeadershipItem[];
  errors?: LeadershipErrors;
  onChange: (nextValue: LeadershipItem[]) => void;
  onNext: () => void;
  onBack?: () => void;
  disableNext?: boolean;
  isSubmitting?: boolean;
};

export default function StepLeadership({
  value,
  errors,
  onChange,
  onNext,
  onBack,
  disableNext,
  isSubmitting,
}: StepLeadershipProps) {
  const handleItemChange =
    (index: number, field: keyof LeadershipItem) =>
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

  const addLeadership = () => {
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
        description: "",
        impact: "",
      },
    ];
    onChange(next);
  };

  const removeLeadership = (index: number) => {
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
          Step 5 — Leadership & Extracurriculars
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Showcase leadership roles, club involvement, volunteer work, and other
          activities that demonstrate initiative, teamwork, and community
          engagement.
        </p>
      </div>

      {/* Leadership blocks */}
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
                      Leadership Role {index + 1}
                    </p>
                    <p className="text-xs text-slate-500">
                      Club officer, volunteer, committee member, team captain,
                      etc.
                    </p>
                  </div>
                </div>
                {hasMultiple && (
                  <button
                    type="button"
                    onClick={() => removeLeadership(index)}
                    className="text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title / Role */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Role / Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.title || ""}
                    onChange={handleItemChange(index, "title")}
                    placeholder="President, Finance Club"
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
                    Organization / Club <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.organization || ""}
                    onChange={handleItemChange(index, "organization")}
                    placeholder="IIT Bombay Finance Club"
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
                    placeholder="Mumbai, India"
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
                        placeholder="2020"
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
                          item.is_current
                            ? "border-slate-100 text-slate-400"
                            : "border-slate-200"
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
                          item.is_current
                            ? "border-slate-100 text-slate-400"
                            : "border-slate-200"
                        }`}
                      />
                    </div>
                    {(itemErrors.end_month || itemErrors.end_year) &&
                      !item.is_current && (
                        <p className="mt-1 text-xs text-red-600">
                          {itemErrors.end_month || itemErrors.end_year}
                        </p>
                      )}
                    <div className="mt-1 flex items-center gap-1.5">
                      <input
                        id={`lead-current-${index}`}
                        type="checkbox"
                        checked={!!item.is_current}
                        onChange={handleItemChange(index, "is_current")}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <label
                        htmlFor={`lead-current-${index}`}
                        className="text-[11px] text-slate-600"
                      >
                        Currently active in this role
                      </label>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Description / Responsibilities
                  </label>
                  <textarea
                    value={item.description || ""}
                    onChange={handleItemChange(index, "description")}
                    rows={3}
                    placeholder={
                      "Briefly describe your role and responsibilities.\n" +
                      "Example: Led a 12-member committee organizing annual finance summit with 300+ attendees, managing INR 8 lakh budget and coordinating with 5 corporate sponsors."
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  {itemErrors.description && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.description}
                    </p>
                  )}
                </div>

                {/* Impact */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Key Achievements / Impact
                  </label>
                  <textarea
                    value={item.impact || ""}
                    onChange={handleItemChange(index, "impact")}
                    rows={3}
                    placeholder={
                      "What did you accomplish? Use metrics when possible.\n" +
                      "Examples:\n" +
                      "• Increased club membership by 40% (from 50 to 70 members) through targeted outreach\n" +
                      "• Secured INR 5 lakh in sponsorships, 25% above target\n" +
                      "• Launched new mentorship program connecting 30 juniors with industry professionals"
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  {itemErrors.impact && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.impact}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add leadership button */}
      <div className="flex justify-between items-center pt-1">
        <button
          type="button"
          onClick={addLeadership}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
        >
          <span className="text-base leading-none">＋</span>
          Add another leadership role
        </button>
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
              What to Include Here
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>
                • Student club leadership (president, treasurer, event
                coordinator)
              </li>
              <li>
                • Volunteer work and community service (NGO roles, teaching,
                social impact)
              </li>
              <li>
                • Sports team captain or athletic achievements (state/national
                level)
              </li>
              <li>
                • Cultural or arts leadership (dance team, music society,
                theater)
              </li>
              <li>
                • Entrepreneurial initiatives (startups, side projects, business
                competitions)
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