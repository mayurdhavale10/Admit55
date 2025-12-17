import React from "react";

type BasicInfoValues = {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  current_role?: string;
  target_role?: string;
  years_experience?: string;
  work_authorization?: string;
};

type BasicInfoErrors = Partial<Record<keyof BasicInfoValues, string>>;

type StepBasicInfoProps = {
  value: BasicInfoValues;
  errors?: BasicInfoErrors;
  onChange: (updates: Partial<BasicInfoValues>) => void;
  onNext: () => void;
  disableNext?: boolean;
  isSubmitting?: boolean;
};

export default function StepBasicInfo({
  value,
  errors,
  onChange,
  onNext,
  disableNext,
  isSubmitting,
}: StepBasicInfoProps) {
  const handleChange =
    (field: keyof BasicInfoValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
          Step 1 — Basic Profile
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Start with the essentials. This will appear at the top of your MBA-ready resume.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={value.full_name}
            onChange={handleChange("full_name")}
            placeholder="Aviral Sharma"
            className={`w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 ${
              errors?.full_name ? "border-red-300" : "border-slate-200"
            }`}
          />
          {errors?.full_name && (
            <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={value.email}
            onChange={handleChange("email")}
            placeholder="you@example.com"
            className={`w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 ${
              errors?.email ? "border-red-300" : "border-slate-200"
            }`}
          />
          {errors?.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={value.phone || ""}
            onChange={handleChange("phone")}
            placeholder="+91 98765 43210"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
          />
          {errors?.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Location
          </label>
          <input
            type="text"
            value={value.location || ""}
            onChange={handleChange("location")}
            placeholder="Mumbai, India"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
          />
          {errors?.location && (
            <p className="mt-1 text-xs text-red-600">{errors.location}</p>
          )}
        </div>

        {/* LinkedIn */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            LinkedIn URL
          </label>
          <input
            type="url"
            value={value.linkedin || ""}
            onChange={handleChange("linkedin")}
            placeholder="https://www.linkedin.com/in/yourname"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
          />
          {errors?.linkedin && (
            <p className="mt-1 text-xs text-red-600">{errors.linkedin}</p>
          )}
        </div>

        {/* Current role */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Current Role / Title
          </label>
          <input
            type="text"
            value={value.current_role || ""}
            onChange={handleChange("current_role")}
            placeholder="Senior Associate, Strategy — Adani Enterprises"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
          />
          {errors?.current_role && (
            <p className="mt-1 text-xs text-red-600">{errors.current_role}</p>
          )}
        </div>

        {/* Target role + experience */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Target Post-MBA Role
          </label>
          <input
            type="text"
            value={value.target_role || ""}
            onChange={handleChange("target_role")}
            placeholder="Strategy Consulting (MBB) in India"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
          />
          {errors?.target_role && (
            <p className="mt-1 text-xs text-red-600">{errors.target_role}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Total Years of Experience
          </label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={value.years_experience || ""}
            onChange={handleChange("years_experience")}
            placeholder="3.5"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
          />
          {errors?.years_experience && (
            <p className="mt-1 text-xs text-red-600">
              {errors.years_experience}
            </p>
          )}
        </div>

        {/* Work authorization */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Work Authorization / Visa Notes
          </label>
          <input
            type="text"
            value={value.work_authorization || ""}
            onChange={handleChange("work_authorization")}
            placeholder="Indian citizen; open to global roles, requires sponsorship for US/EU"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
          />
          {errors?.work_authorization && (
            <p className="mt-1 text-xs text-red-600">
              {errors.work_authorization}
            </p>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="pt-2 flex justify-end">
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
