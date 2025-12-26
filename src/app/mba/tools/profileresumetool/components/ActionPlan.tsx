"use client";

import React from "react";

export type ActionItem = {
  title: string;
  detail?: string;
  metric?: string;
  eta?: string;
  owner?: string;
  priority?: "high" | "medium" | "low" | string;
  current_score?: number;
};

type Props = {
  next4to6Weeks: ActionItem[];
  next3Months: ActionItem[];
};

function PriorityPill({ priority }: { priority?: string }) {
  const p = (priority || "").toLowerCase();
  const cls =
    p === "high"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : p === "medium"
      ? "bg-sky-100 text-sky-800 border-sky-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      Priority: {p ? p.toUpperCase() : "—"}
    </span>
  );
}

function ScorePill({ score }: { score?: number }) {
  if (typeof score !== "number") return null;
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
      Current: {Math.round(score)}/100
    </span>
  );
}

function ItemCard({ item, index }: { item: ActionItem; index: number }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-sky-600 text-white flex items-center justify-center text-sm font-bold">
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-900">
              {item.title}
            </span>
            <PriorityPill priority={item.priority as string} />
            <ScorePill score={item.current_score} />
          </div>

          {item.detail ? (
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">{item.detail}</p>
          ) : null}

          {(item.metric || item.eta || item.owner) ? (
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
              {item.metric ? <span className="rounded-md bg-slate-50 px-2 py-1 border">Metric: {item.metric}</span> : null}
              {item.eta ? <span className="rounded-md bg-slate-50 px-2 py-1 border">ETA: {item.eta}</span> : null}
              {item.owner ? <span className="rounded-md bg-slate-50 px-2 py-1 border">Owner: {item.owner}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Column({
  number,
  title,
  items,
}: {
  number: number;
  title: string;
  items: ActionItem[];
}) {
  return (
    <div className="rounded-2xl border bg-white/60 p-5">
      {/* ✅ render header ONCE */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${
            number === 1 ? "bg-blue-600" : "bg-emerald-600"
          }`}
        >
          {number}
        </div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-slate-600">No items yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((it, idx) => (
            <ItemCard key={`${title}-${idx}-${it.title}`} item={it} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ActionPlan({ next4to6Weeks, next3Months }: Props) {
  return (
    <div className="rounded-2xl border bg-sky-50/60 p-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-800 font-bold">
          ✓
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Your Action Plan</h2>
          <p className="text-sm text-slate-600">Concrete next steps to strengthen your MBA profile.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Column number={1} title="Next 4–6 Weeks" items={next4to6Weeks} />
        <Column number={2} title="Next 3 Months" items={next3Months} />
      </div>
    </div>
  );
}
