"use client";

import React, { useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";

import type { StepComponentProps } from "../registry";

import Classic1Preview from "../../resume-templates/consulting-1/Classic1Preview";
import Consulting1Template, {
  type Consulting1TemplateProps,
} from "../../resume-templates/consulting-1/ClassicTemplate1";

function cleanStr(v: unknown) {
  return (v ?? "").toString().trim();
}

function safeArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** ✅ Inject print-only CSS WITHOUT touching globals.css */
function withResumePrintStyles(runPrint: () => void) {
  const style = document.createElement("style");
  style.setAttribute("data-resume-print", "true");

  style.innerHTML = `
@page { size: A4; margin: 0; }
@media print {
  html, body { margin: 0 !important; padding: 0 !important; }
  body * { visibility: hidden !important; }

  #resume-print, #resume-print * { visibility: visible !important; }

  #resume-print{
    position: fixed !important;
    inset: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    overflow: hidden !important;
    background: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`;
  document.head.appendChild(style);

  runPrint();

  const cleanup = () => {
    style.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
}

export default function Step5_Download_Consulting1({ draft, onPrev }: StepComponentProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // ✅ Build Consulting1TemplateProps from draft
  const templateProps = useMemo<Consulting1TemplateProps>(() => {
    const resume = (draft as any)?.resume ?? {};

    const h = resume?.consulting1Header ?? {};
    const s = resume?.consulting1Summary ?? {};

    const workExperience = resume?.consulting1WorkExperience ?? {};
    const educationBlock = resume?.consulting1Education ?? {};
    const entrepreneurialBlock = resume?.consulting1Entrepreneurial ?? {};

    // normalize arrays
    const educationItems = safeArray<any>(educationBlock?.items ?? educationBlock);
    const entrepreneurialItems = safeArray<any>(entrepreneurialBlock?.items ?? entrepreneurialBlock);

    return {
      header: {
        name: cleanStr(h.fullName) || "YOUR NAME",
        email: cleanStr(h.email) || undefined,
        linkedin: cleanStr(h.linkedin) || undefined,
        phone: cleanStr(h.phone) || undefined,
      },

      summary: cleanStr(s.text) || undefined,

      workExperience,

      educationHeading: cleanStr(educationBlock?.heading) || "EDUCATION",
      education: educationItems,

      initiativesHeading: cleanStr(entrepreneurialBlock?.heading) || "ENTREPRENEURIAL INITIATIVES",
      initiatives: entrepreneurialItems,
    } as any;
  }, [draft]);

  const documentTitle = `${(templateProps.header?.name || "resume")
    .replace(/\s+/g, "_")
    .slice(0, 40)}_Consulting1`;

  // ✅ Use react-to-print with contentRef
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle,
  });

  return (
    <div className="space-y-4">
      {/* UI card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
          Final — Download
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Downloads only the resume as a single A4 page PDF (no app UI).
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => withResumePrintStyles(() => handlePrint())}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300"
          >
            Download PDF (1 page)
          </button>

          <button
            type="button"
            onClick={onPrev}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Back
          </button>
        </div>

        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          If download doesn't work, check your browser's print settings.
        </div>
      </div>

      {/* Preview on final step */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
        <Classic1Preview data={templateProps as any} />
      </div>

      {/* ✅ PRINT TARGET */}
      <div style={{ position: "absolute", left: -99999, top: 0 }}>
        <div id="resume-print" ref={printRef}>
          <Consulting1Template {...(templateProps as any)} />
        </div>
      </div>
    </div>
  );
}