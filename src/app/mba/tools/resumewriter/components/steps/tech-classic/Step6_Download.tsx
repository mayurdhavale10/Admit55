"use client";

import React, { useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";

import type { StepComponentProps } from "../registry";

import TechClassicPreview from "../../resume-templates/tech-classic/TechClassicPreview";
import TechClassicTemplate, {
  type TechClassicTemplateProps,
  type TechClassicSkillRow,
  type TechClassicExperience,
  type TechClassicEducation,
  type TechClassicAchievement,
} from "../../resume-templates/tech-classic/TechClassicTemplate";

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

export default function Step6_Download_TechClassic({ draft, onPrev }: StepComponentProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // ✅ Build TechClassicTemplateProps from draft
  const templateProps = useMemo<TechClassicTemplateProps>(() => {
    const h = (draft as any)?.resume?.techHeader ?? {};
    const s = (draft as any)?.resume?.techSummary ?? {};
    const sk = (draft as any)?.resume?.techSkills ?? {};

    const rows = safeArray<TechClassicSkillRow>(sk.rows ?? sk.skillRows ?? []);

    const experiences = safeArray<TechClassicExperience>(
      (draft as any)?.resume?.techExperience ?? (draft as any)?.resume?.techExperiences
    );

    const education = safeArray<TechClassicEducation>((draft as any)?.resume?.techEducation);

    const achievements = safeArray<TechClassicAchievement>((draft as any)?.resume?.techAchievements);

    return {
      header: {
        name: cleanStr(h.fullName) || "YOUR NAME",
        title: cleanStr(h.title) || undefined,
        phone: cleanStr(h.phone) || undefined,
        email: cleanStr(h.email) || undefined,
        linkedin: cleanStr(h.linkedin ?? h.links?.linkedin) || undefined,
        github: cleanStr(h.github ?? h.links?.github) || undefined,
        portfolio: cleanStr(h.portfolio ?? h.links?.portfolio) || undefined,
        location: cleanStr(h.location) || undefined,
      },
      summary: cleanStr(s.text) || undefined,
      skills: {
        heading: cleanStr(sk.heading) || "Skills",
        subHeading: cleanStr(sk.subHeading) || undefined,
        rows,
      },
      experiences,
      education,
      achievements,
    };
  }, [draft]);

  // ✅ IMPORTANT: your react-to-print version expects contentRef (NOT content)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${(templateProps.header.name || "resume").replace(/\s+/g, "_")}_TechClassic`,
  });

  return (
    <div className="space-y-4">
      {/* UI card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Final — Download</h2>
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
      </div>

      {/* Preview on final step */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
        {/* ✅ Your Preview expects { data } */}
        <TechClassicPreview data={templateProps as any} />
      </div>

      {/* ✅ PRINT TARGET */}
      <div style={{ position: "absolute", left: -99999, top: 0 }}>
        <div id="resume-print" ref={printRef}>
          <TechClassicTemplate {...templateProps} />
        </div>
      </div>
    </div>
  );
}
