import React from "react";

type ResumeHeader = {
  full_name: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
};

type ResumeEntry = {
  title?: string;
  subtitle?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  bullets?: string[];
};

type ResumeSection = {
  title: string;
  entries: ResumeEntry[];
};

type GeneratedResume = {
  header: ResumeHeader;
  summary?: string;
  sections: ResumeSection[];
};

type ResumePreviewProps = {
  data: {
    generated_resume?: GeneratedResume;
    raw_markdown?: string;
  } | null;
  loading?: boolean;
};

/**
 * ResumePreview
 * -------------
 * Right-hand side "PDF-like" preview of the generated resume.
 * - Shows a subtle empty state when nothing is generated yet.
 * - Shows a simple loading skeleton when `loading` is true.
 * - Renders the structured resume returned by the backend.
 */
export default function ResumePreview({ data, loading }: ResumePreviewProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-3 w-64 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-3 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  const generated = data?.generated_resume;

  // Empty state when we have no resume yet
  if (!generated) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-white mb-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M7 4h10a2 2 0 012 2v13l-4-2-4 2-4-2-4 2V6a2 2 0 012-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Your resume preview will appear here
          </h3>
          <p className="text-sm text-slate-500">
            Fill out the steps on the left and click{" "}
            <span className="font-semibold text-slate-700">
              “Generate Resume”
            </span>{" "}
            to see a clean, MBA-ready resume in this panel.
          </p>
        </div>
      </div>
    );
  }

  const header = generated.header || {};
  const sections = generated.sections || [];
  const summary = generated.summary || "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* "Paper" */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-5 rounded-t-2xl">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
          {header.full_name || "Candidate Name"}
        </h1>
        {header.title && (
          <p className="mt-1 text-sm font-medium text-slate-700">
            {header.title}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          {header.email && (
            <span className="flex items-center gap-1">
              <span className="font-medium">Email:</span>
              <span className="truncate">{header.email}</span>
            </span>
          )}
          {header.phone && (
            <span className="flex items-center gap-1">
              <span className="font-medium">Phone:</span>
              <span>{header.phone}</span>
            </span>
          )}
          {header.location && (
            <span className="flex items-center gap-1">
              <span className="font-medium">Location:</span>
              <span>{header.location}</span>
            </span>
          )}
          {header.linkedin && (
            <span className="flex items-center gap-1">
              <span className="font-medium">LinkedIn:</span>
              <span className="truncate">{header.linkedin}</span>
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 space-y-6">
        {/* Summary */}
        {summary && (
          <section>
            <h2 className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase mb-1.5">
              Professional Summary
            </h2>
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
              {summary}
            </p>
          </section>
        )}

        {/* Sections */}
        {sections.map((section, idx) => (
          <section key={`${section.title}-${idx}`} className="space-y-2.5">
            <h2 className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
              {section.title}
            </h2>

            <div className="space-y-3">
              {section.entries?.map((entry, j) => (
                <div key={j}>
                  {/* Title / subtitle row */}
                  <div className="flex justify-between gap-3">
                    <div>
                      {entry.title && (
                        <p className="text-sm font-semibold text-slate-900">
                          {entry.title}
                        </p>
                      )}
                      {entry.subtitle && (
                        <p className="text-xs text-slate-600">
                          {entry.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-slate-500">
                      {(entry.start_date || entry.end_date) && (
                        <p>
                          {entry.start_date || "—"}{" "}
                          {entry.end_date ? `– ${entry.end_date}` : ""}
                        </p>
                      )}
                      {entry.location && <p>{entry.location}</p>}
                    </div>
                  </div>

                  {/* Bullets */}
                  {entry.bullets && entry.bullets.length > 0 && (
                    <ul className="mt-1.5 space-y-1.5">
                      {entry.bullets.map((bullet, k) => (
                        <li
                          key={k}
                          className="flex gap-2 text-xs leading-relaxed text-slate-700"
                        >
                          <span className="mt-1 block h-[3px] w-[3px] flex-shrink-0 rounded-full bg-slate-500" />
                          <span className="whitespace-pre-line">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
