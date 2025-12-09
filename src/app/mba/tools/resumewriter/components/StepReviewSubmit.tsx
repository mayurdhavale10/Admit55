import React from "react";

type StepReviewSubmitProps = {
  formData: any; // All collected form data
  onBack?: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  onEditStep?: (stepIndex: number) => void;
};

/**
 * StepReviewSubmit
 * ----------------
 * Final review step before generating the resume.
 * Shows a summary of all collected information with edit options.
 */
export default function StepReviewSubmit({
  formData,
  onBack,
  onSubmit,
  isSubmitting,
  onEditStep,
}: StepReviewSubmitProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmitting) {
      onSubmit();
    }
  };

  // Helper to check if a section has content
  const hasContent = (data: any): boolean => {
    if (!data) return false;
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data === "string") return data.trim().length > 0;
    if (typeof data === "object") {
      return Object.values(data).some((val) => {
        if (typeof val === "string") return val.trim().length > 0;
        return !!val;
      });
    }
    return false;
  };

  const basicInfo = formData.basic_info || {};
  const education = formData.education || [];
  const experience = formData.experience || [];
  const skills = formData.skills || {};
  const projects = formData.projects || [];
  const leadership = formData.leadership || [];
  const preferences = formData.preferences || {};

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Step 7 — Review & Generate
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Review your information below. You can go back to edit any section, or
          click "Generate Resume" to create your MBA-ready resume.
        </p>
      </div>

      {/* Basic Info */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Basic Information
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Name, contact, and target role
            </p>
          </div>
          {onEditStep && (
            <button
              type="button"
              onClick={() => onEditStep(0)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          )}
        </div>
        <div className="px-5 py-4 space-y-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            {basicInfo.full_name && (
              <>
                <span className="font-medium text-slate-700">Name:</span>
                <span className="text-slate-900">{basicInfo.full_name}</span>
              </>
            )}
            {basicInfo.email && (
              <>
                <span className="font-medium text-slate-700">Email:</span>
                <span className="text-slate-900 truncate">{basicInfo.email}</span>
              </>
            )}
            {basicInfo.phone && (
              <>
                <span className="font-medium text-slate-700">Phone:</span>
                <span className="text-slate-900">{basicInfo.phone}</span>
              </>
            )}
            {basicInfo.location && (
              <>
                <span className="font-medium text-slate-700">Location:</span>
                <span className="text-slate-900">{basicInfo.location}</span>
              </>
            )}
            {basicInfo.target_role && (
              <>
                <span className="font-medium text-slate-700">Target Role:</span>
                <span className="text-slate-900">{basicInfo.target_role}</span>
              </>
            )}
            {basicInfo.years_experience && (
              <>
                <span className="font-medium text-slate-700">Experience:</span>
                <span className="text-slate-900">
                  {basicInfo.years_experience} years
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Education</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {education.length} {education.length === 1 ? "entry" : "entries"}
            </p>
          </div>
          {onEditStep && (
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          )}
        </div>
        <div className="px-5 py-4 space-y-3">
          {education.map((edu: any, idx: number) => (
            <div key={idx} className="text-xs">
              <p className="font-semibold text-slate-900">
                {edu.degree || "Degree"}
              </p>
              <p className="text-slate-700">{edu.institution || "Institution"}</p>
              {(edu.start_year || edu.end_year) && (
                <p className="text-slate-500">
                  {edu.start_year || "—"} – {edu.end_year || "Present"}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Work Experience
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {experience.length}{" "}
              {experience.length === 1 ? "position" : "positions"}
            </p>
          </div>
          {onEditStep && (
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          )}
        </div>
        <div className="px-5 py-4 space-y-3">
          {experience.map((exp: any, idx: number) => (
            <div key={idx} className="text-xs">
              <p className="font-semibold text-slate-900">
                {exp.role || "Role"}
              </p>
              <p className="text-slate-700">{exp.company || "Company"}</p>
              <p className="text-slate-500">
                {exp.start_month} {exp.start_year} –{" "}
                {exp.is_current ? "Present" : `${exp.end_month} ${exp.end_year}`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      {hasContent(skills) && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Skills & Certifications
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Technical, soft skills, and certifications
              </p>
            </div>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep(3)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Edit
              </button>
            )}
          </div>
          <div className="px-5 py-4 space-y-2 text-xs">
            {skills.technical_skills && (
              <div>
                <span className="font-medium text-slate-700">Technical: </span>
                <span className="text-slate-900">
                  {skills.technical_skills.substring(0, 100)}
                  {skills.technical_skills.length > 100 ? "..." : ""}
                </span>
              </div>
            )}
            {skills.soft_skills && (
              <div>
                <span className="font-medium text-slate-700">Soft Skills: </span>
                <span className="text-slate-900">
                  {skills.soft_skills.substring(0, 100)}
                  {skills.soft_skills.length > 100 ? "..." : ""}
                </span>
              </div>
            )}
            {skills.certifications && (
              <div>
                <span className="font-medium text-slate-700">
                  Certifications:{" "}
                </span>
                <span className="text-slate-900">
                  {skills.certifications.substring(0, 100)}
                  {skills.certifications.length > 100 ? "..." : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Projects</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {projects.length}{" "}
                {projects.length === 1 ? "project" : "projects"}
              </p>
            </div>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep(4)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Edit
              </button>
            )}
          </div>
          <div className="px-5 py-4 space-y-3">
            {projects.map((proj: any, idx: number) => (
              <div key={idx} className="text-xs">
                <p className="font-semibold text-slate-900">
                  {proj.title || "Project"}
                </p>
                {proj.organization && (
                  <p className="text-slate-700">{proj.organization}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leadership */}
      {leadership.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Leadership & Extracurriculars
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {leadership.length}{" "}
                {leadership.length === 1 ? "role" : "roles"}
              </p>
            </div>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep(5)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Edit
              </button>
            )}
          </div>
          <div className="px-5 py-4 space-y-3">
            {leadership.map((lead: any, idx: number) => (
              <div key={idx} className="text-xs">
                <p className="font-semibold text-slate-900">
                  {lead.title || "Role"}
                </p>
                <p className="text-slate-700">
                  {lead.organization || "Organization"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Resume Preferences
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tone, length, and emphasis
            </p>
          </div>
          {onEditStep && (
            <button
              type="button"
              onClick={() => onEditStep(6)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          )}
        </div>
        <div className="px-5 py-4 space-y-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            {preferences.tone_preference && (
              <>
                <span className="font-medium text-slate-700">Tone:</span>
                <span className="text-slate-900 capitalize">
                  {preferences.tone_preference}
                </span>
              </>
            )}
            {preferences.length_preference && (
              <>
                <span className="font-medium text-slate-700">Length:</span>
                <span className="text-slate-900 capitalize">
                  {preferences.length_preference.replace("_", " ")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-4">
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-blue-900">
              Ready to Generate
            </h4>
            <p className="mt-1 text-xs text-blue-800">
              Your information looks complete! Click "Generate Resume" below to
              create your MBA-ready resume. This typically takes 10–20 seconds.
            </p>
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
          disabled={isSubmitting}
          className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all ${
            isSubmitting
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Generating Resume…
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Generate Resume
            </>
          )}
        </button>
      </div>
    </form>
  );
}