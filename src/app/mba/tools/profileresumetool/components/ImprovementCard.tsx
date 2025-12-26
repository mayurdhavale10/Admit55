"use client";

import React from "react";

export interface ImprovementItem {
  area: string;
  score: number | null;
  suggestion: string;
}

interface ImprovementCardProps {
  improvements: ImprovementItem[];
}

export default function ImprovementCard({ improvements }: ImprovementCardProps) {
  if (!improvements || improvements.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-orange-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-extrabold text-slate-900">
          Improvement Areas
        </h3>
      </div>

      {/* Improvements List */}
      <div className="space-y-5">
        {improvements.map((item, idx) => {
          const scoreNum =
            typeof item.score === "number" && !Number.isNaN(item.score)
              ? Math.round(item.score)
              : null;

          return (
            <div
              key={idx}
              className="border-l-4 border-orange-500 bg-gradient-to-r from-orange-50/50 to-transparent pl-5 pr-4 py-4 rounded-r-lg"
            >
              {/* Number and Title */}
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-slate-900 text-white text-sm font-bold">
                  {idx + 1}
                </div>
                <h4 className="flex-1 text-base font-bold text-slate-900 leading-tight">
                  {item.area}
                </h4>
              </div>

              {/* Suggestion */}
              <p className="text-sm text-slate-700 leading-relaxed pl-10">
                {item.suggestion}
              </p>

              {/* Risk Tags */}
              <div className="flex flex-wrap gap-2 mt-3 pl-10">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-red-100 text-red-800 text-xs font-medium">
                  Test risk
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-red-100 text-red-800 text-xs font-medium">
                  Academic risk
                </span>
              </div>

              {/* AdCom Note */}
              <div className="mt-3 pl-10 text-xs italic text-slate-600 leading-relaxed">
                A strong test score is often a non-negotiable requirement and acts as a filter.
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}