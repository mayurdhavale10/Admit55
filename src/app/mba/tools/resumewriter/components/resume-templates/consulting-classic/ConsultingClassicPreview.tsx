// src/app/mba/tools/resumewriter/components/resume-templates/consulting-classic/ConsultingClassicPreview.tsx
"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

// ✅ Stable import (no relative-path pain)
// If your project doesn't support "@/...", replace with:
// import ConsultingClassicTemplate from "./ConsultingClassicTemplate";
import ConsultingClassicTemplate from "../ConsultingClassicTemplate";
/** Avoid importing types from parts/* because your paths are failing right now */
export type ResumePreviewData = {
  header: {
    name: string;
    gender: string;
    university: string;
    email: string;
    phone: string;
    location: string;
  };
  metaBar: string[];

  educationRows?: any[];
  experiences?: any[];

  scholasticBlocks?: any[];

  articleSectionTitle?: string;
  articleHeaderRight?: string;
  articleBlocks?: any[];

  // ✅ Step 6 wiring
  leadershipTitle?: string;
  leadershipBlocks?: any[];
};

type Props = { data?: ResumePreviewData };

const DEFAULT_DATA: ResumePreviewData = {
  header: {
    name: "Vaishali Gupta",
    gender: "Female",
    university: "IIM Ahmedabad",
    email: "email@example.com",
    phone: "+91-1234567890",
    location: "Dubai (Relocating to Mumbai)",
  },
  metaBar: [
    "Cars24 Arabia (UAE)",
    "Alvarez & Marsal (India)",
    "IIM Ahmedabad",
    "Chartered Accountant",
    "Grant Thornton Bharat LLP",
  ],
  educationRows: [],
  experiences: [],
  scholasticBlocks: undefined,
  articleSectionTitle: "ARTICLESHIP EXPERIENCE",
  articleHeaderRight: "36 months",
  articleBlocks: undefined,
  leadershipTitle: "POSITIONS OF RESPONSIBILITY & EXTRACURRICULAR ACTIVITIES",
  leadershipBlocks: undefined,
};

const PAGE_W = 794;
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export default function ConsultingClassicPreview({ data }: Props) {
  const d = data ?? DEFAULT_DATA;

  const frameRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(0.6);
  const [scaledH, setScaledH] = useState<number>(700);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const computeScale = () => {
      const w = el.clientWidth;
      const s = clamp((w / PAGE_W) * 0.98, 0.2, 1);
      setScale(s);
    };

    computeScale();
    const ro = new ResizeObserver(() => computeScale());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const measure = () => setScaledH(sheet.scrollHeight * scale);

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(sheet);
    return () => ro.disconnect();
  }, [scale]);

  return (
    <div className="w-full">
      <div
        ref={frameRef}
        className="w-full bg-white border border-slate-200 shadow-sm"
        style={{ height: Math.ceil(scaledH) + 24 }}
      >
        <div className="w-full flex justify-center items-start p-2">
          <div
            className="origin-top"
            style={{ transform: `scale(${scale})`, width: PAGE_W }}
          >
            <div ref={sheetRef}>
              <ConsultingClassicTemplate
                name={d.header.name}
                gender={d.header.gender}
                university={d.header.university}
                email={d.header.email}
                phone={d.header.phone}
                address={d.header.location}
                headerHighlights={d.metaBar}
                educationRows={d.educationRows as any}
                experienceItems={d.experiences as any}
                scholasticBlocks={d.scholasticBlocks as any}
                articleSectionTitle={d.articleSectionTitle}
                articleHeaderRight={d.articleHeaderRight}
                articleBlocks={d.articleBlocks as any}
                leadershipTitle={d.leadershipTitle}
                leadershipBlocks={d.leadershipBlocks as any}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
