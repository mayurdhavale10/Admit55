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
    <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-md">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Improvement Areas</h3>
        <p className="text-xs text-gray-600">
          These areas need attention to strengthen your MBA profile.
        </p>
      </div>

      {/* Improvements List */}
      <div className="space-y-4">
        {improvements.map((item, idx) => {
          const scoreNum =
            typeof item.score === "number" && !Number.isNaN(item.score)
              ? Math.round(item.score)
              : null;

          return (
            <div key={idx} className="flex gap-3">
              {/* Number Badge */}
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500 text-white text-sm font-bold shadow-sm">
                  {idx + 1}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <span className="font-bold text-red-700">{item.area}:</span>{' '}
                      {item.suggestion}
                    </p>
                  </div>
                  
                  {/* Score Badge */}
                  {scoreNum !== null && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-100 text-red-700 text-sm font-bold whitespace-nowrap">
                        {scoreNum}/100
                      </span>
                    </div>
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