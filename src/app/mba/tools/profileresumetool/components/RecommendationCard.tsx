"use client";

import React from "react";

export interface RecommendationItem {
  id?: string;
  type?: string;
  area?: string;
  priority?: "high" | "medium" | "low" | string;

  // NEW pipeline uses current_score, older ones might use score
  current_score?: number | null;
  score?: number | null;

  action?: string | null;
  estimated_impact?: string | null;

  // Supports “Next 4–6 Weeks / Next 3 Months”
  timeframe?: string | null; // e.g. "next_4_6_weeks" | "next_3_months" | "4-6 weeks" | "3 months"
}

interface RecommendationCardProps {
  recommendations: RecommendationItem[];
}

type TF = "next_4_6_weeks" | "next_3_months" | "unknown";

function normalizeTimeframe(tf?: string | null): TF {
  const t = (tf || "").toLowerCase().trim();
  if (!t) return "unknown";

  // explicit keys first
  if (t === "next_4_6_weeks") return "next_4_6_weeks";
  if (t === "next_3_months") return "next_3_months";

  // weeks bucket (more strict to avoid mis-bucketing)
  if (
    t.includes("4-6") ||
    t.includes("4–6") ||
    t.includes("4 to 6") ||
    t.includes("4- 6") ||
    (t.includes("week") && !t.includes("month")) ||
    t.includes("next 4") ||
    t.includes("next 6")
  ) {
    return "next_4_6_weeks";
  }

  // months bucket
  if (
    t.includes("3 month") ||
    t.includes("three month") ||
    t.includes("next_3_months") ||
    t.includes("next 3") ||
    t.includes("3 months")
  ) {
    return "next_3_months";
  }

  return "unknown";
}

function normalizeScore(v: number | null | undefined): number | null {
  if (typeof v !== "number" || Number.isNaN(v)) return null;
  // if backend sends 0-10 scale, convert to 0-100
  if (v <= 10) return Math.round(Math.max(0, Math.min(10, v)) * 10);
  return Math.round(Math.max(0, Math.min(100, v)));
}

function RecommendationItemCard({ item, idx }: { item: RecommendationItem; idx: number }) {
  const rawScore =
    typeof item.current_score === "number"
      ? item.current_score
      : typeof item.score === "number"
      ? item.score
      : null;

  const score = normalizeScore(rawScore);
  const scoreText = typeof score === "number" ? `${score}/100` : null;

  const actionText =
    typeof item.action === "string" && item.action.trim().length > 0
      ? item.action.trim()
      : "Action not provided.";

  const impactText =
    typeof item.estimated_impact === "string" && item.estimated_impact.trim().length > 0
      ? item.estimated_impact.trim()
      : null;

  return (
    <div className="rounded-2xl bg-white/95 border border-sky-100 px-4 py-4 md:px-6 md:py-5 shadow-sm">
      <div className="flex gap-4">
        {/* Number Badge */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white text-sm font-bold shadow-md">
            {idx}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {item.area ? (
              <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 border border-sky-100">
                {item.area}
              </span>
            ) : null}

            {item.priority ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 border border-amber-100">
                Priority: {String(item.priority).toUpperCase()}
              </span>
            ) : null}

            {scoreText ? (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-100">
                Current: {scoreText}
              </span>
            ) : null}
          </div>

          <p className="text-sm md:text-base text-slate-800 leading-relaxed">{actionText}</p>

          {impactText ? (
            <p className="text-xs md:text-sm text-sky-700 mt-1 italic">💡 {impactText}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function RecommendationCard({ recommendations }: RecommendationCardProps) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) return null;

  const bucketA: RecommendationItem[] = [];
  const bucketB: RecommendationItem[] = [];
  const unknown: RecommendationItem[] = [];

  for (const r of recommendations) {
    const tf = normalizeTimeframe(r.timeframe);
    if (tf === "next_4_6_weeks") bucketA.push(r);
    else if (tf === "next_3_months") bucketB.push(r);
    else unknown.push(r);
  }

  // If pipeline didn’t send timeframe, still keep UI consistent:
  // fill 4–6 weeks first, then overflow into 3 months.
  if (bucketA.length === 0 && bucketB.length === 0 && unknown.length > 0) {
    for (const r of unknown) {
      if (bucketA.length <= bucketB.length) bucketA.push(r);
      else bucketB.push(r);
    }
  }

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
            aria-hidden="true"
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
          <h3 className="text-lg md:text-xl font-bold text-slate-900">Your Action Plan</h3>
          <p className="text-xs md:text-sm text-slate-600 mt-0.5">
            Concrete next steps to strengthen your MBA profile.
          </p>
        </div>
      </div>

      {/* Two timeframe columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* Next 4–6 Weeks */}
        <div className="rounded-3xl bg-white/60 border border-sky-100 p-4 md:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="text-base md:text-lg font-bold text-slate-900">Next 4–6 Weeks</h4>
          </div>

          <div className="space-y-4">
            {bucketA.length ? (
              bucketA.map((item, idx) => (
                <RecommendationItemCard
                  key={item.id ?? `a-${idx}-${item.area ?? "rec"}`}
                  item={item}
                  idx={idx + 1}
                />
              ))
            ) : (
              <p className="text-sm text-slate-600">No items yet.</p>
            )}
          </div>
        </div>

        {/* Next 3 Months */}
        <div className="rounded-3xl bg-white/60 border border-sky-100 p-4 md:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="text-base md:text-lg font-bold text-slate-900">Next 3 Months</h4>
          </div>

          <div className="space-y-4">
            {bucketB.length ? (
              bucketB.map((item, idx) => (
                <RecommendationItemCard
                  key={item.id ?? `b-${idx}-${item.area ?? "rec"}`}
                  item={item}
                  idx={idx + 1}
                />
              ))
            ) : (
              <p className="text-sm text-slate-600">No items yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
