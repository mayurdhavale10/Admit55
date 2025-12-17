"use client";

import React, { useMemo, useState } from "react";
import type { StepComponentProps } from "../registry";
import ConsultingClassicPreview from "../../../components/resume-templates/consulting-classic/ConsultingClassicPreview";
import { rewriteWorkBullet } from "../../../ai/rewriteWorkBullet";

type ScholasticItem = {
  text: string;
  year: string;
  highlights?: string[];
};

type ScholasticBlock = {
  leftLabel: string; // supports \n
  items: ScholasticItem[];
};

const DEFAULT_HIGHLIGHTS = [
  "Cars24 Arabia (UAE)",
  "Alvarez & Marsal (India)",
  "IIM Ahmedabad",
  "Chartered Accountant",
  "Grant Thornton Bharat LLP",
];

const DEFAULT_BLOCKS: ScholasticBlock[] = [
  {
    leftLabel: "Case\nCompetitions",
    items: [
      {
        text: "National Winners: 1st out of 200+ teams at a market expansion strategy competition by 180DC NITK",
        year: "2022",
        highlights: ["National Winners:"],
      },
      {
        text: "Semi-Finalist (1/12 out of 35 teams) in Multiple Mania (Avendus), stock pitch competition at IIMA",
        year: "2021",
        highlights: ["Semi-Finalist"],
      },
    ],
  },
  {
    leftLabel: "Certifications",
    items: [
      {
        text: "Completed Financial Markets course (93.77%) from Yale University by Prof Robert J. Shiller",
        year: "2023",
        highlights: ["Financial Markets", "93.77%", "Yale University", "Prof Robert J. Shiller"],
      },
      {
        text: "Completed Corporate Strategy course (88.91%) by UCL school of Mgmt. & University of London",
        year: "2022",
        highlights: ["Corporate Strategy", "88.91%", "UCL", "University of London"],
      },
    ],
  },
];

function cleanStr(v: any) {
  return (v ?? "").toString();
}

function ensureBlocks(x: any): ScholasticBlock[] {
  const arr = Array.isArray(x) ? x : [];
  const safe = arr
    .map((b: any) => ({
      leftLabel: cleanStr(b?.leftLabel),
      items: Array.isArray(b?.items)
        ? b.items.map((it: any) => ({
            text: cleanStr(it?.text),
            year: cleanStr(it?.year),
            highlights: Array.isArray(it?.highlights) ? it.highlights.map(cleanStr) : [],
          }))
        : [],
    }))
    .filter((b) => b.leftLabel || b.items.length);

  return safe.length ? safe : DEFAULT_BLOCKS;
}

