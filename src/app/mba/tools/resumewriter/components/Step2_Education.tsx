import React from "react";

type EducationItem = {
  level?: string; // e.g., "Undergraduate", "Postgraduate"
  degree?: string;
  institution?: string;
  location?: string;
  start_year?: string;
  end_year?: string;
  gpa?: string;
  honors?: string;
  key_courses?: string;
};

type EducationErrors = Array<Partial<Record<keyof EducationItem, string>>>;

type StepEducationProps = {
  value: EducationItem[];
  errors?: EducationErrors;
  onChange: (nextValue: EducationItem[]) => void;
  onNext: () => void;
  onBack?: () => void;
  disableNext?: boolean;
  isSubmitting?: boolean;
};

export default function StepEducation({
  value,
  errors,
  onChange,
  onNext,
  onBack,
  disableNext,
  isSubmitting,
}: StepEducationProps) {
  const handleItemChange =
    (index: number, field: keyof EducationItem) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const next = [...value];
      next[index] = {
        ...next[index],
        [field]: e.target.value,
      };
      onChange(next);
    };

  const addEducation = () => {
    const next = [
      ...value,
      {
        level: "",
        degree: "",
        institution: "",
        location: "",
        start_year: "",
        end_year: "",
        gpa: "",
        honors: "",
        key_courses: "",
      },
    ];
    onChange(next);
  };

  const removeEducation = (index: number) => {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Step 2 — Education
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Capture undergrad, postgrad, and other key academic credentials. These
          will be formatted into a clean MBA resume section.
        </p>
      </div>

      {/* Education blocks */}
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
                      Education Entry {index + 1}
                    </p>
                    <p className="text-xs text-slate-500">
                      Undergraduate, postgraduate, or other degree.
                    </p>
                  </div>
                </div>
                {hasMultiple && (
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Level */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Level
                  </label>
                  <select
                    value={item.level || ""}
                    onChange={handleItemChange(index, "level")}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  >
                    <option value="">Select level</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate</option>
                    <option value="doctoral">Doctoral / PhD</option>
                    <option value="diploma">Diploma / Certificate</option>
                    <option value="other">Other</option>
                  </select>
                  {itemErrors.level && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.level}
                    </p>
                  )}
                </div>

                {/* Degree */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Degree / Program <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.degree || ""}
                    onChange={handleItemChange(index, "degree")}
                    placeholder="B.Tech in Mechanical Engineering"
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 ${
                      itemErrors.degree ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                  {itemErrors.degree && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.degree}
                    </p>
                  )}
                </div>

                {/* Institution */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Institution / University <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.institution || ""}
                    onChange={handleItemChange(index, "institution")}
                    placeholder="Indian Institute of Technology, Bombay"
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 ${
                      itemErrors.institution
                        ? "border-red-300"
                        : "border-slate-200"
                    }`}
                  />
                  {itemErrors.institution && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.institution}
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

                {/* Years */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Start Year
                    </label>
                    <input
                      type="text"
                      value={item.start_year || ""}
                      onChange={handleItemChange(index, "start_year")}
                      placeholder="2017"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                    />
                    {itemErrors.start_year && (
                      <p className="mt-1 text-xs text-red-600">
                        {itemErrors.start_year}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      End Year
                    </label>
                    <input
                      type="text"
                      value={item.end_year || ""}
                      onChange={handleItemChange(index, "end_year")}
                      placeholder="2021"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                    />
                    {itemErrors.end_year && (
                      <p className="mt-1 text-xs text-red-600">
                        {itemErrors.end_year}
                      </p>
                    )}
                  </div>
                </div>

                {/* GPA */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GPA / Percentage (optional)
                  </label>
                  <input
                    type="text"
                    value={item.gpa || ""}
                    onChange={handleItemChange(index, "gpa")}
                    placeholder="8.7/10 CGPA or 86%"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  {itemErrors.gpa && (
                    <p className="mt-1 text-xs text-red-600">{itemErrors.gpa}</p>
                  )}
                </div>

                {/* Honors */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Honors / Awards
                  </label>
                  <input
                    type="text"
                    value={item.honors || ""}
                    onChange={handleItemChange(index, "honors")}
                    placeholder="Institute Merit Scholarship, Top 5% of class"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  {itemErrors.honors && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.honors}
                    </p>
                  )}
                </div>

                {/* Key courses */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Key Courses (comma separated)
                  </label>
                  <textarea
                    value={item.key_courses || ""}
                    onChange={handleItemChange(index, "key_courses")}
                    placeholder="Corporate Finance, Operations Management, Data Analytics for Business"
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  {itemErrors.key_courses && (
                    <p className="mt-1 text-xs text-red-600">
                      {itemErrors.key_courses}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add education button */}
      <div className="flex justify-between items-center pt-1">
        <button
          type="button"
          onClick={addEducation}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
        >
          <span className="text-base leading-none">＋</span>
          Add another education
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
