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
    <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">Top Strengths</h3>
      </div>

      {/* Strengths List */}
      <div className="space-y-4">
        {strengths.map((strength, idx) => (
          <div key={idx} className="flex gap-3">
            {/* Number Badge */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500 text-white text-sm font-bold shadow-sm">
                {idx + 1}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-bold text-gray-900">{strength.title}:</span>{' '}
                {strength.summary}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}