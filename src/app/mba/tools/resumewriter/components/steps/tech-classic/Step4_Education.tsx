"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import type { StepComponentProps } from "../registry";
import TechClassicPreview from "../../resume-templates/tech-classic/TechClassicPreview";

type EducationItem = {
  id: string;
  institute: string;
  degree: string;
  location: string;
  start: string;
  end: string;
  score: string;
  highlights: string[];
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

function defaultSample(): EducationItem[] {
  return [
    {
      id: makeId(),
      institute: "DIT University",
      location: "Dehradun",
      degree: "Bachelor of Technology: Computer Science Engineering",
      start: "07/2014",
      end: "05/2018",
      score: "",
      highlights: ensureLen([], 3),
    },
  ];
}

// ✅ Keep ALL items (no filtering)
function toDraftEducation(items: EducationItem[]) {
  return items.map((r) => ({
    institute: clean(r.institute),
    location: clean(r.location),
    degree: clean(r.degree),
    start: clean(r.start),
    end: clean(r.end),
    score: clean(r.score),
    highlights: ensureLen(r.highlights ?? [], 3).map((h) => clean(h)),
  }));
}

export default function Step4_Education_TechClassic({
  draft,
  setDraft,
  onNext,
  onPrev,
}: StepComponentProps) {
  const resume = (draft as any)?.resume ?? {};
  const isInitialMount = useRef(true);

  // ✅ Hydrate state from draft
  const [rows, setRows] = useState<EducationItem[]>(() => {
    const existing = resume.techEducation as any[];

    if (Array.isArray(existing) && existing.length) {
      return existing.map((r) => ({
        id: makeId(),
        institute: clean(r.institute),
        location: clean(r.location),
        degree: clean(r.degree ?? r.degreeLine),
        start: clean(r.start),
        end: clean(r.end),
        score: clean(r.score),
        highlights: ensureLen((r.highlights ?? []).map(clean), 3),
      }));
    }

    return defaultSample();
  });

  // ✅ Commit to draft function
  const commitToDraft = (nextRows: EducationItem[]) => {
    setDraft({
      ...(draft as any),
      resume: {
        ...((draft as any)?.resume ?? {}),
        techEducation: toDraftEducation(nextRows),
      },
    });
  };

  // ✅ Sync initial state to draft AFTER mount (only once)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Commit the initial rows state to draft
      setDraft({
        ...(draft as any),
        resume: {
          ...((draft as any)?.resume ?? {}),
          techEducation: toDraftEducation(rows),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run only once on mount

  const updateRow = (id: string, patch: Partial<EducationItem>) => {
    setRows((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      commitToDraft(next);
      return next;
    });
  };

  const updateHighlight = (id: string, hIdx: number, value: string) => {
    setRows((prev) => {
      const next = prev.map((r) => {
        if (r.id !== id) return r;
        const highlights = ensureLen(r.highlights ?? [], 3);
        highlights[hIdx] = value;
        return { ...r, highlights };
      });
      commitToDraft(next);
      return next;
    });
  };

  const addRow = () => {
    setRows((prev) => {
      const next = [
        ...prev,
        {
          id: makeId(),
          institute: "",
          degree: "",
          location: "",
          start: "",
          end: "",
          score: "",
          highlights: ensureLen([], 3),
        },
      ];
      commitToDraft(next);
      return next;
    });
  };

  const removeRow = (id: string) => {
    setRows((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      const next = filtered.length ? filtered : defaultSample();
      commitToDraft(next);
      return next;
    });
  };

  const canContinue = rows.some(
    (r) => clean(r.institute).trim() && clean(r.degree).trim()
  );

  const previewData = useMemo(() => {
    const header = resume.techHeader ?? {};
    const summary = resume.techSummary ?? {};
    const skills = resume.techSkills ?? {};

    const education = rows.map((r) => {
      const start = clean(r.start).trim();
      const end = clean(r.end).trim();
      const dateRange =
        start && end ? `${start} - ${end}` : start ? start : end ? end : "";

      const degree = clean(r.degree).trim();
      const score = clean(r.score).trim();
      const degreeLine = score ? `${degree} • ${score}` : degree;

      return {
        institute: clean(r.institute).trim(),
        location: clean(r.location).trim(),
        degreeLine,
        dateRange,
        highlights: ensureLen(r.highlights ?? [], 3)
          .map((h) => clean(h).trim())
          .filter(Boolean),
      };
    });

    return {
      header: {
        name: clean(header.fullName).trim() || "Your Name",
        title: clean(header.title).trim() || "Your Title",
        phone: clean(header.phone).trim(),
        email: clean(header.email).trim(),
        linkedin: clean(header.links?.linkedin).trim(),
        github: clean(header.links?.github).trim(),
        portfolio: clean(header.links?.portfolio).trim(),
        location: clean(header.location).trim(),
      },
      summary: clean(summary.text).trim(),
      skills,
      experiences: Array.isArray(resume.techExperience) ? resume.techExperience : [],
      education,
      achievements: Array.isArray(resume.techAchievements) ? resume.techAchievements : [],
    };
  }, [resume, rows]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Step 4 — Education
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Default example is prefilled — just edit it. Add more if needed.
          </p>

          <div className="mt-5 space-y-6">
            {rows.map((r, idx) => {
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      Education #{idx + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(r.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Institute / University"
                      value={r.institute}
                      onChange={(e) => updateRow(r.id, { institute: e.target.value })}
                    />

                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Location (optional)"
                      value={r.location}
                      onChange={(e) => updateRow(r.id, { location: e.target.value })}
                    />

                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 md:col-span-2"
                      placeholder="Degree / Program"
                      value={r.degree}
                      onChange={(e) => updateRow(r.id, { degree: e.target.value })}
                    />

                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Score (optional) e.g., CGPA 8.2/10"
                      value={r.score}
                      onChange={(e) => updateRow(r.id, { score: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-3 md:col-span-2">
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        placeholder="Start (MM/YYYY)"
                        value={r.start}
                        onChange={(e) => updateRow(r.id, { start: e.target.value })}
                      />
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        placeholder="End (MM/YYYY)"
                        value={r.end}
                        onChange={(e) => updateRow(r.id, { end: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addRow}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              + Add another education
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