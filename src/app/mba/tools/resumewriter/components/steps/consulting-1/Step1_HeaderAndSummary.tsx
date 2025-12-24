// src/app/mba/tools/resumewriter/components/steps/consulting-1/Step1_HeaderAndSummary.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { StepComponentProps } from "../registry";

import Classic1Preview from "../../resume-templates/consulting-1/Classic1Preview";

// ✅ AI action
import { rewriteconsultingsummary } from "../../../ai/rewriteconsultingsummary";

/* ---------------- types ---------------- */

type Consulting1Header = {
  fullName?: string;
  email?: string;
  linkedin?: string; // user input
  phone?: string;
};

type Consulting1Summary = {
  text?: string;
};

/* ---------------- utils ---------------- */

function asInput(v: unknown) {
  return (v ?? "").toString();
}

function cleanStr(v: unknown) {
  return (v ?? "").toString().trim();
}

function normalizeLinkedinUrl(raw: string): string {
  const s = cleanStr(raw);
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("linkedin.com") || s.startsWith("www.linkedin.com")) {
    return `https://${s}`;
  }
  if (!s.includes(".") && !s.includes("/")) {
    return `https://www.linkedin.com/in/${s}`;
  }
  return `https://${s}`;
}

function normalizeEmail(raw: string): string {
  return cleanStr(raw);
}

function buildMailto(email: string): string {
  const e = normalizeEmail(email);
  if (!e) return "";
  return `mailto:${e}`;
}

/* ---------------- component ---------------- */

export default function Step1_HeaderAndSummary_Consulting1({
  draft,
  setDraft,
  onNext,
}: StepComponentProps) {
  const resume = (draft as any)?.resume ?? {};

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>("");

  const header: Consulting1Header = useMemo(() => {
    const h = resume?.consulting1Header ?? {};
    return {
      fullName: asInput(h.fullName),
      email: asInput(h.email),
      linkedin: asInput(h.linkedin),
      phone: asInput(h.phone),
    };
  }, [resume]);

  const summary: Consulting1Summary = useMemo(() => {
    const s = resume?.consulting1Summary ?? {};
    return { text: asInput(s.text) };
  }, [resume]);

  const update = (
    patch: Partial<{
      consulting1Header: Consulting1Header;
      consulting1Summary: Consulting1Summary;
    }>
  ) => {
    const nextDraft = {
      ...(draft as any),
      resume: {
        ...resume,
        ...(patch.consulting1Header
          ? { consulting1Header: patch.consulting1Header }
          : {}),
        ...(patch.consulting1Summary
          ? { consulting1Summary: patch.consulting1Summary }
          : {}),
      },
    };

    (setDraft as any)(nextDraft);
  };

  const updateHeader = (p: Partial<Consulting1Header>) =>
    update({ consulting1Header: { ...header, ...p } });

  const updateSummary = (text: string) =>
    update({ consulting1Summary: { ...summary, text } });

  const canContinue = !!cleanStr(header.fullName);

  // ✅ optional JD: use Step0's field if present
  const jobDescription = cleanStr((draft as any)?.intent?.targetJobDescription);

  const previewData = useMemo(() => {
    const name = cleanStr(header.fullName) || "YOUR NAME";

    // ✅ always strings, never undefined
    const email = normalizeEmail(header.email ?? "");
    const linkedinUrl = normalizeLinkedinUrl(header.linkedin ?? "");
    const phone = cleanStr(header.phone ?? "");

    return {
      header: {
        name,

        // shown text
        email,
        // used for anchor in preview
        emailUrl: buildMailto(email),

        // show "LinkedIn" label, link to URL
        linkedinLabel: linkedinUrl ? "LinkedIn" : "",
        linkedinUrl,

        phone,
      },
      summary: cleanStr(summary.text ?? ""),
    };
  }, [header.fullName, header.email, header.linkedin, header.phone, summary.text]);

  const handleRewriteWithAI = async () => {
    setAiError("");
    const raw = cleanStr(summary.text ?? "");
    if (!raw) {
      setAiError("Type a draft summary first, then click Rewrite.");
      return;
    }

    try {
      setAiLoading(true);

      const res = await rewriteconsultingsummary({
        raw,
        track: "consulting",
        // optional context from Step0 (if you later add these fields)
        targetRole: cleanStr((draft as any)?.intent?.targetRole),
        targetCompanyOrTeam: cleanStr((draft as any)?.intent?.targetCompanyOrTeam),
        jobDescription: jobDescription || undefined,
      });

      if (!res?.ok) {
        setAiError(res?.error || "AI rewrite failed.");
      }

      const rewritten = (res?.rewritten ?? "").toString();
      if (rewritten) updateSummary(rewritten);
    } catch (e: any) {
      setAiError(e?.message || "AI rewrite failed.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Step 1 — Header &amp; Summary
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Fill your header like the PDF (Name + Email + LinkedIn + Phone), then
            add a 2–3 line summary.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3">
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Full Name (e.g., Akshay Goel)"
              value={header.fullName ?? ""}
              onChange={(e) => updateHeader({ fullName: e.target.value })}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="Email (e.g., akshay10.tu@gmail.com)"
                value={header.email ?? ""}
                onChange={(e) => updateHeader({ email: e.target.value })}
              />
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="Phone (e.g., +971 566895746)"
                value={header.phone ?? ""}
                onChange={(e) => updateHeader({ phone: e.target.value })}
              />
            </div>

            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="LinkedIn URL or username (e.g., linkedin.com/in/username)"
              value={header.linkedin ?? ""}
              onChange={(e) => updateHeader({ linkedin: e.target.value })}
            />

            {/* ✅ quick hint: what will be shown in preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <span className="font-semibold">Preview links:</span>{" "}
              Email will be clickable (blue). LinkedIn will show as{" "}
              <span className="font-semibold">“LinkedIn”</span> and open your URL.
            </div>
          </div>

          {/* SUMMARY */}
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Summary (2–3 lines)
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRewriteWithAI}
                  disabled={aiLoading}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition
                    ${
                      aiLoading
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-400"
                        : "bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300"
                    }`}
                  title={
                    jobDescription
                      ? "Uses your optional JD from Step 0 as extra context"
                      : "JD is optional (add in Step 0 if you want)"
                  }
                >
                  {aiLoading ? "Rewriting..." : "Rewrite with AI"}
                </button>

                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Tip: you can type **bold**
                </span>
              </div>
            </div>

            <textarea
              rows={4}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Example: Digital & Analytics expert with management consulting & entrepreneurial background..."
              value={summary.text ?? ""}
              onChange={(e) => updateSummary(e.target.value)}
            />

            {jobDescription ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                JD context detected from Step 0 — AI rewrite will use it.
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Optional: paste a JD in Step 0 to make AI rewrite more targeted.
              </p>
            )}

            {aiError ? (
              <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                {aiError}
              </p>
            ) : null}
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
              Live Preview (Consulting 1)
            </div>
          </div>

          {/* ✅ Email will be blue ONLY if Classic1Preview renders email as <a> with className */}
          {/* This component already receives emailUrl + linkedinUrl + linkedinLabel */}
          <Classic1Preview data={previewData as any} />
        </div>
      </div>
    </div>
  );
}
