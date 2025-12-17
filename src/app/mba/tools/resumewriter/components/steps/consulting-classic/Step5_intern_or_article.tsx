// src/app/mba/tools/resumewriter/components/steps/consulting-classic/Step5_intern_or_article.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { StepComponentProps } from "../registry";
import ConsultingClassicPreview from "../../../components/resume-templates/consulting-classic/ConsultingClassicPreview";
import { rewriteWorkBullet } from "../../../ai/rewriteWorkBullet";

type Bullet = {
  text: string;
  highlights?: string[];
};

type ArticleRow = {
  leftLabel: string; // e.g. "Statutory Audit"
  bullets: Bullet[];
};

export type ArticleBlock = {
  companyLine: string;
  duration: string; // e.g. "20 months"
  dateRange: string; // e.g. "Nov’13 - Jul’15"
  rows?: ArticleRow[];
};

const DEFAULT_HIGHLIGHTS = [
  "Cars24 Arabia (UAE)",
  "Alvarez & Marsal (India)",
  "IIM Ahmedabad",
  "Chartered Accountant",
  "Grant Thornton Bharat LLP",
];

const DEFAULT_TITLE_OPTIONS = [
  "ARTICLESHIP EXPERIENCE",
  "INTERNSHIP EXPERIENCE",
] as const;

const DEFAULT_SECTION_TITLE: (typeof DEFAULT_TITLE_OPTIONS)[number] =
  "ARTICLESHIP EXPERIENCE";

const DEFAULT_HEADER_RIGHT = "36 months";

const DEFAULT_ITEMS: ArticleBlock[] = [
  {
    companyLine:
      "Dhanda Rajendra & Co. (Loan staff Trainee at Grant Thornton Bharat LLP)",
    duration: "20 months",
    dateRange: "Nov’13 - Jul’15",
    rows: [
      {
        leftLabel: "Statutory Audit",
        bullets: [
          {
            text: "Led 2-4 members team | Limited Review, Year-end Stat & Tax Audit for listed and unlisted clients",
            highlights: [
              "Led 2-4 members team",
              "Limited Review",
              "Year-end Stat & Tax Audit",
            ],
          },
          {
            text: "Exposure of 5+ diverse sectors; Key sectors: Construction, Food & Beverages, Jewellery, Apparel",
            highlights: [
              "5+ diverse sectors",
              "Construction",
              "Food & Beverages",
              "Jewellery",
              "Apparel",
            ],
          },
        ],
      },
    ],
  },
  {
    companyLine: "Dhanda Rajendra & Co. - Trainee, Tax and Audit",
    duration: "16 months",
    dateRange: "Jul’15 - Oct’16",
    rows: [
      {
        leftLabel: "Responsibilities",
        bullets: [{ text: "Handled direct and indirect tax filings and audit support." }],
      },
    ],
  },
];

function cleanStr(v: any) {
  return (v ?? "").toString();
}

function ensureArticleBlocks(x: any): ArticleBlock[] {
  const arr = Array.isArray(x) ? x : [];
  const safe = arr
    .map((b: any) => ({
      companyLine: cleanStr(b?.companyLine),
      duration: cleanStr(b?.duration),
      dateRange: cleanStr(b?.dateRange),
      rows: Array.isArray(b?.rows)
        ? b.rows
            .map((r: any) => ({
              leftLabel: cleanStr(r?.leftLabel),
              bullets: Array.isArray(r?.bullets)
                ? r.bullets
                    .map((bul: any) => ({
                      text: cleanStr(bul?.text),
                      highlights: Array.isArray(bul?.highlights)
                        ? bul.highlights.map(cleanStr)
                        : [],
                    }))
                    .filter((bul: Bullet) => bul.text.trim())
                : [],
            }))
            .filter((r: ArticleRow) => r.leftLabel.trim() || r.bullets.length)
        : [],
    }))
    .filter((b: ArticleBlock) => b.companyLine.trim() || b.duration.trim() || b.dateRange.trim());

  return safe.length ? safe : DEFAULT_ITEMS;
}

