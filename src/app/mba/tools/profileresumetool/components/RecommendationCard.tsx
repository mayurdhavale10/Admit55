"use client";

import React from "react";

export interface RecommendationItem {
  id?: string;
  type?: string;
  area?: string;
  priority?: "high" | "medium" | "low" | string;
  current_score?: number | null;
  score?: number | null;
  action?: string | null;
  estimated_impact?: string | null;
  timeframe?: string | null;
}

interface RecommendationCardProps {
  recommendations: RecommendationItem[];
}

/* ================================
   Timeframe normalization
================================ */
type TF = "next_1_3_weeks" | "next_3_6_weeks" | "next_3_months" | "unknown";

function normalizeTimeframe(tf?: string | null): TF {
  const t = (tf || "").toLowerCase().trim();
  if (!t) return "unknown";

  if (t === "next_1_3_weeks") return "next_1_3_weeks";
  if (t === "next_3_6_weeks" || t === "next_4_6_weeks") return "next_3_6_weeks";
  if (t === "next_3_months") return "next_3_months";

  if (t.includes("1-3") || t.includes("1 to 3")) return "next_1_3_weeks";
  if (t.includes("3-6") || t.includes("4-6")) return "next_3_6_weeks";
  if (t.includes("month") || t.includes("3 month")) return "next_3_months";

  return "unknown";
}

function normalizeScore(v?: number | null): number | null {
  if (typeof v !== "number" || Number.isNaN(v)) return null;
  if (v <= 10) return Math.round(v * 10);
  return Math.round(Math.min(100, Math.max(0, v)));
}

/* ================================
   Item Card
================================ */
function RecommendationItemCard({
  item,
  idx,
}: {
  item: RecommendationItem;
  idx: number;
}) {
  const rawScore =
    typeof item.current_score === "number"
      ? item.current_score
      : typeof item.score === "number"
      ? item.score
      : null;

  const score = normalizeScore(rawScore);
  const scoreText = score !== null ? `${score}/100` : null;

  return (
    <div className="rounded-2xl bg-white/95 border border-sky-100 px-4 py-4 shadow-sm">
      <div className="flex gap-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white flex items-center justify-center text-sm font-bold">
          {idx}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            {item.area && (
              <span className="px-2.5 py-1 text-xs rounded-full bg-sky-50 border border-sky-100 text-sky-800">
                {item.area}
              </span>
            )}
            {item.priority && (
              <span className="px-2.5 py-1 text-xs rounded-full bg-amber-50 border border-amber-100 text-amber-800">
                Priority: {String(item.priority).toUpperCase()}
              </span>
            )}
            {scoreText && (
              <span className="px-2.5 py-1 text-xs rounded-full bg-slate-50 border border-slate-100 text-slate-700">
                Current: {scoreText}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-800 leading-relaxed">
            {item.action || "Action not provided."}
          </p>

          {item.estimated_impact && (
            <p className="text-xs text-sky-700 italic">
              💡 {item.estimated_impact}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================
   Main Component
================================ */
export default function RecommendationCard({
  recommendations,
}: RecommendationCardProps) {
  if (!recommendations?.length) return null;

  const buckets: Record<TF, RecommendationItem[]> = {
    next_1_3_weeks: [],
    next_3_6_weeks: [],
    next_3_months: [],
    unknown: [],
  };

  for (const r of recommendations) {
    buckets[normalizeTimeframe(r.timeframe)].push(r);
  }

  return (
    <section className="rounded-3xl border border-sky-100 bg-gradient-to-b from-sky-50 to-cyan-50 px-6 py-6 shadow-sm">
      <header className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">Your Action Plan</h3>
        <p className="text-sm text-slate-600">
          Tactical, time-bound steps aligned to admissions outcomes.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          ["next_1_3_weeks", "Next 1–3 Weeks", "bg-blue-600"],
          ["next_3_6_weeks", "Next 3–6 Weeks", "bg-indigo-600"],
          ["next_3_months", "Next 3 Months", "bg-emerald-600"],
        ].map(([key, label, color], colIdx) => (
          <div key={key} className="rounded-3xl bg-white/60 border border-sky-100 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-9 h-9 rounded-2xl text-white flex items-center justify-center font-bold ${color}`}
              >
                {colIdx + 1}
              </div>
              <h4 className="text-base font-bold text-slate-900">{label}</h4>
            </div>

            <div className="space-y-4">
              {buckets[key as TF].length ? (
                buckets[key as TF].map((item, idx) => (
                  <RecommendationItemCard
                    key={item.id ?? `${key}-${idx}`}
                    item={item}
                    idx={idx + 1}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500">No actions yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
