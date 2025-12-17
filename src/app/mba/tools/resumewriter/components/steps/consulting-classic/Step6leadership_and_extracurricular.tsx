// src/app/mba/tools/resumewriter/components/steps/consulting-classic/Step6leadership_and_extracurricular.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { StepComponentProps } from "../registry";
import ConsultingClassicPreview from "../../../components/resume-templates/consulting-classic/ConsultingClassicPreview";
import { rewriteWorkBullet } from "../../../ai/rewriteWorkBullet";

/* -------------------- Types (LOCAL: no import path issues) -------------------- */

type Bullet = { text: string; highlights?: string[] };

type LeadershipRow = {
  role?: string; // only for verticalCategory blocks (IIMA Clubs)
  bullets: Bullet[];
  year?: string;
};

export type LeadershipBlock = {
  verticalCategory?: boolean;
  category: string;
  rows: LeadershipRow[];
};

/* -------------------- Defaults -------------------- */

const DEFAULT_HIGHLIGHTS = [
  "Cars24 Arabia (UAE)",
  "Alvarez & Marsal (India)",
  "IIM Ahmedabad",
  "Chartered Accountant",
  "Grant Thornton Bharat LLP",
];

const DEFAULT_TITLE = "POSITIONS OF RESPONSIBILITY & EXTRACURRICULAR ACTIVITIES";

const DEFAULT_BLOCKS: LeadershipBlock[] = [
  {
    category: "IIMA Clubs",
    verticalCategory: true,
    rows: [
      {
        role: "GMLC\n(Career Club)",
        year: "2022",
        bullets: [
          {
            text: "Conducted Mock GDs & PI for 130+ students; organized CV reviews for 50+ first year students",
            highlights: ["Mock GDs & PI", "130+", "50+"],
          },
          {
            text: "Guided 1st year students to create KYC (35+ Cos) & News Repo. for placement (Reach: 350+ students)",
            highlights: ["KYC", "35+ Cos", "350+"],
          },
        ],
      },
      {
        role: "Prayaas\n(A Social\nInitiative)",
        year: "2022",
        bullets: [
          {
            text: "Finance Control cell head: Funds Managed ~$9.6k; Mentored 3 underprivileged CA students",
            highlights: ["Funds Managed", "~$9.6k", "Mentored 3"],
          },
          {
            text: "POC (Finance) for ADAI: Prayaas's Flagship event; Funds Managed: ~$3.6k, Footfall: ~225",
            highlights: ["POC (Finance)", "ADAI", "~$3.6k", "~225"],
          },
          {
            text: "Handled school fees sponsorship of 30+ students (~$3.6k); Buttermilk Initiative fund ~$1.8k",
            highlights: ["30+ students", "~$3.6k", "~$1.8k"],
          },
        ],
      },
    ],
  },
  {
    category: "School (POR)",
    rows: [
      {
        year: "2010",
        bullets: [
          {
            text: "Prefect in Student Council, Led 300+ students | Vice-Captain of Indoor Cricket House Team",
            highlights: ["Prefect", "Led 300+", "Vice-Captain"],
          },
        ],
      },
    ],
  },
  {
    category: "Social Service",
    rows: [
      {
        year: "2020–Present",
        bullets: [
          {
            text: "Sponsored a Girl Child Education (World Vision India) since 2020 | Assisted kids of Bal Sahyog, Orphanage",
            highlights: ["Girl Child Education", "World Vision India", "Bal Sahyog"],
          },
        ],
      },
    ],
  },
];

function cleanStr(v: unknown) {
  return (v ?? "").toString();
}

function ensureBlocks(x: unknown): LeadershipBlock[] {
  const arr = Array.isArray(x) ? x : [];
  const safe: LeadershipBlock[] = arr
    .map((b: any) => {
      const rows = Array.isArray(b?.rows) ? b.rows : [];
      return {
        verticalCategory: !!b?.verticalCategory,
        category: cleanStr(b?.category),
        rows: rows
          .map((r: any) => ({
            role: cleanStr(r?.role),
            year: cleanStr(r?.year),
            bullets: Array.isArray(r?.bullets)
              ? r.bullets
                  .map((bul: any) => ({
                    text: cleanStr(bul?.text),
                    highlights: Array.isArray(bul?.highlights)
                      ? bul.highlights.map((h: any) => cleanStr(h))
                      : [],
                  }))
                  .filter((bul: Bullet) => bul.text.trim().length > 0)
              : [],
          }))
          .filter(
            (r: LeadershipRow) =>
              (r.bullets?.length ?? 0) > 0 || !!r.role?.trim() || !!r.year?.trim()
          ),
      } as LeadershipBlock;
    })
    .filter((b: LeadershipBlock) => !!b.category.trim() || (b.rows?.length ?? 0) > 0);

  return safe.length ? safe : DEFAULT_BLOCKS;
}

