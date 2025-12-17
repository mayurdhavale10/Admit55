"use client";

import React from "react";

type Props = {
  items?: string[];
};

const Achivements: React.FC<Props> = ({ items = [] }) => {
  const text = items.filter(Boolean).join("  |  ");
  if (!text) return null;

  return (
    <div className="w-full">
      {/* Match EDUCATION table outer border width */}
      <div className="w-full bg-[#1f4f82] border border-black px-4 py-[6px] -mb-px">
        <div
          className="
            text-white
            text-[11px]
            font-semibold
            leading-none
            whitespace-nowrap
            overflow-hidden
            text-ellipsis
            font-serif
          "
        >
          {text}
        </div>
      </div>
    </div>
  );
};

export default Achivements;
