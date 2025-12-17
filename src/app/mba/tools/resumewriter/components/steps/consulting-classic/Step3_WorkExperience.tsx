// src/app/mba/tools/resumewriter/components/steps/consulting-classic/Step3_WorkExperience.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { StepComponentProps } from "../registry";

import ConsultingClassicPreview from "../../../components/resume-templates/consulting-classic/ConsultingClassicPreview";
import { rewriteWorkBullet } from "../../../ai/rewriteWorkBullet";

// ---- Types (match what template expects via preview -> template -> Work_experience)
type Bullet = { text: string; highlights?: string[] };
type ExperienceRow = { leftLabel: string; bullets: Bullet[] };
type ExperienceItem = {
  companyLine: string;
  duration: string;
  dateRange: string;
  rows: ExperienceRow[];
};

const DEFAULT_HIGHLIGHTS = [
  "Cars24 Arabia (UAE)",
  "Alvarez & Marsal (India)",
  "IIM Ahmedabad",
  "Chartered Accountant",
  "Grant Thornton Bharat LLP",
];

function cleanStr(v: any) {
  return (v ?? "").toString();
}

function ensureExperienceShape(x: any): ExperienceItem {
  return {
    companyLine: cleanStr(x?.companyLine),
    duration: cleanStr(x?.duration),
    dateRange: cleanStr(x?.dateRange),
    rows: Array.isArray(x?.rows)
      ? x.rows.map((r: any) => ({
          leftLabel: cleanStr(r?.leftLabel),
          bullets: Array.isArray(r?.bullets)
            ? r.bullets.map((b: any) => ({
                text: cleanStr(b?.text),
                highlights: Array.isArray(b?.highlights)
                  ? b.highlights.map(cleanStr).filter(Boolean)
                  : [],
              }))
            : [{ text: "", highlights: [] }],
        }))
      : [{ leftLabel: "", bullets: [{ text: "", highlights: [] }] }],
  };
}

function makeDefaultCompany(): ExperienceItem {
  // ✅ default 3 sub-roles (so UI shows blocks immediately)
  return {
    companyLine: "",
    duration: "",
    dateRange: "",
    rows: [
      { leftLabel: "", bullets: [{ text: "", highlights: [] }] },
      { leftLabel: "", bullets: [{ text: "", highlights: [] }] },
      { leftLabel: "", bullets: [{ text: "", highlights: [] }] },
    ],
  };
}

