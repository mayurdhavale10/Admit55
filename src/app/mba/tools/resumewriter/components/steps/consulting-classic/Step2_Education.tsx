"use client";

import React, { useMemo } from "react";
import type { StepComponentProps } from "../registry";

// ✅ SAME preview component as Step1
import ConsultingClassicPreview from "../../../components/resume-templates/consulting-classic/ConsultingClassicPreview";

const DEFAULT_HIGHLIGHTS = [
  "Cars24 Arabia (UAE)",
  "Alvarez & Marsal (India)",
  "IIM Ahmedabad",
  "Chartered Accountant",
  "Grant Thornton Bharat LLP",
];

type EduRow = {
  degree?: string;
  institution?: string;
  overallScore?: string;
  performanceHighlight?: string;
  year?: string;
};

const DEFAULT_EDU: Required<EduRow>[] = [
  {
    degree: "MBA",
    institution: "IIM Ahmedabad",
    overallScore: "3.1/4.3",
    performanceHighlight: "PGP-2 CGPA: 3.5/4.3",
    year: "2023",
  },
  {
    degree: "CA (Final)",
    institution: "Institute of Chartered Accountants of India",
    overallScore: "62.0%",
    performanceHighlight: "Exemption (60%+) in 4/8 subjects",
    year: "2017",
  },
  {
    degree: "B. Com (Hons)",
    institution: "I.P. College for Women, Delhi University",
    overallScore: "73.2%",
    performanceHighlight: "Top 25% out of 150+ students",
    year: "2013",
  },
];

function cleanStr(v: any) {
  return (v ?? "").toString();
}

function ensure3Rows(rows: EduRow[] | undefined): EduRow[] {
  const safe = Array.isArray(rows) ? rows : [];
  return [0, 1, 2].map((i) => safe[i] ?? { ...DEFAULT_EDU[i] });
}

export default function Step2_Education_ConsultingClassic({
  draft,
  setDraft,
  onNext,
  onPrev,
}: StepComponentProps) {
  const basic = draft?.resume?.basicInfo ?? {};

  // ✅ store these rows in draft.resume.educationRows (template-specific)
  const educationRows = ensure3Rows((draft as any)?.resume?.educationRows);

  const updateRow = (idx: number, patch: Partial<EduRow>) => {
    const next = [...educationRows];
    next[idx] = { ...next[idx], ...patch };

    setDraft({
      ...draft,
      resume: {
        ...(draft.resume ?? {}),
        educationRows: next, // ✅ template table rows
      } as any,
    });
  };

  // ✅ preview uses FULL step1 header + meta bar + education rows
  const previewData = useMemo(() => {
    const fullName = `${basic.firstName ?? ""} ${basic.lastName ?? ""}`.trim();

    const rawMeta = Array.isArray(basic.metaBar) ? basic.metaBar : [];
    const cleanedMeta = rawMeta.map((s) => (s ?? "").trim()).filter(Boolean);

    const metaBarForPreview =
      cleanedMeta.length > 0 ? cleanedMeta.slice(0, 5) : DEFAULT_HIGHLIGHTS;

    return {
      header: {
        name: fullName || "Your Name",
        gender: cleanStr(basic.gender),
        university: cleanStr(basic.university),
        email: cleanStr(basic.email),
        phone: cleanStr(basic.phone),
        location: cleanStr(basic.location),
      },
      metaBar: metaBarForPreview,
      educationRows, // ✅ this must be passed to the template
    };
  }, [
    basic.firstName,
    basic.lastName,
    basic.gender,
    basic.university,
    basic.email,
    basic.phone,
    basic.location,
    basic.metaBar,
    educationRows,
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT: Education inputs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Step 2 — Education
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Fill your education rows exactly as the template table:
            <span className="font-semibold">
              {" "}
              Degree | Institution | Overall Score | Performance Highlight | Year
            </span>
          </p>

          <div className="mt-6 space-y-5">
            {[0, 1, 2].map((idx) => {
              const r = educationRows[idx];
              const optional = idx === 2;

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      Education {idx + 1}{" "}
                      {optional ? (
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          (optional)
                        </span>
                      ) : (
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          (required)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                      placeholder="Degree (e.g., MBA / B.Tech / CA Final)"
                      value={r.degree ?? ""}
                      onChange={(e) => updateRow(idx, { degree: e.target.value })}
                    />
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                      placeholder="Institution / University"
                      value={r.institution ?? ""}
                      onChange={(e) =>
                        updateRow(idx, { institution: e.target.value })
                      }
                    />
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                      placeholder="Overall Score (e.g., 8.4/10 or 73.2%)"
                      value={r.overallScore ?? ""}
                      onChange={(e) =>
                        updateRow(idx, { overallScore: e.target.value })
                      }
                    />
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                      placeholder="Performance Highlight (rank / scholarship / top %)"
                      value={r.performanceHighlight ?? ""}
                      onChange={(e) =>
                        updateRow(idx, { performanceHighlight: e.target.value })
                      }
                    />
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 md:col-span-2"
                      placeholder="Year (e.g., 2023)"
                      value={r.year ?? ""}
                      onChange={(e) => updateRow(idx, { year: e.target.value })}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={onPrev}
              className="px-4 py-2 rounded-md border text-sm border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Back
            </button>
            <button
              onClick={onNext}
              className="px-5 py-2.5 rounded-md text-sm font-semibold text-white bg-[#002b5b] hover:bg-[#003b7a]"
            >
              Next
            </button>
          </div>
        </div>

        {/* RIGHT: Live template preview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Live Preview (Consulting Classic)
            </div>
          </div>

          {/* ✅ Pass previewData (includes educationRows) */}
          <ConsultingClassicPreview data={previewData as any} />
        </div>
      </div>
    </div>
  );
}
