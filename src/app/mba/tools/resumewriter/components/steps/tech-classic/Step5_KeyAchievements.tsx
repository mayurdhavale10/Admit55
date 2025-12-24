"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import type { StepComponentProps } from "../registry";
import TechClassicPreview from "../../resume-templates/tech-classic/TechClassicPreview";
import { rewriteAchievement } from "../../../ai/rewriteAchievement";

type AchievementUI = {
  id: string;
  icon: "pin" | "star" | "bolt" | "trophy";
  title: string;
  subtitle: string;
  details: string;
};

const clean = (v: unknown) => (v ?? "").toString();

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Math.random().toString(16).slice(2)}`;
}

function defaultAchievements(): AchievementUI[] {
  return [
    {
      id: makeId(),
      icon: "pin",
      title: "Employee of the Month – WrkSpot",
      subtitle: "Recognized as Employee of the Month for September 2023 at WrkSpot",
      details: "",
    },
    {
      id: makeId(),
      icon: "star",
      title: "Best Team of the Quarter – Meesho",
      subtitle: "Won best team of the quarter award at Meesho amongst 15 teams",
      details: "",
    },
    {
      id: makeId(),
      icon: "star",
      title: "Outstanding Newcomer Award – Tricon Infotech",
      subtitle: "Outstanding Newcomer Award for the year 2019 at Tricon Infotech",
      details: "",
    },
    {
      id: makeId(),
      icon: "bolt",
      title: "Employee of the Month – Tricon Infotech",
      subtitle: "Employee of the Month Award for April 2020 at Tricon Infotech",
      details: "",
    },
  ];
}

// ✅ Keep ALL items (no filtering)
function toDraftAchievements(items: AchievementUI[]) {
  return items.map((a) => ({
    icon: a.icon,
    title: clean(a.title),
    description: clean(a.subtitle) || clean(a.details),
    details: clean(a.details),
    subtitle: clean(a.subtitle),
  }));
}

export default function Step5_KeyAchievements_TechClassic({
  draft,
  setDraft,
  onNext,
  onPrev,
}: StepComponentProps) {
  const resume = (draft as any)?.resume ?? {};
  const isInitialMount = useRef(true);

  // Hydrate state WITHOUT calling setDraft during render
  const [items, setItems] = useState<AchievementUI[]>(() => {
    const existing = resume.techAchievements as any[];

    if (Array.isArray(existing) && existing.length) {
      return existing.map((a) => ({
        id: makeId(),
        icon: (a.icon as "pin" | "star" | "bolt" | "trophy") || "star",
        title: clean(a.title),
        subtitle: clean(a.subtitle ?? a.description),
        details: clean(a.details),
      }));
    }

    return defaultAchievements();
  });

  const [jobDescription, setJobDescription] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  // ✅ Sync to draft AFTER mount (only once)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setDraft({
        ...(draft as any),
        resume: {
          ...((draft as any)?.resume ?? {}),
          techAchievements: toDraftAchievements(items),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - runs once on mount

  const commitToDraft = (next: AchievementUI[]) => {
    setDraft({
      ...(draft as any),
      resume: {
        ...((draft as any)?.resume ?? {}),
        techAchievements: toDraftAchievements(next),
      },
    });
  };

  const updateItem = (id: string, patch: Partial<AchievementUI>) => {
    setItems((prev) => {
      const next = prev.map((it) => (it.id === id ? { ...it, ...patch } : it));
      commitToDraft(next);
      return next;
    });
  };

  const addItem = () => {
    setItems((prev) => {
      const next: AchievementUI[] = [
        ...prev,
        { id: makeId(), icon: "star", title: "", subtitle: "", details: "" },
      ];
      commitToDraft(next);
      return next;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((it) => it.id !== id);
      const next = filtered.length ? filtered : defaultAchievements();
      commitToDraft(next);
      return next;
    });
  };

  const canContinue = items.some((a) => clean(a.title).trim());

  const rewriteAll = async () => {
    setIsRewriting(true);
    setRewriteError(null);

    try {
      const track = clean((draft as any)?.step0?.track).trim();
      const targetRole = clean((draft as any)?.step0?.targetRole).trim();
      const targetCompanyOrTeam = clean((draft as any)?.step0?.targetCompanyOrTeam).trim();

      const rewritten: AchievementUI[] = await Promise.all(
        items.map(async (a) => {
          if (!clean(a.title).trim() && !clean(a.subtitle).trim() && !clean(a.details).trim()) return a;

          const res = await rewriteAchievement({
            title: a.title,
            subtitle: a.subtitle,
            details: a.details,
            jobDescription: jobDescription.trim() || undefined,
            track: track || undefined,
            targetRole: targetRole || undefined,
            targetCompanyOrTeam: targetCompanyOrTeam || undefined,
          });

          return {
            ...a,
            title: res.title,
            subtitle: res.subtitle,
            details: res.details,
          };
        })
      );

      setItems(rewritten);
      commitToDraft(rewritten);
    } catch (e: any) {
      setRewriteError(e?.message || "Rewrite failed");
    } finally {
      setIsRewriting(false);
    }
  };

  const previewData = useMemo(() => {
    const header = resume.techHeader ?? {};
    const summary = resume.techSummary ?? {};
    const skills = resume.techSkills ?? {};

    // ✅ Preview trims for display
    const achievements = items.map((a) => ({
      icon: a.icon,
      title: clean(a.title).trim(),
      description: clean(a.subtitle).trim() || clean(a.details).trim(),
    }));

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
      education: Array.isArray(resume.techEducation) ? resume.techEducation : [],
      achievements,
    };
  }, [resume, items]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Step 5 — Key Achievements
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Add awards, recognitions, rankings, etc. Keep them short and credible.
              </p>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="shrink-0 rounded-xl bg-[#002b5b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003b7a]
                         dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300"
            >
              + Add
            </button>
          </div>

          {/* JD + Rewrite */}
          <div className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Optional: Paste Job Description (for AI alignment)
            </div>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste JD here (optional). If empty, AI will just improve wording + ATS."
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm
                         dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            />

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={rewriteAll}
                disabled={isRewriting}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white
                  ${isRewriting ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {isRewriting ? "Rewriting…" : "Rewrite all achievements (Admit55 AI)"}
              </button>

              {rewriteError && (
                <div className="text-sm text-rose-600">{rewriteError}</div>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {items.map((a, idx) => (
              <div
                key={a.id}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Achievement #{idx + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(a.id)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="md:col-span-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Icon
                    </label>
                    <select
                      value={a.icon}
                      onChange={(e) => updateItem(a.id, { icon: e.target.value as "pin" | "star" | "bolt" | "trophy" })}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm
                                 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                    >
                      <option value="pin">Pin</option>
                      <option value="star">Star</option>
                      <option value="bolt">Bolt</option>
                      <option value="trophy">Trophy</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Title
                    </label>
                    <input
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm
                                 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                      placeholder='e.g., "Employee of the Month – WrkSpot"'
                      value={a.title}
                      onChange={(e) => updateItem(a.id, { title: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Description (shown under title)
                    </label>
                    <input
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm
                                 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                      placeholder='e.g., "Recognized as Employee of the Month for September 2023 at WrkSpot"'
                      value={a.subtitle}
                      onChange={(e) => updateItem(a.id, { subtitle: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Optional extra details (1 line)
                    </label>
                    <input
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm
                                 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                      placeholder="Optional detail (leave empty if not needed)"
                      value={a.details}
                      onChange={(e) => updateItem(a.id, { details: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={onPrev}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50
                         dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
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
                    ? "bg-[#002b5b] hover:bg-[#003b7a] shadow-[0_16px_40px_rgba(15,23,42,0.25)] dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-slate-950"
                    : "bg-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-300"
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