export default function Step4_ScholasticAchievements_ConsultingClassic({
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

  const scholasticBlocks: ScholasticBlock[] = ensureBlocks(
    (draft as any)?.resume?.scholasticBlocks
  );

  const [aiLoadingKey, setAiLoadingKey] = useState<string | null>(null);

  const setBlocks = (next: ScholasticBlock[]) => {
    setDraft({
      ...draft,
      resume: {
        ...(draft.resume ?? {}),
        scholasticBlocks: next,
      },
    } as any);
  };

  const updateLeftLabel = (bIdx: number, value: string) => {
    const next = [...scholasticBlocks];
    next[bIdx] = { ...(next[bIdx] ?? { leftLabel: "", items: [] }), leftLabel: value };
    setBlocks(next);
  };

  const updateItem = (bIdx: number, iIdx: number, patch: Partial<ScholasticItem>) => {
    const next = [...scholasticBlocks];
    const block = next[bIdx] ?? { leftLabel: "", items: [] };
    const items = Array.isArray(block.items) ? [...block.items] : [];
    items[iIdx] = { ...(items[iIdx] ?? { text: "", year: "" }), ...patch };
    next[bIdx] = { ...block, items };
    setBlocks(next);
  };

  const addBlock = () => setBlocks([...scholasticBlocks, { leftLabel: "", items: [{ text: "", year: "" }] }]);
  const removeBlock = (bIdx: number) => {
    const next = scholasticBlocks.filter((_, i) => i !== bIdx);
    setBlocks(next.length ? next : DEFAULT_BLOCKS);
  };

  const addItem = (bIdx: number) => {
    const next = [...scholasticBlocks];
    const block = next[bIdx] ?? { leftLabel: "", items: [] };
    const items = Array.isArray(block.items) ? [...block.items] : [];
    items.push({ text: "", year: "" });
    next[bIdx] = { ...block, items };
    setBlocks(next);
  };

  const removeItem = (bIdx: number, iIdx: number) => {
    const next = [...scholasticBlocks];
    const block = next[bIdx] ?? { leftLabel: "", items: [] };
    const items = (block.items ?? []).filter((_, i) => i !== iIdx);
    next[bIdx] = { ...block, items: items.length ? items : [{ text: "", year: "" }] };
    setBlocks(next);
  };

  const handleRewrite = async (bIdx: number, iIdx: number) => {
    const key = `${bIdx}-${iIdx}`;
    setAiLoadingKey(key);
    try {
      const item = scholasticBlocks?.[bIdx]?.items?.[iIdx];
      const raw = item?.text ?? "";

      const track =
        (draft as any)?.intent?.track ??
        (draft as any)?.intent?.targetTrack ??
        (draft as any)?.intent?.persona ??
        "";

      const res = await rewriteWorkBullet({
        raw,
        track,
        targetCompanyOrTeam: "Scholastic Achievements",
        targetRole: "MBA Candidate",
      });

      if (res?.ok && res.rewritten) {
        updateItem(bIdx, iIdx, {
          text: res.rewritten,
          highlights: res.highlights ?? [],
        });
      }
    } finally {
      setAiLoadingKey(null);
    }
  };

  const previewData = useMemo(() => {
    const fullName = `${basic.firstName ?? ""} ${basic.lastName ?? ""}`.trim();

    const rawMeta = Array.isArray(basic.metaBar) ? basic.metaBar : [];
    const cleanedMeta = rawMeta.map((s) => (s ?? "").trim()).filter(Boolean);
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
      scholasticBlocks, // ✅ used by template later
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
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Step 4 — Scholastic Achievements
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Left column = category, middle = bullet text, right = year. Use AI to rewrite bullet text.
              </p>
            </div>

            <button
              type="button"
              onClick={addBlock}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              + Add Category
            </button>
          </div>

          <div className="mt-5 space-y-5">
            {scholasticBlocks.map((block, bIdx) => (
              <div
                key={bIdx}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    Category {bIdx + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBlock(bIdx)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <input
                  className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder={"Left label (supports \\n) e.g.\nCase\nCompetitions"}
                  value={block.leftLabel}
                  onChange={(e) => updateLeftLabel(bIdx, e.target.value)}
                />

                <div className="mt-4 space-y-3">
                  {block.items.map((it, iIdx) => {
                    const k = `${bIdx}-${iIdx}`;
                    const isLoading = aiLoadingKey === k;

                    return (
                      <div
                        key={iIdx}
                        className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                      >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px]">
                          <textarea
                            rows={2}
                            className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                            placeholder="Achievement bullet (1 line preferred)"
                            value={it.text}
                            onChange={(e) => updateItem(bIdx, iIdx, { text: e.target.value })}
                          />
                          <input
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                            placeholder="Year"
                            value={it.year}
                            onChange={(e) => updateItem(bIdx, iIdx, { year: e.target.value })}
                          />
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => removeItem(bIdx, iIdx)}
                            className="text-xs font-semibold text-red-600 hover:text-red-700"
                          >
                            Remove Item
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRewrite(bIdx, iIdx)}
                              disabled={isLoading || !String(it.text || "").trim()}
                              className={[
                                "rounded-md px-3 py-1.5 text-xs font-semibold text-white",
                                "bg-[#002b5b] hover:bg-[#003b7a]",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                "dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-slate-950",
                              ].join(" ")}
                            >
                              {isLoading ? "Rewriting..." : "Write With Admit55 AI"}
                            </button>

                            <button
                              type="button"
                              onClick={() => addItem(bIdx)}
                              className="text-xs font-semibold text-[#002b5b] hover:underline dark:text-teal-300"
                            >
                              + Item
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
