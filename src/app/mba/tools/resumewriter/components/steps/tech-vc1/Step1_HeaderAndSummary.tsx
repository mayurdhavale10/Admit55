// src/app/mba/tools/resumewriter/components/steps/tech-vc1/Step1_HeaderAndSummary.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { StepComponentProps } from "../registry";

import TechVC1Preview from "../../resume-templates/tech-vc1/TechVC1Preview";
import { rewriteTechSummary } from "../../../ai/rewriteTechSummary";

/* =========================
   helpers
========================= */

function asInput(v: unknown) {
  return (v ?? "").toString(); // don't trim while typing
}
function cleanStr(v: unknown) {
  return (v ?? "").toString().trim();
}

/* =========================
   types (draft shape)
========================= */

type VC1HeaderLinks = {
  linkedin?: string;
  github?: string;
  portfolio?: string;
};

type VC1Header = {
  fullName?: string;
  title?: string;
  address?: string;
  phone?: string;
  email?: string;

  // label customizers (fix your “blue font too thick” issue)
  nameWeight?: "600" | "700" | "800"; // default 600
  nameColor?: string; // default "#2f3e55" (softer blue/grey like screenshot)
  titleColor?: string; // default "#6b778a"

  links?: VC1HeaderLinks;
  wwwHint?: string; // "Bold Profile"
};

type VC1Summary = { text?: string };

export default function Step1_HeaderAndSummary_TechVC1({
  draft,
  setDraft,
  onNext,
}: StepComponentProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const resume = useMemo(() => (draft as any)?.resume ?? {}, [draft]);

  const header: VC1Header = useMemo(() => {
    const h = resume.techVC1Header ?? {};
    return {
      fullName: asInput(h.fullName),
      title: asInput(h.title),
      address: asInput(h.address),
      phone: asInput(h.phone),
      email: asInput(h.email),

      // ✅ defaults tuned to match the screenshot (less bold + softer tone)
      nameWeight: (h.nameWeight as any) || "600",
      nameColor: asInput(h.nameColor || "#2f3e55"),
      titleColor: asInput(h.titleColor || "#6b778a"),

      wwwHint: asInput(h.wwwHint || "Bold Profile"),
      links: {
        linkedin: asInput(h.links?.linkedin),
        github: asInput(h.links?.github),
        portfolio: asInput(h.links?.portfolio),
      },
    };
  }, [resume]);

  const summary: VC1Summary = useMemo(() => {
    const s = resume.techVC1Summary ?? {};
    return { text: asInput(s.text) };
  }, [resume]);

  const jobDescription = useMemo(() => asInput(resume.techVC1JobDescription ?? ""), [resume]);

  const update = (
    patch: Partial<{
      techVC1Header: VC1Header;
      techVC1Summary: VC1Summary;
      techVC1JobDescription: string;
    }>
  ) => {
    const nextDraft = {
      ...(draft as any),
      resume: {
        ...(resume ?? {}),
        ...(patch.techVC1Header ? { techVC1Header: patch.techVC1Header } : {}),
        ...(patch.techVC1Summary ? { techVC1Summary: patch.techVC1Summary } : {}),
        ...(patch.techVC1JobDescription !== undefined
          ? { techVC1JobDescription: patch.techVC1JobDescription }
          : {}),
      },
    };
    (setDraft as any)(nextDraft);
  };

  const updateHeader = (p: Partial<VC1Header>) =>
    update({ techVC1Header: { ...header, ...p } });

  const updateLinks = (p: Partial<VC1HeaderLinks>) =>
    updateHeader({ links: { ...(header.links ?? {}), ...p } });

  const updateSummary = (text: string) =>
    update({ techVC1Summary: { ...summary, text } });

  const updateJD = (text: string) => update({ techVC1JobDescription: text });

  const canContinue = !!cleanStr(header.fullName) && !!cleanStr(header.title);

  // ✅ pass styling knobs into preview via draft.resume.techVC1Header
  const previewDraft = useMemo(() => {
    return {
      resume: {
        ...resume,
        techVC1Header: {
          fullName: cleanStr(header.fullName) || "Rahul Gupta",
          title: cleanStr(header.title) || "Software Engineer",
          address: cleanStr(header.address) || "Dehradun, India 248001",
          phone: cleanStr(header.phone) || "+91 8126621231",
          email: cleanStr(header.email) || "guptarahul0319@gmail.com",
          links: {
            linkedin:
              cleanStr(header.links?.linkedin) || "https://www.linkedin.com/in/rahul-gupta-/",
            github: cleanStr(header.links?.github) || "",
            portfolio: cleanStr(header.links?.portfolio) || "",
          },
          wwwHint: cleanStr(header.wwwHint) || "Bold Profile",

          nameWeight: header.nameWeight || "600",
          nameColor: header.nameColor || "#2f3e55",
          titleColor: header.titleColor || "#6b778a",
        },
        techVC1Summary: { text: cleanStr(summary.text) },
        techVC1JobDescription: cleanStr(jobDescription),
      },
    };
  }, [resume, header, summary.text, jobDescription]);

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
            Step 1 — Header & Summary (Tech VC1)
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Match the screenshot: softer name color + lighter weight.
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
              placeholder="Title (e.g., Software Engineer)"
              value={header.title ?? ""}
              onChange={(e) => updateHeader({ title: e.target.value })}
            />

            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 md:col-span-2"
              placeholder="Address / Location (e.g., Dehradun, India 248001)"
              value={header.address ?? ""}
              onChange={(e) => updateHeader({ address: e.target.value })}
            />

            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Phone (optional)"
              value={header.phone ?? ""}
              onChange={(e) => updateHeader({ phone: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="E-mail (optional)"
              value={header.email ?? ""}
              onChange={(e) => updateHeader({ email: e.target.value })}
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
              placeholder="WWW / Portfolio URL (optional)"
              value={header.links?.portfolio ?? ""}
              onChange={(e) => updateLinks({ portfolio: e.target.value })}
            />

            {/* ✅ style controls */}
            <div className="md:col-span-2 grid grid-cols-1 gap-3 md:grid-cols-3">
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={header.nameWeight || "600"}
                onChange={(e) => updateHeader({ nameWeight: e.target.value as any })}
              >
                <option value="600">Name weight 600 (recommended)</option>
                <option value="700">Name weight 700</option>
                <option value="800">Name weight 800</option>
              </select>

              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="Name color hex (e.g., #2f3e55)"
                value={header.nameColor ?? ""}
                onChange={(e) => updateHeader({ nameColor: e.target.value })}
              />

              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="Title color hex (e.g., #6b778a)"
                value={header.titleColor ?? ""}
                onChange={(e) => updateHeader({ titleColor: e.target.value })}
              />
            </div>
          </div>

          {/* Job Description */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Job Description (optional)
            </h3>
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
              placeholder="Write a rough summary first..."
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
              Live Preview (Tech VC1)
            </div>
          </div>

          <TechVC1Preview data={previewDraft} showPager />
        </div>
      </div>
    </div>
  );
}