/* -------------------- Step Component -------------------- */

export default function Step6leadership_and_extracurricular({
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

  const articleSectionTitle = cleanStr((draft as any)?.resume?.articleSectionTitle);
  const articleHeaderRight = cleanStr((draft as any)?.resume?.articleHeaderRight);
  const articleBlocks = Array.isArray((draft as any)?.resume?.articleBlocks)
    ? ((draft as any).resume.articleBlocks as any[])
    : [];

  const sectionTitle =
    cleanStr((draft as any)?.resume?.leadershipSectionTitle) || DEFAULT_TITLE;

  const leadershipBlocks: LeadershipBlock[] = ensureBlocks(
    (draft as any)?.resume?.leadershipBlocks
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

  const setBlocks = (next: LeadershipBlock[]) => save({ leadershipBlocks: next });

  // ---- Block CRUD
  const addBlock = () => {
    setBlocks([
      ...leadershipBlocks,
      { category: "", verticalCategory: false, rows: [{ year: "", bullets: [{ text: "" }] }] },
    ]);
  };

  const removeBlock = (bIdx: number) => {
    const next = leadershipBlocks.filter((_: LeadershipBlock, i: number) => i !== bIdx);
    setBlocks(next.length ? next : DEFAULT_BLOCKS);
  };

  const updateBlock = (bIdx: number, patch: Partial<LeadershipBlock>) => {
    const next = [...leadershipBlocks];
    next[bIdx] = { ...(next[bIdx] ?? ({} as LeadershipBlock)), ...patch };
    setBlocks(next);
  };

  // ---- Row CRUD
  const addRow = (bIdx: number) => {
    const next = [...leadershipBlocks];
    const block = next[bIdx] ?? { category: "", rows: [] };
    const rows = Array.isArray(block.rows) ? [...block.rows] : [];
    rows.push({ role: "", year: "", bullets: [{ text: "" }] });
    next[bIdx] = { ...block, rows };
    setBlocks(next);
  };

  const removeRow = (bIdx: number, rIdx: number) => {
    const next = [...leadershipBlocks];
    const block = next[bIdx];
    const rows = (block?.rows ?? []).filter((_: LeadershipRow, i: number) => i !== rIdx);
    next[bIdx] = {
      ...block!,
      rows: rows.length ? rows : [{ role: "", year: "", bullets: [{ text: "" }] }],
    };
    setBlocks(next);
  };

  const updateRow = (bIdx: number, rIdx: number, patch: Partial<LeadershipRow>) => {
    const next = [...leadershipBlocks];
    const block = next[bIdx] ?? { category: "", rows: [] };
    const rows = Array.isArray(block.rows) ? [...block.rows] : [];
    rows[rIdx] = { ...(rows[rIdx] ?? { role: "", year: "", bullets: [{ text: "" }] }), ...patch };
    next[bIdx] = { ...block, rows };
    setBlocks(next);
  };

  // ---- Bullet CRUD
  const addBullet = (bIdx: number, rIdx: number) => {
    const next = [...leadershipBlocks];
    const block = next[bIdx]!;
    const rows = [...(block.rows ?? [])];
    const row = rows[rIdx] ?? { role: "", year: "", bullets: [] };
    const bullets = Array.isArray(row.bullets) ? [...row.bullets] : [];
    bullets.push({ text: "" });
    rows[rIdx] = { ...row, bullets };
    next[bIdx] = { ...block, rows };
    setBlocks(next);
  };

  const removeBullet = (bIdx: number, rIdx: number, kIdx: number) => {
    const next = [...leadershipBlocks];
    const block = next[bIdx]!;
    const rows = [...(block.rows ?? [])];
    const row = rows[rIdx] ?? { role: "", year: "", bullets: [] };
    const bullets = (row.bullets ?? []).filter((_: Bullet, i: number) => i !== kIdx);
    rows[rIdx] = { ...row, bullets: bullets.length ? bullets : [{ text: "" }] };
    next[bIdx] = { ...block, rows };
    setBlocks(next);
  };

  const updateBullet = (bIdx: number, rIdx: number, kIdx: number, patch: Partial<Bullet>) => {
    const next = [...leadershipBlocks];
    const block = next[bIdx]!;
    const rows = [...(block.rows ?? [])];
    const row = rows[rIdx] ?? { role: "", year: "", bullets: [] };
    const bullets = Array.isArray(row.bullets) ? [...row.bullets] : [];
    bullets[kIdx] = { ...(bullets[kIdx] ?? { text: "" }), ...patch };
    rows[rIdx] = { ...row, bullets };
    next[bIdx] = { ...block, rows };
    setBlocks(next);
  };

  // ---- AI rewrite
  const handleRewrite = async (bIdx: number, rIdx: number, kIdx: number) => {
    const key = `${bIdx}-${rIdx}-${kIdx}`;
    setAiLoadingKey(key);
    try {
      const raw =
        leadershipBlocks?.[bIdx]?.rows?.[rIdx]?.bullets?.[kIdx]?.text ?? "";

      const track =
        (draft as any)?.intent?.track ??
        (draft as any)?.intent?.targetTrack ??
        (draft as any)?.intent?.persona ??
        "";

      const res = await rewriteWorkBullet({
        raw,
        track,
        targetCompanyOrTeam: "Leadership / POR",
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

  // ---- Preview data
  const previewData = useMemo(() => {
    const fullName = `${basic.firstName ?? ""} ${basic.lastName ?? ""}`.trim();

    const rawMeta = Array.isArray(basic.metaBar) ? basic.metaBar : [];
    const cleanedMeta = rawMeta.map((s: any) => (s ?? "").trim()).filter(Boolean);
    const metaBarForPreview = cleanedMeta.length ? cleanedMeta.slice(0, 5) : DEFAULT_HIGHLIGHTS;

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

      articleSectionTitle,
      articleHeaderRight,
      articleBlocks,

      leadershipSectionTitle: sectionTitle,
      leadershipBlocks,
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
    articleSectionTitle,
    articleHeaderRight,
    articleBlocks,
    sectionTitle,
    leadershipBlocks,
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Step 6 — Leadership / POR / Extracurricular
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Make “IIMA Clubs” as a vertical-category block (multiple rows with role + bullets + year),
                and normal blocks like “School (POR)” / “Social Service”.
              </p>
            </div>

            <button
              type="button"
              onClick={addBlock}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              + Add Block
            </button>
          </div>

          {/* Title */}
          <div className="mt-5">
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Section title
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={sectionTitle}
              onChange={(e) => save({ leadershipSectionTitle: e.target.value })}
            />
          </div>

          {/* Blocks */}
          <div className="mt-6 space-y-5">
            {leadershipBlocks.map((block, bIdx) => {
              const isVertical = !!block.verticalCategory;
              const rows =
                Array.isArray(block.rows) && block.rows.length
                  ? block.rows
                  : [{ role: "", year: "", bullets: [{ text: "" }] }];

              return (
                <div
                  key={bIdx}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                      Block {bIdx + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBlock(bIdx)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Remove Block
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_260px]">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Category
                      </label>
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        placeholder="e.g., IIMA Clubs / School (POR) / Social Service"
                        value={block.category}
                        onChange={(e) => updateBlock(bIdx, { category: e.target.value })}
                      />
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={isVertical}
                          onChange={(e) =>
                            updateBlock(bIdx, {
                              verticalCategory: e.target.checked,
                              rows: e.target.checked ? rows : [rows[0]], // keep first row if non-vertical
                            })
                          }
                        />
                        Vertical category (IIMA Clubs style)
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {isVertical ? "Rows (role + bullets + year)" : "Single row (bullets + year)"}
                    </div>
                    {isVertical ? (
                      <button
                        type="button"
                        onClick={() => addRow(bIdx)}
                        className="text-xs font-semibold text-[#002b5b] hover:underline dark:text-teal-300"
                      >
                        + Add Row
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-3">
                    {rows.map((row, rIdx) => {
                      const bullets =
                        Array.isArray(row.bullets) && row.bullets.length
                          ? row.bullets
                          : [{ text: "" }];

                      return (
                        <div
                          key={rIdx}
                          className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-50">
                              Row {rIdx + 1}
                            </div>
                            {isVertical ? (
                              <button
                                type="button"
                                onClick={() => removeRow(bIdx, rIdx)}
                                className="text-xs font-semibold text-red-600 hover:text-red-700"
                              >
                                Remove Row
                              </button>
                            ) : null}
                          </div>

                          {isVertical ? (
                            <textarea
                              rows={2}
                              className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                              placeholder={"Role (supports \\n)\ne.g.\nGMLC\n(Career Club)"}
                              value={row.role ?? ""}
                              onChange={(e) => updateRow(bIdx, rIdx, { role: e.target.value })}
                            />
                          ) : null}

                          <div className="mt-2">
                            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                              Year / Date
                            </label>
                            <input
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                              placeholder="e.g. 2022 / 2020–Present"
                              value={row.year ?? ""}
                              onChange={(e) => updateRow(bIdx, rIdx, { year: e.target.value })}
                            />
                          </div>

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
                            {bullets.map((bul, kIdx) => {
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
                                    value={bul.text ?? ""}
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
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nav */}
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
