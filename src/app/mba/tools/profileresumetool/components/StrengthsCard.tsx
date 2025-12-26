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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-emerald-600"
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
        <h3 className="text-xl font-extrabold text-slate-900">
          Top Strengths
        </h3>
      </div>

      {/* Strengths List */}
      <div className="space-y-5">
        {strengths.map((strength, idx) => (
          <div
            key={idx}
            className="border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50/50 to-transparent pl-5 pr-4 py-4 rounded-r-lg"
          >
            {/* Number and Title */}
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-slate-900 text-white text-sm font-bold">
                {idx + 1}
              </div>
              <h4 className="flex-1 text-base font-bold text-slate-900 leading-tight">
                {strength.title}
              </h4>
            </div>

            {/* Summary */}
            <p className="text-sm text-slate-700 leading-relaxed pl-10">
              {strength.summary}
            </p>

            {/* Tags/Pills (if you have them from the API) */}
            <div className="flex flex-wrap gap-2 mt-3 pl-10">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-xs font-medium">
                Impact
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-xs font-medium">
                Leadership
              </span>
            </div>

            {/* AdCom Note */}
            <div className="mt-3 pl-10 text-xs italic text-slate-600 leading-relaxed">
              AdCom values candidates who can demonstrate tangible impact and growth.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}