"use client";

import React from "react";

export type ConsultingEducationRow = {
  degree?: string;
  institution?: string;
  overallScore?: string; // maps to "score"
  performanceHighlight?: string; // maps to "distinction"
  year?: string;
};

type Props = {
  items?: ConsultingEducationRow[];
};

const DEFAULT_EDU: Required<ConsultingEducationRow>[] = [
  {
    degree: "MBA",
    institution: "IIM Ahmedabad",
    overallScore: "3.1/4.3",
    performanceHighlight: "PGP-2 CGPA: 3.5/4.3",
    year: "2023",
  },
  {
    degree: "CA (Final)",
    institution: "Institute of Chartered Accountants of India",
    overallScore: "62.0%",
    performanceHighlight: "Exemption (60%+) in 4/8 subjects",
    year: "2017",
  },
  {
    degree: "B. Com (Hons)",
    institution: "I.P. College for Women, Delhi University",
    overallScore: "73.2%",
    performanceHighlight: "Top 25% out of 150+ students",
    year: "2013",
  },
];

const EducationTable: React.FC<Props> = ({ items }) => {
  const incoming = Array.isArray(items) ? items : [];

  // Always build 3 rows (1&2 required; 3 optional)
  const merged = [0, 1, 2].map((i) => incoming[i] ?? DEFAULT_EDU[i]);

  // Hide row 3 if fully blank (optional)
  const rows = merged.filter((r, idx) => {
    if (idx < 2) return true;
    const degree = String(r.degree ?? "").trim();
    const inst = String(r.institution ?? "").trim();
    const score = String(r.overallScore ?? "").trim();
    const dist = String(r.performanceHighlight ?? "").trim();
    const year = String(r.year ?? "").trim();
    return degree || inst || score || dist || year;
  });

  if (!rows.length) return null;

  return (
    <section className="mt-1 w-full max-w-full font-serif">
      {/* KEEP BLACK title bar EXACTLY */}
      <div className="w-full bg-black px-3 py-[5px]">
        <div className="text-white font-semibold tracking-wide text-[13px] leading-none">
          EDUCATION
        </div>
      </div>

      {/* Table */}
      <div className="w-full max-w-full overflow-hidden border border-black">
        {rows.map((r, idx) => (
          <div
            key={`${r.degree ?? "edu"}-${idx}`}
            // ✅ FIX: first column is 160px to align with WORK EXPERIENCE left column
            className={`grid w-full min-w-0 grid-cols-[160px_minmax(0,1fr)_120px_minmax(0,1fr)_70px] items-stretch text-[12px] ${
              idx !== rows.length - 1 ? "border-b border-black" : ""
            }`}
          >
            {/* Degree (grey like PDF) */}
            <div className="border-r border-black px-3 py-2 font-semibold bg-[#f2f2f2] whitespace-nowrap overflow-hidden text-ellipsis">
              {r.degree ?? ""}
            </div>

            {/* Institution */}
            <div className="border-r border-black px-3 py-2 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {r.institution ?? ""}
            </div>

            {/* Score */}
            <div className="border-r border-black px-3 py-2 text-center font-semibold whitespace-nowrap">
              {r.overallScore ?? ""}
            </div>

            {/* Distinction (force single line) */}
            <div className="border-r border-black px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis">
              {r.performanceHighlight ?? ""}
            </div>

            {/* Year */}
            <div className="px-3 py-2 text-center whitespace-nowrap">
              {r.year ?? ""}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default EducationTable;
