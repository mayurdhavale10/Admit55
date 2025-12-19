// src/app/mba/tools/resumewriter/components/steps/tech-classic/Step1_HeaderAndSummary.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { StepComponentProps } from "../registry";

import TechClassicPreview from "../../resume-templates/tech-classic/TechClassicPreview";
import { rewriteTechSummary } from "../../../ai/rewriteTechSummary";

type HeaderLinks = {
  linkedin?: string;
  github?: string;
  portfolio?: string;
};

type TechHeader = {
  fullName?: string;
  title?: string;
  phone?: string;
  email?: string;
  location?: string;
  links?: HeaderLinks;
};

type TechSummary = {
  text?: string;
};

function cleanStr(v: unknown) {
  return (v ?? "").toString().trim();
}

export default function Step1_HeaderAndSummary_TechClassic({
  draft,
  setDraft,
  onNext,
}: StepComponentProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const header: TechHeader = useMemo(() => {
    const h = (draft as any)?.resume?.techHeader ?? {};
    return {
      fullName: cleanStr(h.fullName),
      title: cleanStr(h.title),
      phone: cleanStr(h.phone),
      email: cleanStr(h.email),
      location: cleanStr(h.location),
      links: {
        linkedin: cleanStr(h.links?.linkedin),
        github: cleanStr(h.links?.github),
        portfolio: cleanStr(h.links?.portfolio),
      },
    };
  }, [draft]);

  const summary: TechSummary = useMemo(() => {
    const s = (draft as any)?.resume?.techSummary ?? {};
    return { text: cleanStr(s.text) };
  }, [draft]);

  const jobDescription = useMemo(() => {
    return cleanStr((draft as any)?.resume?.techJobDescription ?? "");
  }, [draft]);

  const update = (patch: Partial<{ techHeader: TechHeader; techSummary: TechSummary; techJobDescription: string }>) => {
    setDraft({
      ...(draft as any),
      resume: {
        ...((draft as any)?.resume ?? {}),
        ...(patch.techHeader ? { techHeader: patch.techHeader } : {}),
        ...(patch.techSummary ? { techSummary: patch.techSummary } : {}),
        ...(patch.techJobDescription !== undefined ? { techJobDescription: patch.techJobDescription } : {}),
      },
    });
  };

  const updateHeader = (p: Partial<TechHeader>) => update({ techHeader: { ...header, ...p } });
  const updateLinks = (p: Partial<HeaderLinks>) =>
    updateHeader({ links: { ...(header.links ?? {}), ...p } });

  const updateSummary = (text: string) => update({ techSummary: { ...summary, text } });
  const updateJD = (text: string) => update({ techJobDescription: text });

  const canContinue = !!cleanStr(header.fullName) && !!cleanStr(header.title);

  const previewData = useMemo(() => {
    return {
      header: {
        name: header.fullName || "Your Name",
        title: header.title || "Your Title",
        phone: header.phone || "",
        email: header.email || "",
        linkedin: header.links?.linkedin || "",
        github: header.links?.github || "",
        portfolio: header.links?.portfolio || "",
        location: header.location || "",
      },
      summary: summary.text || "",
    };
  }, [header, summary.text]);

  async function handleRewriteSummary() {
    setAiError(null);

    const rawSummary = cleanStr(summary.text);
    if (!rawSummary) {
      setAiError("Write a rough summary first (even 1–2 lines), then click Rewrite.");
      return;
    }

    setIsRewriting(true);
    try {
      const res = await rewriteTechSummary({
        rawSummary,
        jobDescription: cleanStr(jobDescription) || undefined,
        track: "tech",
        targetRole: cleanStr(header.title) || undefined,
      });

      if (!res?.ok) {
        // still returns rewritten fallback
        updateSummary(res?.rewritten ?? rawSummary);
        setAiError(res?.error || "Rewrite failed. Showing best-effort rewrite.");
      } else {
        updateSummary(res.rewritten);
      }
    } catch (e: any) {
      setAiError(e?.message || "Rewrite failed.");
    } finally {
      setIsRewriting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Step 1 — Header & Summary
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Fill your header, write a rough summary, then use <b>Admit55-AI</b> to rewrite it (optionally using a Job Description).
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Full Name (e.g., Rahul Gupta)"
              value={header.fullName ?? ""}
              onChange={(e) => updateHeader({ fullName: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Title (e.g., Senior Software Engineer)"
              value={header.title ?? ""}
              onChange={(e) => updateHeader({ title: e.target.value })}
            />

            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Phone (optional)"
              value={header.phone ?? ""}
              onChange={(e) => updateHeader({ phone: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Email (optional)"
              value={header.email ?? ""}
              onChange={(e) => updateHeader({ email: e.target.value })}
            />

            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 md:col-span-2"
              placeholder="Location (optional) (e.g., Bengaluru, India)"
              value={header.location ?? ""}
              onChange={(e) => updateHeader({ location: e.target.value })}
            />

            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 md:col-span-2"
              placeholder="LinkedIn URL (optional)"
              value={header.links?.linkedin ?? ""}
              onChange={(e) => updateLinks({ linkedin: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="GitHub URL (optional)"
              value={header.links?.github ?? ""}
              onChange={(e) => updateLinks({ github: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Portfolio URL (optional)"
              value={header.links?.portfolio ?? ""}
              onChange={(e) => updateLinks({ portfolio: e.target.value })}
            />
          </div>

          {/* Job Description */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Job Description (optional)
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Paste JD here. If present, Admit55-AI will tailor your summary to match keywords naturally.
            </p>
            <textarea
              rows={6}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Paste job description here (optional)..."
              value={jobDescription}
              onChange={(e) => updateJD(e.target.value)}
            />
          </div>

          {/* Summary */}
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Summary (2–4 lines)
              </h3>

              <button
                type="button"
                onClick={handleRewriteSummary}
                disabled={isRewriting}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition
                  ${
                    isRewriting
                      ? "bg-slate-300 text-slate-700 cursor-not-allowed dark:bg-slate-800 dark:text-slate-300"
                      : "bg-[#0b5cff] text-white hover:bg-[#0849c9]"
                  }`}
              >
                {isRewriting ? "Rewriting..." : "Admit55-AI Rewrite"}
              </button>
            </div>

            <textarea
              rows={4}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Write a rough summary first (2–4 lines). Then click Admit55-AI Rewrite."
              value={summary.text ?? ""}
              onChange={(e) => updateSummary(e.target.value)}
            />

            {aiError && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
                {aiError}
              </div>
            )}
          </div>

          {/* Continue */}
          <div className="mt-6 flex items-center justify-end">
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

        {/* RIGHT: Preview */}
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
