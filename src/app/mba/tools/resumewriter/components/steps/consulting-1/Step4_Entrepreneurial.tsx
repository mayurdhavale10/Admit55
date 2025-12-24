// src/app/mba/tools/resumewriter/components/steps/consulting-1/Step4_Entrepreneurial.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { StepComponentProps } from "../registry";

import Classic1Preview from "../../resume-templates/consulting-1/Classic1Preview";

type InitiativeItem = {
  id: string;
  titleLeft: string; // user can type **bold**
  dateRight: string;
  subtitle: string;
  bullets: string[];
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Math.random().toString(16).slice(2)}`;

const vstr = (v: unknown) => (v ?? "").toString();
const cleanStr = (v: unknown) => vstr(v).trim();

export default function Step4_Entrepreneurial_Consulting1({
  draft,
  setDraft,
  onNext,
  onPrev,
}: StepComponentProps) {
  const resume = (draft as any)?.resume ?? {};

  const initialItems = useMemo<InitiativeItem[]>(() => {
    // ✅ primary: consulting1Initiatives (array used by template)
    const saved = resume?.consulting1Initiatives;
    if (Array.isArray(saved) && saved.length) {
      return saved.map((x: any) => ({
        id: vstr(x.id) || uid(),
        titleLeft: vstr(x.titleLeft),
        dateRight: vstr(x.dateRight),
        subtitle: vstr(x.subtitle),
        bullets: Array.isArray(x.bullets) ? x.bullets.map(vstr) : [],
      }));
    }

    // ✅ legacy migration (your old step stored in consulting1Entrepreneurial)
    const legacy = resume?.consulting1Entrepreneurial?.items;
    if (Array.isArray(legacy) && legacy.length) {
      return legacy.map((x: any) => ({
        id: vstr(x.id) || uid(),
        titleLeft: vstr(x.titleLine ?? x.titleLeft),
        dateRight: vstr(x.dateRange ?? x.dateRight),
        subtitle: vstr(x.roleLine ?? x.subtitle),
        bullets: Array.isArray(x.bullets) ? x.bullets.map(vstr) : [],
      }));
    }

    // Defaults (user can add **bold** anytime)
    return [
      {
        id: uid(),
        titleLeft: "**Author** | 55 Successful ISB Essays and Their Analysis",
        dateRight: "Dec’19 – Dec’20",
        subtitle:
          "Authored a best-selling book for MBA aspirants; published on Amazon - link",
        bullets: ["Sold ~1K+ copies within 1 year of launch; 4.5 rating"],
      },
      {
        id: uid(),
        titleLeft: "**Bootcamp, Gurgaon** | Education Consulting | Founding Member",
        dateRight: "Oct’16 – Apr’17",
        subtitle:
          "Application consultancy to help prospective MBA candidates secure admission to top global B-schools",
        bullets: ["Annual revenue ~ INR 55L"],
      },
      {
        id: uid(),
        titleLeft: "**TuneUp, Netherlands** | Music Analytics | Founder",
        dateRight: "Feb’17 – Oct’17",
        subtitle:
          "Platform for musicians, producers, labels to analyze potential of new songs (demos); used prescriptive analytics & machine learning",
        bullets: [],
      },
    ];
  }, [resume]);

  const [items, setItems] = useState<InitiativeItem[]>(initialItems);

  const persist = (next: InitiativeItem[]) => {
    setItems(next);

    (setDraft as any)({
      ...(draft as any),
      resume: {
        ...resume,
        consulting1InitiativesHeading:
          resume?.consulting1InitiativesHeading || "ENTREPRENEURIAL INITIATIVES",
        consulting1Initiatives: next,
      },
    });
  };

  const addItem = () => {
    persist([
      ...items,
      {
        id: uid(),
        titleLeft: "",
        dateRight: "",
        subtitle: "",
        bullets: [""],
      },
    ]);
  };

  const removeItem = (id: string) => persist(items.filter((x) => x.id !== id));

  const updateItem = (id: string, patch: Partial<InitiativeItem>) => {
    persist(items.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const addBullet = (id: string) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    updateItem(id, { bullets: [...(it.bullets ?? []), ""] });
  };

  const updateBullet = (id: string, idx: number, val: string) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const next = [...(it.bullets ?? [])];
    next[idx] = vstr(val);
    updateItem(id, { bullets: next });
  };

  const removeBullet = (id: string, idx: number) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    updateItem(id, { bullets: (it.bullets ?? []).filter((_, i) => i !== idx) });
  };

  // Preview mapping (Classic1Preview expects template keys)
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

      initiativesHeading:
        resume?.consulting1InitiativesHeading || "ENTREPRENEURIAL INITIATIVES",
      initiatives: items.map((it) => ({
        titleLeft: vstr(it.titleLeft), // keep **...**
        dateRight: cleanStr(it.dateRight),
        subtitle: cleanStr(it.subtitle),
        bullets: (it.bullets ?? []).map(cleanStr).filter(Boolean),
      })),
    };
  }, [header, summary, items, resume?.consulting1InitiativesHeading]);

  const canContinue =
    items.some((x) => cleanStr(x.titleLeft)) || items.some((x) => cleanStr(x.subtitle));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT */}
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                Step 4 — Entrepreneurial Initiatives
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Add books, ventures, side projects, and measurable outcomes.
              </p>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="rounded-xl bg-[#002b5b] px-4 py-2 text-sm font-semibold text-white"
            >
              + Add entry
            </button>
          </div>

          {items.map((it, idx) => (
            <div
              key={it.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                    Entry #{idx + 1}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Title + date + one-liner + bullets (optional)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-1">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder='Title (left). Use **text** to bold.'
                  value={vstr(it.titleLeft)}
                  onChange={(e) => updateItem(it.id, { titleLeft: vstr(e.target.value) })}
                />
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tip: Wrap text like <span className="font-mono">**Author**</span> to make it bold in the preview.
                </div>
              </div>

              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="Date (right)"
                value={vstr(it.dateRight)}
                onChange={(e) => updateItem(it.id, { dateRight: vstr(e.target.value) })}
              />

              <textarea
                className="w-full min-h-[88px] rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="One-liner (subtitle)"
                value={vstr(it.subtitle)}
                onChange={(e) => updateItem(it.id, { subtitle: vstr(e.target.value) })}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Bullets (optional)
                  </div>
                  <button
                    type="button"
                    onClick={() => addBullet(it.id)}
                    className="text-xs font-semibold text-[#0b5cff] hover:underline"
                  >
                    + Add bullet
                  </button>
                </div>

                {(it.bullets ?? []).map((b, bi) => (
                  <div key={`${it.id}-b-${bi}`} className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Bullet"
                      value={vstr(b)}
                      onChange={(e) => updateBullet(it.id, bi, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeBullet(it.id, bi)}
                      className="rounded-lg border border-slate-200 px-3 text-xs text-red-600 dark:border-slate-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

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
