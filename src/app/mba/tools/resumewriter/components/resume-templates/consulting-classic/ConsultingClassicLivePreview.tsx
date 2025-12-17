"use client";

import React from "react";

import NameGenderUniversity from "./parts/1Name_gender_University";
import Achivements from "./parts/2Achivements";

import type { ResumeData } from "../../../utils/resumeTypes";

type Props = {
  data: ResumeData;
};

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mt-3 border-b border-black pb-1">
      <div className="text-[12px] font-bold uppercase tracking-wide font-serif">
        {title}
      </div>
    </div>
  );
}

function PlaceholderLines({ n = 3 }: { n?: number }) {
  return (
    <div className="mt-2 space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-[8px] w-full bg-slate-200" />
      ))}
    </div>
  );
}

export default function ConsultingClassicLivePreview({ data }: Props) {
  const fullName = `${data.basicInfo?.firstName ?? ""} ${data.basicInfo?.lastName ?? ""}`.trim();

  const email = data.basicInfo?.email ?? "";
  const phone = data.basicInfo?.phone ?? "";
  const location = data.basicInfo?.location ?? "";

  // ✅ blue bar items come from basicInfo.metaBar
  const metaBar = data.basicInfo?.metaBar ?? [];

  return (
    <div className="w-full">
      {/* A4 FRAME */}
      <div
        className="
          w-full aspect-[210/297]
          bg-white text-black
          border border-black
          rounded-xl
          overflow-hidden
          shadow-sm
        "
      >
        <div className="p-6">
          {/* ===== HEADER (REAL) ===== */}
          <NameGenderUniversity
            name={fullName || "YOUR NAME"}
            gender={data.basicInfo?.gender || ""}
            universityName="IIM Ahmedabad"
          />

          {/* Contact row (simple) */}
          <div className="mt-2 text-[11px] text-slate-700 font-serif flex flex-wrap gap-x-3 gap-y-1">
            <span>{email || "email@example.com"}</span>
            <span>•</span>
            <span>{phone || "+91-XXXXXXXXXX"}</span>
            <span>•</span>
            <span>{location || "City, Country"}</span>
          </div>

          {/* ===== BLUE BAR (REAL) ===== */}
          <div className="mt-3">
            <Achivements
              items={
                metaBar.length > 0
                  ? metaBar
                  : [
                      "Cars24 Arabia (UAE)",
                      "Alvarez & Marsal (India)",
                      "IIM Ahmedabad",
                      "Chartered Accountant",
                      "Grant Thornton Bharat LLP",
                    ]
              }
            />
          </div>

          {/* ===== BODY FRAME (SKELETON but FULL) ===== */}
          <div className="mt-4 grid grid-cols-[2fr_1fr] gap-6">
            {/* LEFT COLUMN */}
            <div>
              <SectionTitle title="Work Experience" />
              <PlaceholderLines n={6} />

              <SectionTitle title="Projects / Casework" />
              <PlaceholderLines n={5} />

              <SectionTitle title="Leadership & Extracurricular" />
              <PlaceholderLines n={5} />
            </div>

            {/* RIGHT COLUMN */}
            <div>
              <SectionTitle title="Education" />
              <PlaceholderLines n={4} />

              <SectionTitle title="Skills" />
              <PlaceholderLines n={4} />

              <SectionTitle title="Additional" />
              <PlaceholderLines n={3} />
            </div>
          </div>
        </div>
      </div>

      {/* tiny note */}
      <p className="mt-2 text-xs text-slate-500">
        Right side is the full template frame. Only Basic Info + Blue bar are live in Step 1.
      </p>
    </div>
  );
}
