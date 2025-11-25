"use client";

import React from "react";

export interface RecommendationItem {
  id?: string;
  type?: string;
  area?: string;
  priority?: "high" | "medium" | "low" | string;
  current_score?: number | null;
  action: string;
  estimated_impact?: string;
}

interface RecommendationCardProps {
  recommendations: RecommendationItem[];
}

export default function RecommendationCard({
  recommendations,
}: RecommendationCardProps) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <section className="rounded-3xl border border-sky-100 bg-gradient-to-b from-sky-50 to-cyan-50 px-6 py-6 md:px-8 md:py-8 shadow-sm w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-sky-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900">
            Actionable Recommendations
          </h3>
          <p className="text-xs md:text-sm text-slate-600 mt-0.5">
            Concrete next steps to strengthen your MBA profile.
          </p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4 md:space-y-5">
        {recommendations.map((item, idx) => {
          const scoreText =
            typeof item.current_score === "number" &&
            !Number.isNaN(item.current_score)
              ? `${Math.round(item.current_score)}/100`
              : null;

          return (
            <div
              key={item.id ?? idx}
              className="rounded-2xl bg-white/95 border border-sky-100 px-4 py-4 md:px-6 md:py-5 shadow-sm"
            >
              <div className="flex gap-4">
                {/* Number Badge */}
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white text-sm font-bold shadow-md">
                    {idx + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.area && (
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 border border-sky-100">
                        {item.area}
                      </span>
                    )}
                    {item.priority && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 border border-amber-100">
                        Priority: {item.priority.toString().toUpperCase()}
                      </span>
                    )}
                    {scoreText && (
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-100">
                        Current: {scoreText}
                      </span>
                    )}
                  </div>

                  <p className="text-sm md:text-base text-slate-800 leading-relaxed">
                    {item.action}
                  </p>

                  {item.estimated_impact && (
                    <p className="text-xs md:text-sm text-sky-700 mt-1 italic">
                      💡 {item.estimated_impact}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
