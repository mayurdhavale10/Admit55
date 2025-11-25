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
    <div className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 text-rose-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v3m0 4h.01M10.29 3.86L3.82 16a1 1 0 00.9 1.45h14.56a1 1 0 00.9-1.45L13.71 3.86a1 1 0 00-1.82 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-base md:text-lg font-bold text-gray-900">
            Improvement Areas
          </h3>
          <p className="text-xs text-gray-500">
            Focus here to further strengthen your MBA profile.
          </p>
        </div>
      </div>

      {/* Improvements List */}
      <div className="space-y-3">
        {improvements.map((item, idx) => {
          const scoreNum =
            typeof item.score === "number" && !Number.isNaN(item.score)
              ? Math.round(item.score)
              : null;

          return (
            <div
              key={idx}
              className={`flex gap-3 ${
                idx !== 0 ? "pt-3 border-t border-gray-100" : ""
              }`}
            >
              {/* Number Badge */}
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-rose-500 text-white text-sm font-semibold shadow-sm">
                  {idx + 1}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-sm md:text-[15px] font-semibold text-gray-900 leading-snug">
                      {item.area}
                    </h4>
                    <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                      {item.suggestion}
                    </p>
                  </div>

                  {/* Score Badge */}
                  {scoreNum !== null && (
                    <span className="flex-shrink-0 inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 whitespace-nowrap">
                      {scoreNum}/100
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
