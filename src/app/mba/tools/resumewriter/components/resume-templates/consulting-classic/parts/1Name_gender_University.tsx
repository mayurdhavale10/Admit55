"use client";

import React from "react";

export type NameGenderUniversityProps = {
  name: string;
  gender?: string;
  /** Optional logo node (svg/img/etc) */
  logo?: React.ReactNode;
  /** University / Institute name shown on the right (user-entered) */
  universityName?: string;
};

const NameGenderUniversity: React.FC<NameGenderUniversityProps> = ({
  name,
  gender,
  logo,
  universityName,
}) => {
  const uni = (universityName ?? "").trim();

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4">
      {/* Left: Name | Gender (single line) */}
      <div className="min-w-0">
        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
          <span className="text-[34px] leading-none font-extrabold text-black font-serif">
            {name}
          </span>
          <span className="mx-2 text-[28px] font-semibold text-black font-serif">
            |
          </span>
          <span className="text-[22px] font-semibold text-black font-serif">
            {gender ?? ""}
          </span>
        </div>
      </div>

      {/* Right: Logo OR University text (NOT hard-coded) */}
      <div className="shrink-0 flex items-center justify-end">
        {logo ? (
          <div className="w-[70px] h-[70px] flex items-center justify-center">
            {logo}
          </div>
        ) : uni ? (
          <div className="text-right leading-tight">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-700">
              {uni}
            </div>
          </div>
        ) : (
          // If nothing provided, show nothing (keeps spacing/layout stable)
          <div className="text-right leading-tight">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-transparent select-none">
              .
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NameGenderUniversity;
