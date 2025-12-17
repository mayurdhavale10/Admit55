// src/app/mba/tools/resumewriter/components/steps/consulting-classic/Step7_Download.tsx
"use client";

import React, { useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";

import type { StepComponentProps } from "../registry";

import ConsultingClassicPreview from "../../resume-templates/consulting-classic/ConsultingClassicPreview";
import ConsultingClassicTemplate from "../../resume-templates/ConsultingClassicTemplate";

function cleanStr(v: unknown) {
  return (v ?? "").toString().trim();
}

function safeArray<T = any>(v: unknown): T[] | undefined {
  return Array.isArray(v) ? (v as T[]) : undefined;
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

export default function Step7_Download_ConsultingClassic({
  draft,
  onPrev,
}: StepComponentProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // ✅ Build EVERYTHING from draft only (no default “dummy” resume data)
  const previewData = useMemo(() => {
    const basic = (draft as any)?.resume?.basicInfo ?? {};
    const fullName = `${basic.firstName ?? ""} ${basic.lastName ?? ""}`.trim();

    return {
      header: {
        name: fullName,
        gender: cleanStr(basic.gender),
        university: cleanStr(basic.university),
        email: cleanStr(basic.email),
        phone: cleanStr(basic.phone),
        location: cleanStr(basic.location),
      },

      // meta bar / highlights from your Step1 only
      metaBar: safeArray<string>(basic.metaBar) ?? [],

      // Step2
      educationRows: safeArray((draft as any)?.resume?.educationRows),

      // Step3
      experiences: safeArray((draft as any)?.resume?.experiences),

      // Step4
      scholasticBlocks: safeArray((draft as any)?.resume?.scholasticBlocks),

      // Step5
      articleSectionTitle: cleanStr((draft as any)?.resume?.articleSectionTitle),
      articleHeaderRight: cleanStr((draft as any)?.resume?.articleHeaderRight),
      articleBlocks: safeArray((draft as any)?.resume?.articleBlocks),

      // Step6
      leadershipTitle: cleanStr((draft as any)?.resume?.leadershipTitle),
      leadershipBlocks: safeArray((draft as any)?.resume?.leadershipBlocks),
    };
  }, [draft]);

  // ✅ FIX #1: your react-to-print expects contentRef (not content)
    const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${(previewData.header.name || "resume").replace(/\s+/g, "_")}_ConsultingClassic`,
    onAfterPrint: () => {
      // optional hook (we already remove injected CSS via afterprint listener)
    },
  });
  return (
    <div className="space-y-4">
      {/* UI card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Final — Download</h2>
        <p className="mt-1 text-sm text-slate-600">
          Downloads only the resume as a single A4 page PDF (no app UI).
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => withResumePrintStyles(() => handlePrint())}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Download PDF (1 page)
          </button>

          <button
            type="button"
            onClick={onPrev}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Back
          </button>
        </div>
      </div>

      {/* Optional: show preview on this final step too */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <ConsultingClassicPreview data={previewData as any} />
      </div>

      {/* ✅ PRINT TARGET (hidden on screen, used only for print) */}
      <div style={{ position: "absolute", left: -99999, top: 0 }}>
        <div id="resume-print" ref={printRef}>
          <ConsultingClassicTemplate
            name={previewData.header.name}
            gender={previewData.header.gender}
            university={previewData.header.university}
            email={previewData.header.email}
            phone={previewData.header.phone}
            address={previewData.header.location}
            headerHighlights={previewData.metaBar}
            educationRows={previewData.educationRows as any}
            experienceItems={previewData.experiences as any}
            scholasticBlocks={previewData.scholasticBlocks as any}
            articleSectionTitle={previewData.articleSectionTitle || undefined}
            articleHeaderRight={previewData.articleHeaderRight || undefined}
            articleBlocks={previewData.articleBlocks as any}
            leadershipTitle={previewData.leadershipTitle || undefined}
            leadershipBlocks={previewData.leadershipBlocks as any}
          />
        </div>
      </div>
    </div>
  );
}
