"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import type { StepComponentProps } from "../registry";
import TechClassicPreview from "../../resume-templates/tech-classic/TechClassicPreview";
import { rewriteWorkBullet } from "../../../ai/rewriteWorkBullet";

type ExperienceItem = {
  id: string;
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  summary: string;
  bullets: string[];
};

const clean = (v: unknown) => (v ?? "").toString();

function ensureLen(arr: string[], n: number) {
  const next = [...arr];
  while (next.length < n) next.push("");
  return next.slice(0, n);
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Math.random().toString(16).slice(2)}`;
}

function defaultSample(): ExperienceItem[] {
  return [
    {
      id: makeId(),
      company: "WrkSpot",
      role: "Senior Software Engineer",
      location: "Bengaluru, India",
      start: "06/2023",
      end: "Present",
      summary: "A software company providing innovative solutions in the hospitality sector",
      bullets: ensureLen(
        [
          "Designed and built an online timesheet management system with 10 microservices and IoT integration, reducing labor leakage by 30%.",
          "Integrated 4 microservices with vendor PMS APIs to unify housekeeping workflows, reducing maintenance time by 30%.",
          "Engineered a Quarkus framework that reduced development time by 50%.",
          "Achieved P99 API latency under 50ms for an online tipping solution.",
        ],
        7
      ),
    },
  ];
}

function toDraftExperience(items: ExperienceItem[]) {
  return items
    .map((it) => ({
      company: clean(it.company).trim(),
      role: clean(it.role).trim(),
      location: clean(it.location).trim(),
      start: clean(it.start).trim(),
      end: clean(it.end).trim(),
      summary: clean(it.summary).trim(),
      bullets: ensureLen(it.bullets ?? [], 7).map((b) => clean(b).trim()).filter(Boolean),
    }))
    .filter(
      (e) =>
        e.company ||
        e.role ||
        e.location ||
        e.start ||
        e.end ||
        e.summary ||
        (e.bullets?.length ?? 0) > 0
    );
}

export default function Step3_Experience_TechClassic({
  draft,
  setDraft,
  onNext,
  onPrev,
}: StepComponentProps) {
  const resume = (draft as any)?.resume ?? {};
  const isInitialMount = useRef(true);

  // Hydrate state WITHOUT calling setDraft during render
  const [items, setItems] = useState<ExperienceItem[]>(() => {
    const existing = resume.techExperience as any[];

    if (Array.isArray(existing) && existing.length) {
      return existing.map((e) => ({
        id: makeId(),
        company: clean(e.company),
        role: clean(e.role),
        location: clean(e.location),
        start: clean(e.start),
        end: clean(e.end),
        summary: clean(e.summary ?? e.summaryLine),
        bullets: ensureLen((e.bullets ?? []).map(clean), 7),
      }));
    }
    return defaultSample();
  });

  // Sync to draft AFTER mount using useEffect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Commit initial state to draft
      const nextTechExperience = toDraftExperience(items);
      setDraft({
        ...(draft as any),
        resume: {
          ...((draft as any)?.resume ?? {}),
          techExperience: nextTechExperience,
        },
      });
    }
  }, []); // Empty deps - runs once on mount

  const commitItemsToDraft = (nextItems: ExperienceItem[]) => {
    const nextTechExperience = toDraftExperience(nextItems);

    setDraft({
      ...(draft as any),
      resume: {
        ...((draft as any)?.resume ?? {}),
        techExperience: nextTechExperience,
      },
    });
  };

  const updateItem = (id: string, patch: Partial<ExperienceItem>) => {
    setItems((prev) => {
      const next = prev.map((it) => (it.id === id ? { ...it, ...patch } : it));
      commitItemsToDraft(next);
      return next;
    });
  };

  const updateBullet = (id: string, bIdx: number, value: string) => {
    setItems((prev) => {
      const next = prev.map((it) => {
        if (it.id !== id) return it;
        const bullets = ensureLen(it.bullets ?? [], 7);
        bullets[bIdx] = value;
        return { ...it, bullets };
      });
      commitItemsToDraft(next);
      return next;
    });
  };

  const addItem = () => {
    setItems((prev) => {
      const next = [
        ...prev,
        {
          id: makeId(),
          company: "",
          role: "",
          location: "",
          start: "",
          end: "",
          summary: "",
          bullets: ensureLen([], 7),
        },
      ];
      commitItemsToDraft(next);
      return next;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((x) => x.id !== id);
      const next = filtered.length ? filtered : defaultSample();
      commitItemsToDraft(next);
      return next;
    });
  };

  const rewriteAllBullets = async (id: string) => {
    const item = items.find((x) => x.id === id);
    if (!item) return;

    const rewritten: string[] = [];
    for (const b of ensureLen(item.bullets, 7)) {
      const raw = clean(b).trim();
      if (!raw) {
        rewritten.push("");
        continue;
      }
      const res = await rewriteWorkBullet({ raw, track: "tech" });
      rewritten.push(res.rewritten);
    }

    updateItem(id, { bullets: ensureLen(rewritten, 7) });
  };

  const rewriteSummaryLine = async (id: string) => {
    const item = items.find((x) => x.id === id);
    if (!item) return;

    const raw =
      clean(item.summary).trim() ||
      item.bullets.map((b) => clean(b).trim()).filter(Boolean).join(". ");

    if (!raw) return;

    const res = await rewriteWorkBullet({ raw, track: "tech" });
    updateItem(id, { summary: res.rewritten });
  };

  const canContinue = items.some((it) => clean(it.company).trim() && clean(it.role).trim());

  const previewData = useMemo(() => {
    const header = resume.techHeader ?? {};
    const summary = resume.techSummary ?? {};
    const skills = resume.techSkills ?? {};

    const experiences = items
      .map((it) => {
        const start = clean(it.start).trim();
        const end = clean(it.end).trim();
        const dateRange =
          start && end ? `${start} – ${end}` : start ? start : end ? end : "";

        return {
          company: clean(it.company).trim(),
          role: clean(it.role).trim(),
          location: clean(it.location).trim(),
          dateRange,
          summaryLine: clean(it.summary).trim(),
          bullets: ensureLen(it.bullets ?? [], 7).map((b) => clean(b).trim()).filter(Boolean),
        };
      })
      .filter(
        (e) =>
          e.company ||
          e.role ||
          e.location ||
          e.dateRange ||
          e.summaryLine ||
          (e.bullets?.length ?? 0) > 0
      );

    return {
      header: {
        name: clean(header.fullName) || "Your Name",
        title: clean(header.title) || "Your Title",
        phone: clean(header.phone),
        email: clean(header.email),
        linkedin: clean(header.links?.linkedin),
        github: clean(header.links?.github),
        portfolio: clean(header.links?.portfolio),
        location: clean(header.location),
      },
      summary: clean(summary.text),
      skills,
      experiences,
      education: Array.isArray(resume.techEducation) ? resume.techEducation : [],
      achievements: Array.isArray(resume.techAchievements) ? resume.techAchievements : [],
    };
  }, [items, resume]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Step 3 — Experience
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Fill everything first, then click Admit55 AI to rewrite (no API calls while typing).
          </p>

          <div className="mt-5 space-y-6">
            {items.map((it, idx) => {
              const bullets = ensureLen(it.bullets ?? [], 7);

              return (
                <div
                  key={it.id}
                  className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      Experience #{idx + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Company (e.g., Meesho)"
                      value={it.company}
                      onChange={(e) => updateItem(it.id, { company: e.target.value })}
                    />
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Role (e.g., SDE 2)"
                      value={it.role}
                      onChange={(e) => updateItem(it.id, { role: e.target.value })}
                    />

                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Location (e.g., Bengaluru, India)"
                      value={it.location}
                      onChange={(e) => updateItem(it.id, { location: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        placeholder="Start (MM/YYYY)"
                        value={it.start}
                        onChange={(e) => updateItem(it.id, { start: e.target.value })}
                      />
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        placeholder="End (MM/YYYY or Present)"
                        value={it.end}
                        onChange={(e) => updateItem(it.id, { end: e.target.value })}
                      />
                    </div>

                    <textarea
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 md:col-span-2"
                      placeholder="One-liner about the company/product (optional)"
                      value={it.summary}
                      onChange={(e) => updateItem(it.id, { summary: e.target.value })}
                    />
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Impact Bullets (up to 7)
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {bullets.map((b, bIdx) => (
                        <input
                          key={bIdx}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                          placeholder={`Bullet ${bIdx + 1}`}
                          value={b}
                          onChange={(e) => updateBullet(it.id, bIdx, e.target.value)}
                        />
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => rewriteAllBullets(it.id)}
                        className="rounded-lg bg-[#002b5b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#003b7a]"
                      >
                        Rewrite bullets with Admit55 AI
                      </button>
                      <button
                        type="button"
                        onClick={() => rewriteSummaryLine(it.id)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        Rewrite summary-line with AI
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addItem}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              + Add another experience
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={onPrev}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Back
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!canContinue}
              className={`rounded-xl px-6 py-3 text-sm font-semibold text-white transition
                ${
                  canContinue
                    ? "bg-[#002b5b] hover:bg-[#003b7a] shadow-[0_16px_40px_rgba(15,23,42,0.25)]"
                    : "bg-slate-400 cursor-not-allowed"
                }`}
            >
              Continue
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Live Preview (Tech Classic)
            </div>
          </div>
          <TechClassicPreview data={previewData as any} />
        </div>
      </div>
    </div>
  );
}