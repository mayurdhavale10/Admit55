// src/app/mba/tools/resumewriter/components/steps/consulting-1/Step3_Education.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { StepComponentProps } from "../registry";

import Classic1Preview from "../../resume-templates/consulting-1/Classic1Preview";

type EducationItem = {
  id: string;
  institute: string;     // "Indian School of Business (ISB)"
  location?: string;     // optional (if you want it)
  degreeLine: string;    // "MBA | GPA: 3.6/4 | ISB Torch Bearer Award"
  dateRange?: string;    // "Apr’17 – Apr’18"
  bullets: string[];     // achievements line(s)
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Math.random().toString(16).slice(2)}`;

function asInput(v: unknown) {
  return (v ?? "").toString();
}

function cleanStr(v: unknown) {
  return (v ?? "").toString().trim();
}

export default function Step3_Education_Consulting1({
  draft,
  setDraft,
  onNext,
  onPrev,
}: StepComponentProps) {
  const resume = (draft as any)?.resume ?? {};

  const initialEducation = useMemo<EducationItem[]>(() => {
    const saved = resume?.consulting1Education?.items;

    if (Array.isArray(saved) && saved.length) {
      return saved.map((e: any) => ({
        id: asInput(e.id) || uid(),
        institute: asInput(e.institute),
        location: asInput(e.location),
        degreeLine: asInput(e.degreeLine),
        dateRange: asInput(e.dateRange),
        bullets: Array.isArray(e.bullets) ? e.bullets.map(asInput) : [],
      }));
    }

    // Default starter based on your screenshot PDF
    return [
      {
        id: uid(),
        institute: "Indian School of Business (ISB)",
        location: "",
        degreeLine: "MBA | GPA: 3.6/4 | ISB Torch Bearer Award",
        dateRange: "Apr’17 – Apr’18",
        bullets: [
          "APAC Winner — Amazon; Campus Winner — EXL Challenge; National Winner — Consilium; National Finalist — Paytm",
        ],
      },
      {
        id: uid(),
        institute: "Thapar University, Punjab",
        location: "",
        degreeLine: "B.E in Electronics & Communication",
        dateRange: "Jul’10 – Jun’14",
        bullets: [
          "Internship — Indian Space Research Organization (ISRO) — Authored research paper, ‘Satellite Payload Filter’ — IEEE Xplore",
        ],
      },
    ];
  }, [resume]);

  const [items, setItems] = useState<EducationItem[]>(initialEducation);

  const persist = (next: EducationItem[]) => {
    setItems(next);

    (setDraft as any)({
      ...(draft as any),
      resume: {
        ...resume,
        consulting1Education: {
          heading: resume?.consulting1Education?.heading || "EDUCATION",
          items: next,
        },
      },
    });
  };

  const addEducation = () => {
    persist([
      ...items,
      {
        id: uid(),
        institute: "",
        location: "",
        degreeLine: "",
        dateRange: "",
        bullets: [""],
      },
    ]);
  };

  const removeEducation = (id: string) => {
    persist(items.filter((x) => x.id !== id));
  };

  const updateEducation = (id: string, patch: Partial<EducationItem>) => {
    persist(items.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const addBullet = (id: string) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    updateEducation(id, { bullets: [...it.bullets, ""] });
  };

  const updateBullet = (id: string, idx: number, val: string) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const next = [...it.bullets];
    next[idx] = val;
    updateEducation(id, { bullets: next });
  };

  const removeBullet = (id: string, idx: number) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    updateEducation(id, { bullets: it.bullets.filter((_, i) => i !== idx) });
  };

  // ✅ Preview mapping: MUST match ClassicTemplate1 props
  const header = resume?.consulting1Header ?? {};
  const summary = resume?.consulting1Summary ?? {};

  const previewData = useMemo(() => {
    return {
      header: {
        name: cleanStr(header.fullName) || "YOUR NAME",
        email: cleanStr(header.email),
        linkedin: cleanStr(header.linkedin),
        phone: cleanStr(header.phone),
      },

      summary: cleanStr(summary.text),

      // ✅ these are the exact keys the template preview uses (see sample)
      educationHeading: resume?.consulting1Education?.heading || "EDUCATION",
      education: items.map((e) => ({
        institute: cleanStr(e.institute),
        degreeLine: cleanStr(e.degreeLine),
        dateRange: cleanStr(e.dateRange),
        bullets: (Array.isArray(e.bullets) ? e.bullets : [])
          .map((b) => cleanStr(b))
          .filter(Boolean),
      })),
    };
  }, [header, summary, items, resume?.consulting1Education?.heading]);

  const canContinue =
    items.some((e) => cleanStr(e.institute)) || items.some((e) => cleanStr(e.degreeLine));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT */}
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                Step 3 — Education
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Add MBA + UG entries (and key wins) in the PDF format.
              </p>
            </div>

            <button
              type="button"
              onClick={addEducation}
              className="rounded-xl bg-[#002b5b] px-4 py-2 text-sm font-semibold text-white"
            >
              + Add education
            </button>
          </div>

          {items.map((ed, idx) => (
            <div
              key={ed.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                    Education #{idx + 1}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Institute + degree line + date range + achievements
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeEducation(ed.id)}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Institute (e.g., Indian School of Business (ISB))"
                  value={ed.institute}
                  onChange={(e) =>
                    updateEducation(ed.id, { institute: asInput(e.target.value) })
                  }
                />
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Date range (e.g., Apr’17 – Apr’18)"
                  value={ed.dateRange ?? ""}
                  onChange={(e) =>
                    updateEducation(ed.id, { dateRange: asInput(e.target.value) })
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Degree line (e.g., MBA | GPA: 3.6/4 | Award)"
                  value={ed.degreeLine}
                  onChange={(e) =>
                    updateEducation(ed.id, { degreeLine: asInput(e.target.value) })
                  }
                />
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Location (optional)"
                  value={ed.location ?? ""}
                  onChange={(e) =>
                    updateEducation(ed.id, { location: asInput(e.target.value) })
                  }
                />
              </div>

              {/* ✅ Achievements */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Achievements
                  </div>
                  <button
                    type="button"
                    onClick={() => addBullet(ed.id)}
                    className="text-xs font-semibold text-[#0b5cff] hover:underline"
                  >
                    + Add achievement
                  </button>
                </div>

                {ed.bullets.map((b, bi) => (
                  <div key={`${ed.id}-b-${bi}`} className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="e.g., APAC Winner — Amazon; Campus Winner — EXL Challenge..."
                      value={b}
                      onChange={(e) => updateBullet(ed.id, bi, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeBullet(ed.id, bi)}
                      className="rounded-lg border border-slate-200 px-3 text-xs text-red-600 dark:border-slate-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* nav */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onPrev}
              className="px-4 py-2 rounded-md border text-sm border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Back
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!canContinue}
              className="rounded-xl bg-[#002b5b] px-6 py-2 text-white disabled:bg-slate-400"
            >
              Continue
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Live Preview (Consulting 1)
            </div>
          </div>

          <Classic1Preview data={previewData as any} />
        </div>
      </div>
    </div>
  );
}
