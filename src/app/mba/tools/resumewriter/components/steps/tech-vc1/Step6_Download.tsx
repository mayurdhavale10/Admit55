// src/app/mba/tools/resumewriter/components/steps/tech-vc1/Step6_Download.tsx
"use client";

import React, { useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

import type { StepComponentProps } from "../registry";

import TechVC1Preview from "../../resume-templates/tech-vc1/TechVC1Preview";
import TechVC1Template, {
  type TechVC1TemplateProps,
} from "../../resume-templates/tech-vc1/TechVC1Template";

function cleanStr(v: unknown) {
  return (v ?? "").toString().trim();
}
function safeArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Print-only CSS helper */
function withResumePrintStyles(runPrint: () => void) {
  const style = document.createElement("style");
  style.setAttribute("data-resume-print", "true");

  style.innerHTML = `
@page { size: A4; margin: 0; }
@media print {
  html, body { 
    margin: 0 !important; 
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
  }
  
  body * { 
    visibility: hidden !important; 
  }

  #resume-print, 
  #resume-print * { 
    visibility: visible !important; 
  }

  #resume-print {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 210mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Each page should start on a new page */
  #resume-print > div {
    page-break-after: always !important;
    page-break-inside: avoid !important;
    break-after: page !important;
    break-inside: avoid !important;
  }

  /* Don't add page break after the last page */
  #resume-print > div:last-child {
    page-break-after: auto !important;
    break-after: auto !important;
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

/** Download JSON helper */
function downloadJson(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Download TXT helper */
function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Step6_Download_TechVC1({
  draft,
  onPrev,
}: StepComponentProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const templateProps = useMemo<TechVC1TemplateProps>(() => {
    const resume = (draft as any)?.resume ?? {};

    const h = resume?.techVC1Header ?? {};
    const s = resume?.techVC1Summary ?? {};
    const sk = resume?.techVC1Skills ?? {};
    const ex = resume?.techVC1Experience ?? {};
    const ed = resume?.techVC1Education ?? {};
    const ac = resume?.techVC1Achievements ?? {};

    const experienceItems = safeArray<any>(ex?.items ?? ex);
    const educationItems = safeArray<any>(ed?.items ?? ed);
    const achievementItems = safeArray<any>(ac?.items ?? ac);

    const skillsAny = sk?.rows ?? sk?.groups ?? sk?.items ?? sk;

    return {
      header: {
        name: cleanStr(h.name ?? h.fullName) || "YOUR NAME",
        title: cleanStr(h.title) || undefined,
        address: cleanStr(h.address ?? h.location) || undefined,
        phone: cleanStr(h.phone) || undefined,
        email: cleanStr(h.email) || undefined,
        linkedin: cleanStr(h.linkedin) || undefined,
        github: cleanStr(h.github) || undefined,
        portfolio: cleanStr(h.portfolio) || undefined,
      },

      summary: cleanStr(s.text ?? s) || undefined,

      skills: {
        heading: cleanStr(sk.heading) || "Skills",
        rows: safeArray<any>(skillsAny).map((r: any) => ({
          label: cleanStr(r.label ?? r.name ?? ""),
          value: cleanStr(r.value ?? r.text ?? r.items ?? r.skills ?? ""),
        })),
      } as any,

      experience: experienceItems.map((it: any) => ({
        dateRange: cleanStr(it.dateRange ?? it.dates ?? ""),
        role: cleanStr(it.role ?? it.title ?? it.position ?? ""),
        company: cleanStr(it.company ?? ""),
        location: cleanStr(it.location ?? ""),
        bullets: safeArray<any>(it.bullets ?? it.points ?? []).map((b) =>
          (b ?? "").toString()
        ),
      })),

      education: educationItems.map((it: any) => ({
        dateRange: cleanStr(it.dateRange ?? it.dates ?? ""),
        degreeLine: cleanStr(it.degreeLine ?? it.degree ?? ""),
        institute: cleanStr(it.institute ?? it.school ?? ""),
        meta: cleanStr(it.meta ?? it.location ?? ""),
      })),

      achievements: achievementItems
        .map((x: any) => {
          if (typeof x === "string") return x;
          if (x?.text) return x.text;
          if (Array.isArray(x?.bullets)) return x.bullets.join(" ");
          if (x?.value) return x.value;
          return "";
        })
        .map(cleanStr)
        .filter(Boolean)
        .map((line: string) => ({ bullets: [line] })),
    } as any;
  }, [draft]);

  const baseName = `${(templateProps.header?.name || "resume")
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]/g, "")
    .slice(0, 40)}_TechVC1`;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: baseName,
  });

  function handleDownloadPdfFull() {
    setBusy(true);
    try {
      withResumePrintStyles(() => handlePrint());
    } finally {
      setTimeout(() => setBusy(false), 800);
    }
  }

  function handleDownloadJson() {
    downloadJson(`${baseName}.json`, {
      template: "TechVC1",
      generatedAt: new Date().toISOString(),
      templateProps,
      draft,
    });
  }

  function handleDownloadTxt() {
    const header = templateProps.header ?? ({} as any);
    const lines: string[] = [];

    lines.push(cleanStr(header.name));
    if (cleanStr(header.title)) lines.push(cleanStr(header.title));
    lines.push("");

    const contact: string[] = [];
    if (cleanStr(header.address)) contact.push(cleanStr(header.address));
    if (cleanStr(header.phone)) contact.push(cleanStr(header.phone));
    if (cleanStr(header.email)) contact.push(cleanStr(header.email));
    if (cleanStr(header.linkedin)) contact.push(`LinkedIn: ${cleanStr(header.linkedin)}`);
    if (cleanStr(header.github)) contact.push(`GitHub: ${cleanStr(header.github)}`);
    if (cleanStr(header.portfolio)) contact.push(`WWW: ${cleanStr(header.portfolio)}`);
    if (contact.length) lines.push(...contact, "");

    if (cleanStr(templateProps.summary)) {
      lines.push("SUMMARY");
      lines.push(cleanStr(templateProps.summary));
      lines.push("");
    }

    if (Array.isArray(templateProps.experience) && templateProps.experience.length) {
      lines.push("EXPERIENCE");
      for (const ex of templateProps.experience as any[]) {
        lines.push(`${cleanStr(ex.dateRange)}  ${cleanStr(ex.role)}`);
        const cl = [cleanStr(ex.company), cleanStr(ex.location)].filter(Boolean).join(" — ");
        if (cl) lines.push(cl);
        const bullets = safeArray<string>(ex.bullets);
        for (const b of bullets) lines.push(`- ${cleanStr(b)}`);
        lines.push("");
      }
    }

    const skillsRows = safeArray<any>((templateProps as any)?.skills?.rows);
    if (skillsRows.length) {
      lines.push("SKILLS");
      for (const r of skillsRows) {
        const l = cleanStr(r.label);
        const v = cleanStr(r.value);
        if (l || v) lines.push(`${l}${l ? ": " : ""}${v}`);
      }
      lines.push("");
    }

    if (Array.isArray(templateProps.education) && templateProps.education.length) {
      lines.push("EDUCATION");
      for (const ed of templateProps.education as any[]) {
        lines.push(`${cleanStr(ed.dateRange)}  ${cleanStr(ed.degreeLine)}`);
        const il = [cleanStr(ed.institute), cleanStr(ed.meta)].filter(Boolean).join(" — ");
        if (il) lines.push(il);
        lines.push("");
      }
    }

    const acc = safeArray<any>(templateProps.achievements);
    if (acc.length) {
      lines.push("PROFESSIONAL ACCOLADES");
      for (const a of acc) {
        const b0 = cleanStr(a?.bullets?.[0] ?? "");
        if (b0) lines.push(`- ${b0}`);
      }
      lines.push("");
    }

    downloadText(`${baseName}.txt`, lines.join("\n").trim() + "\n");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Final — Download</h2>
        <p className="mt-1 text-sm text-slate-600">
          Download 3 formats: PDF (print), JSON (draft export), TXT (plain text).
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdfFull}
            disabled={busy}
            className={[
              "rounded-lg px-4 py-2 text-sm font-semibold text-white",
              busy ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800",
            ].join(" ")}
          >
            {busy ? "Preparing..." : "Download PDF (Print)"}
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Download JSON (Export)
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Download TXT (Plain)
          </button>

          <button
            type="button"
            onClick={onPrev}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Back
          </button>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          PDF uses browser print dialog. Choose: <b>Save as PDF</b>, <b>A4</b>, <b>Margins: None</b>.
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <TechVC1Preview data={templateProps as any} />
      </div>

      {/* PRINT TARGET - ALL 3 PAGES STACKED - KEY FIX: Don't pass page prop */}
      <div style={{ position: "absolute", left: -99999, top: 0 }}>
        <div id="resume-print" ref={printRef}>
          {/* Render all 3 pages explicitly */}
          <TechVC1Template {...(templateProps as any)} page={undefined} />
        </div>
      </div>
    </div>
  );
}