export default function Step5_intern_or_article({
  draft,
  setDraft,
  onNext,
  onPrev,
}: StepComponentProps) {
  const basic = draft?.resume?.basicInfo ?? {};

  const educationRows = Array.isArray((draft as any)?.resume?.educationRows)
    ? ((draft as any).resume.educationRows as any[])
    : [];

  const experiences = Array.isArray((draft as any)?.resume?.experiences)
    ? ((draft as any).resume.experiences as any[])
    : [];

  const scholasticBlocks = Array.isArray((draft as any)?.resume?.scholasticBlocks)
    ? ((draft as any).resume.scholasticBlocks as any[])
    : [];

  const sectionTitle =
    cleanStr((draft as any)?.resume?.articleSectionTitle) || DEFAULT_SECTION_TITLE;

  const headerRight =
    cleanStr((draft as any)?.resume?.articleHeaderRight) || DEFAULT_HEADER_RIGHT;

  const articleBlocks: ArticleBlock[] = ensureArticleBlocks(
    (draft as any)?.resume?.articleBlocks
  );

  const [aiLoadingKey, setAiLoadingKey] = useState<string | null>(null);

  const save = (patch: Record<string, any>) => {
    setDraft({
      ...draft,
      resume: {
        ...(draft.resume ?? {}),
        ...patch,
      },
    } as any);
  };

  const setBlocks = (next: ArticleBlock[]) => save({ articleBlocks: next });

  // ---------- Block CRUD ----------
  const addBlock = () => {
    setBlocks([
      ...articleBlocks,
      {
        companyLine: "",
        duration: "",
        dateRange: "",
        rows: [
          {
            leftLabel: "",
            bullets: [{ text: "" }],
          },
        ],
      },
    ]);
  };

  const removeBlock = (bIdx: number) => {
    const next = articleBlocks.filter((_, i) => i !== bIdx);
    setBlocks(next.length ? next : DEFAULT_ITEMS);
  };

  const updateBlock = (bIdx: number, patch: Partial<ArticleBlock>) => {
    const next = [...articleBlocks];
    next[bIdx] = { ...(next[bIdx] ?? ({} as ArticleBlock)), ...patch };
    setBlocks(next);
  };

  // ---------- Row CRUD ----------
  const addRow = (bIdx: number) => {
    const next = [...articleBlocks];
    const block = next[bIdx] ?? { companyLine: "", duration: "", dateRange: "", rows: [] };
    const rows = Array.isArray(block.rows) ? [...block.rows] : [];
    rows.push({ leftLabel: "", bullets: [{ text: "" }] });
    next[bIdx] = { ...block, rows };
    setBlocks(next);
  };

  const removeRow = (bIdx: number, rIdx: number) => {
    const next = [...articleBlocks];
    const block = next[bIdx];
    const rows = (block?.rows ?? []).filter((_, i) => i !== rIdx);
    next[bIdx] = { ...block, rows: rows.length ? rows : [{ leftLabel: "", bullets: [{ text: "" }] }] };
    setBlocks(next);
  };

  const updateRow = (bIdx: number, rIdx: number, patch: Partial<ArticleRow>) => {
    const next = [...articleBlocks];
    const block = next[bIdx] ?? { companyLine: "", duration: "", dateRange: "", rows: [] };
    const rows = Array.isArray(block.rows) ? [...block.rows] : [];
    rows[rIdx] = { ...(rows[rIdx] ?? { leftLabel: "", bullets: [{ text: "" }] }), ...patch };
    next[bIdx] = { ...block, rows };
    setBlocks(next);
  };

  // ---------- Bullet CRUD ----------
  const addBullet = (bIdx: number, rIdx: number) => {
    const next = [...articleBlocks];
    const block = next[bIdx];
    const rows = Array.isArray(block?.rows) ? [...(block!.rows as ArticleRow[])] : [];
    const row = rows[rIdx] ?? { leftLabel: "", bullets: [] };
    const bullets = Array.isArray(row.bullets) ? [...row.bullets] : [];
    bullets.push({ text: "" });
    rows[rIdx] = { ...row, bullets };
    next[bIdx] = { ...block!, rows };
    setBlocks(next);
  };

  const removeBullet = (bIdx: number, rIdx: number, kIdx: number) => {
    const next = [...articleBlocks];
    const block = next[bIdx];
    const rows = Array.isArray(block?.rows) ? [...(block!.rows as ArticleRow[])] : [];
    const row = rows[rIdx] ?? { leftLabel: "", bullets: [] };
    const bullets = (row.bullets ?? []).filter((_, i) => i !== kIdx);
    rows[rIdx] = { ...row, bullets: bullets.length ? bullets : [{ text: "" }] };
    next[bIdx] = { ...block!, rows };
    setBlocks(next);
  };

  const updateBullet = (
    bIdx: number,
    rIdx: number,
    kIdx: number,
    patch: Partial<Bullet>
  ) => {
    const next = [...articleBlocks];
    const block = next[bIdx];
    const rows = Array.isArray(block?.rows) ? [...(block!.rows as ArticleRow[])] : [];
    const row = rows[rIdx] ?? { leftLabel: "", bullets: [] };
    const bullets = Array.isArray(row.bullets) ? [...row.bullets] : [];
    bullets[kIdx] = { ...(bullets[kIdx] ?? { text: "" }), ...patch };
    rows[rIdx] = { ...row, bullets };
    next[bIdx] = { ...block!, rows };
    setBlocks(next);
  };

  // ---------- AI Rewrite ----------
  const handleRewrite = async (bIdx: number, rIdx: number, kIdx: number) => {
    const key = `${bIdx}-${rIdx}-${kIdx}`;
    setAiLoadingKey(key);

    try {
      const raw = articleBlocks?.[bIdx]?.rows?.[rIdx]?.bullets?.[kIdx]?.text ?? "";

      const track =
        (draft as any)?.intent?.track ??
        (draft as any)?.intent?.targetTrack ??
        (draft as any)?.intent?.persona ??
        "";

      const res = await rewriteWorkBullet({
        raw,
        track,
        targetCompanyOrTeam: sectionTitle,
        targetRole: "MBA Candidate",
      });

      if (res?.ok && res.rewritten) {
        updateBullet(bIdx, rIdx, kIdx, {
          text: res.rewritten,
          highlights: res.highlights ?? [],
        });
      }
    } finally {
      setAiLoadingKey(null);
    }
  };

  // ---------- Preview Data ----------
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
      educationRows,
      experiences,
      scholasticBlocks,

      // ✅ Step5 data (template wiring required to reflect live)
      articleSectionTitle: sectionTitle,
      articleHeaderRight: headerRight,
      articleBlocks,
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
    experiences,
    scholasticBlocks,
    sectionTitle,
    headerRight,
    articleBlocks,
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Step 5 — Articleship / Internship
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Header has a title (Articleship/Internship) + total months. Each entry has
                company + duration + date range, then role rows with bullet points. Includes
                “Write with Admit55 AI” per bullet.
              </p>
            </div>

            <button
              type="button"
              onClick={addBlock}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              + Add Entry
            </button>
          </div>

          {/* Header controls */}
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Section title
              </label>
              <select
                value={DEFAULT_TITLE_OPTIONS.includes(sectionTitle as any) ? sectionTitle : DEFAULT_SECTION_TITLE}
                onChange={(e) => save({ articleSectionTitle: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                {DEFAULT_TITLE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* optional manual override */}
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="Or type a custom heading..."
                value={sectionTitle}
                onChange={(e) => save({ articleSectionTitle: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Header right (total)
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="e.g. 36 months"
                value={headerRight}
                onChange={(e) => save({ articleHeaderRight: e.target.value })}
              />
            </div>
          </div>

          {/* Entries */}
          <div className="mt-6 space-y-5">
            {articleBlocks.map((block, bIdx) => (
              <div
                key={bIdx}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    Entry {bIdx + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBlock(bIdx)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Remove Entry
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px_160px]">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Company line
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Company / firm / internship org"
                      value={block.companyLine}
                      onChange={(e) => updateBlock(bIdx, { companyLine: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Duration
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="e.g. 20 months"
                      value={block.duration}
                      onChange={(e) => updateBlock(bIdx, { duration: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Date range
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="e.g. Nov’13 - Jul’15"
                      value={block.dateRange}
                      onChange={(e) => updateBlock(bIdx, { dateRange: e.target.value })}
                    />
                  </div>
                </div>

                {/* Rows */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Role rows (left label + bullets)
                  </div>
                  <button
                    type="button"
                    onClick={() => addRow(bIdx)}
                    className="text-xs font-semibold text-[#002b5b] hover:underline dark:text-teal-300"
                  >
                    + Add Role Row
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {(block.rows ?? [{ leftLabel: "", bullets: [{ text: "" }] }]).map((row, rIdx) => (
                    <div
                      key={rIdx}
                      className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-50">
                          Row {rIdx + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRow(bIdx, rIdx)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Remove Row
                        </button>
                      </div>

                      <input
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        placeholder={"Left label (role/area) e.g.\nStatutory Audit"}
                        value={row.leftLabel}
                        onChange={(e) => updateRow(bIdx, rIdx, { leftLabel: e.target.value })}
                      />

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Bullets
                        </div>
                        <button
                          type="button"
                          onClick={() => addBullet(bIdx, rIdx)}
                          className="text-xs font-semibold text-[#002b5b] hover:underline dark:text-teal-300"
                        >
                          + Add Bullet
                        </button>
                      </div>

                      <div className="mt-2 space-y-2">
                        {(row.bullets ?? [{ text: "" }]).map((bul, kIdx) => {
                          const key = `${bIdx}-${rIdx}-${kIdx}`;
                          const isLoading = aiLoadingKey === key;

                          return (
                            <div
                              key={kIdx}
                              className="rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                            >
                              <textarea
                                rows={2}
                                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                                placeholder="Bullet (1 line preferred)"
                                value={bul.text}
                                onChange={(e) =>
                                  updateBullet(bIdx, rIdx, kIdx, { text: e.target.value })
                                }
                              />

                              <div className="mt-2 flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => removeBullet(bIdx, rIdx, kIdx)}
                                  className="text-xs font-semibold text-red-600 hover:text-red-700"
                                >
                                  Remove Bullet
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRewrite(bIdx, rIdx, kIdx)}
                                  disabled={isLoading || !String(bul.text || "").trim()}
                                  className={[
                                    "rounded-md px-3 py-1.5 text-xs font-semibold text-white",
                                    "bg-[#002b5b] hover:bg-[#003b7a]",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-slate-950",
                                  ].join(" ")}
                                >
                                  {isLoading ? "Rewriting..." : "Write With Admit55 AI"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom nav */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={onPrev}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onNext}
              className="rounded-md bg-[#002b5b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#003b7a]"
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
