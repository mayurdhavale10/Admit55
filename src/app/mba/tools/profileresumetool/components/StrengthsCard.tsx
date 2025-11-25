"use client";

import React from "react";

export interface StrengthItem {
  title: string;
  summary: string;
  score?: number;
}

interface StrengthsCardProps {
  strengths: StrengthItem[];
}

export default function StrengthsCard({ strengths }: StrengthsCardProps) {
  if (!strengths || strengths.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-gray-900">
              Top Strengths
            </h3>
            <p className="text-xs text-gray-500">
              What stands out positively in your MBA profile.
            </p>
          </div>
        </div>
      </div>

      {/* Strengths List */}
      <div className="space-y-3">
        {strengths.map((strength, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              idx !== 0 ? "pt-3 border-t border-gray-100" : ""
            }`}
          >
            {/* Number Badge */}
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-semibold shadow-sm">
                {idx + 1}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm md:text-[15px] font-semibold text-gray-900 leading-snug">
                  {strength.title}
                </h4>
                {typeof strength.score === "number" && !Number.isNaN(strength.score) && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {Math.round(strength.score)}/100
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                {strength.summary}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