export default function Step3_WorkExperience_ConsultingClassic({
  draft,
  setDraft,
  onNext,
  onPrev,
}: StepComponentProps) {
  const basic = draft?.resume?.basicInfo ?? {};

  // ✅ Step2 saves this as resume.educationRows (NOT resume.education)
  const educationRows = Array.isArray((draft as any)?.resume?.educationRows)
    ? ((draft as any).resume.educationRows as any[])
    : [];

  const experiencesRaw = Array.isArray(draft?.resume?.experiences)
    ? ((draft?.resume?.experiences as any[]) ?? [])
    : [];

  const experiences = experiencesRaw.map(ensureExperienceShape);

  // ✅ Always show at least 1 company block in UI (even if draft empty)
  const blocks: ExperienceItem[] = experiences.length
    ? experiences
    : [makeDefaultCompany()];

  const [aiLoadingKey, setAiLoadingKey] = useState<string | null>(null);

  // ✅ SAME pattern as Step1/Step2 (object update) — no functional setDraft
  const setExperiences = (next: ExperienceItem[]) => {
    setDraft({
      ...draft,
      resume: {
        ...(draft.resume ?? {}),
        experiences: next,
      },
    } as any);
  };

  const addCompany = () => setExperiences([...blocks, makeDefaultCompany()]);

  const removeCompany = (idx: number) => {
    const next = blocks.filter((_, i) => i !== idx);
    setExperiences(next.length ? next : [makeDefaultCompany()]);
  };

  const updateCompanyField = (
    idx: number,
    field: keyof Pick<ExperienceItem, "companyLine" | "duration" | "dateRange">,
    value: string
  ) => {
    const next = [...blocks];
    next[idx] = { ...next[idx], [field]: value };
    setExperiences(next);
  };

  const addRow = (expIdx: number) => {
    const next = [...blocks];
    const rows = Array.isArray(next[expIdx].rows) ? [...next[expIdx].rows] : [];
    rows.push({ leftLabel: "", bullets: [{ text: "", highlights: [] }] });
    next[expIdx] = { ...next[expIdx], rows };
    setExperiences(next);
  };

  const removeRow = (expIdx: number, rowIdx: number) => {
    const next = [...blocks];
    const rows = Array.isArray(next[expIdx].rows) ? [...next[expIdx].rows] : [];
    const filtered = rows.filter((_, i) => i !== rowIdx);
    next[expIdx] = {
      ...next[expIdx],
      rows: filtered.length
        ? filtered
        : [{ leftLabel: "", bullets: [{ text: "", highlights: [] }] }],
    };
    setExperiences(next);
  };

  const updateRowLabel = (expIdx: number, rowIdx: number, value: string) => {
    const next = [...blocks];
    const rows = Array.isArray(next[expIdx].rows) ? [...next[expIdx].rows] : [];
    const baseRow = rows[rowIdx] ?? {
      leftLabel: "",
      bullets: [{ text: "", highlights: [] }],
    };
    rows[rowIdx] = { ...baseRow, leftLabel: value };
    next[expIdx] = { ...next[expIdx], rows };
    setExperiences(next);
  };

  const addBullet = (expIdx: number, rowIdx: number) => {
    const next = [...blocks];
    const rows = Array.isArray(next[expIdx].rows) ? [...next[expIdx].rows] : [];
    const row = rows[rowIdx] ?? {
      leftLabel: "",
      bullets: [{ text: "", highlights: [] }],
    };
    const bullets = Array.isArray(row.bullets)
      ? [...row.bullets]
      : [{ text: "", highlights: [] }];
    bullets.push({ text: "", highlights: [] });
    rows[rowIdx] = { ...row, bullets };
    next[expIdx] = { ...next[expIdx], rows };
    setExperiences(next);
  };

  const removeBullet = (expIdx: number, rowIdx: number, bulletIdx: number) => {
    const next = [...blocks];
    const rows = Array.isArray(next[expIdx].rows) ? [...next[expIdx].rows] : [];
    const row = rows[rowIdx] ?? {
      leftLabel: "",
      bullets: [{ text: "", highlights: [] }],
    };
    const bullets = Array.isArray(row.bullets)
      ? [...row.bullets]
      : [{ text: "", highlights: [] }];
    const filtered = bullets.filter((_, i) => i !== bulletIdx);
    rows[rowIdx] = {
      ...row,
      bullets: filtered.length ? filtered : [{ text: "", highlights: [] }],
    };
    next[expIdx] = { ...next[expIdx], rows };
    setExperiences(next);
  };

  const updateBulletText = (
    expIdx: number,
    rowIdx: number,
    bulletIdx: number,
    value: string,
    highlights?: string[]
  ) => {
    const next = [...blocks];
    const rows = Array.isArray(next[expIdx].rows) ? [...next[expIdx].rows] : [];
    const row = rows[rowIdx] ?? {
      leftLabel: "",
      bullets: [{ text: "", highlights: [] }],
    };
    const bullets = Array.isArray(row.bullets)
      ? [...row.bullets]
      : [{ text: "", highlights: [] }];

    const prev = bullets[bulletIdx] ?? { text: "", highlights: [] };

    bullets[bulletIdx] = {
      ...prev,
      text: value,
      highlights: Array.isArray(highlights)
        ? highlights.map(cleanStr).filter(Boolean)
        : prev.highlights ?? [],
    };

    rows[rowIdx] = { ...row, bullets };
    next[expIdx] = { ...next[expIdx], rows };
    setExperiences(next);
  };

  const handleRewrite = async (
    expIdx: number,
    rowIdx: number,
    bulletIdx: number
  ) => {
    const key = `${expIdx}-${rowIdx}-${bulletIdx}`;
    setAiLoadingKey(key);

    try {
      const exp = blocks[expIdx];
      const raw = exp?.rows?.[rowIdx]?.bullets?.[bulletIdx]?.text ?? "";

      const track =
        (draft as any)?.intent?.track ??
        (draft as any)?.intent?.targetTrack ??
        (draft as any)?.intent?.persona ??
        "";

      const res = await rewriteWorkBullet({
        raw,
        track,
        targetCompanyOrTeam: exp.companyLine,
        targetRole: exp.companyLine,
      });

      // ✅ store both rewritten + highlights
      if (res?.ok && res.rewritten) {
        updateBulletText(expIdx, rowIdx, bulletIdx, res.rewritten, (res as any).highlights);
      }
    } finally {
      setAiLoadingKey(null);
    }
  };

  // ✅ preview from FULL draft (Step1 + Step2 + Step3)
  const previewData = useMemo(() => {
    const fullName = `${basic.firstName ?? ""} ${basic.lastName ?? ""}`.trim();

    const rawMeta = Array.isArray(basic.metaBar) ? basic.metaBar : [];
    const cleanedMeta = rawMeta.map((s) => (s ?? "").trim()).filter(Boolean);
    const metaBarForPreview = cleanedMeta.length
      ? cleanedMeta.slice(0, 5)
      : DEFAULT_HIGHLIGHTS;

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
      educationRows, // ✅ from Step2 storage
      experiences: blocks, // ✅ feed template Work_experience
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
    blocks,
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Step 3 — Work Experience
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Add companies, sub-roles, and bullets. Use “Rewrite With Admit55
                Ai” to polish bullets.
              </p>
            </div>

            <button
              type="button"
              onClick={addCompany}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              + Add Company
            </button>
          </div>

          <div className="mt-5 space-y-5">
            {blocks.map((exp, expIdx) => (
              <div
                key={expIdx}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    Company {expIdx + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCompany(expIdx)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Company - Role (e.g., Cars24 Arabia - GM, Strategy & Finance)"
                    value={exp.companyLine}
                    onChange={(e) =>
                      updateCompanyField(expIdx, "companyLine", e.target.value)
                    }
                  />
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Duration (e.g., 10 months)"
                    value={exp.duration}
                    onChange={(e) =>
                      updateCompanyField(expIdx, "duration", e.target.value)
                    }
                  />
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Date range (e.g., Aug’24 – Present)"
                    value={exp.dateRange}
                    onChange={(e) =>
                      updateCompanyField(expIdx, "dateRange", e.target.value)
                    }
                  />
                </div>

                <div className="mt-4 space-y-4">
                  {exp.rows.map((row, rowIdx) => (
                    <div
                      key={rowIdx}
                      className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Sub-role {rowIdx + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addBullet(expIdx, rowIdx)}
                            className="text-xs font-semibold text-[#002b5b] hover:underline dark:text-teal-300"
                          >
                            + Bullet
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRow(expIdx, rowIdx)}
                            className="text-xs font-semibold text-red-600 hover:text-red-700"
                          >
                            Remove Row
                          </button>
                        </div>
                      </div>

                      <input
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        placeholder="Work area / sub-role (e.g., Treasury / Strategy @ CEO Office)"
                        value={row.leftLabel}
                        onChange={(e) =>
                          updateRowLabel(expIdx, rowIdx, e.target.value)
                        }
                      />

                      <div className="mt-3 space-y-2">
                        {row.bullets.map((b, bulletIdx) => {
                          const k = `${expIdx}-${rowIdx}-${bulletIdx}`;
                          const isLoading = aiLoadingKey === k;

                          return (
                            <div
                              key={bulletIdx}
                              className="rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                            >
                              <textarea
                                rows={2}
                                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                                placeholder="Impact bullet (1 line preferred)"
                                value={b.text}
                                onChange={(e) =>
                                  updateBulletText(
                                    expIdx,
                                    rowIdx,
                                    bulletIdx,
                                    e.target.value
                                  )
                                }
                              />

                              <div className="mt-2 flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeBullet(expIdx, rowIdx, bulletIdx)
                                  }
                                  className="text-xs font-semibold text-red-600 hover:text-red-700"
                                >
                                  Remove Bullet
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRewrite(expIdx, rowIdx, bulletIdx)
                                  }
                                  disabled={
                                    isLoading || !String(b.text || "").trim()
                                  }
                                  className={[
                                    "rounded-md px-3 py-1.5 text-xs font-semibold text-white",
                                    "bg-[#002b5b] hover:bg-[#003b7a]",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-slate-950",
                                  ].join(" ")}
                                >
                                  {isLoading
                                    ? "Rewriting..."
                                    : "Rewrite With Admit55 Ai"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addRow(expIdx)}
                    className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    + Add Sub-role Row
                  </button>
                </div>
              </div>
            ))}
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

        {/* RIGHT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Live Preview (Consulting Classic)
            </div>
          </div>

          <ConsultingClassicPreview data={previewData as any} />
        </div>
      </div>
    </div>
  );
}
