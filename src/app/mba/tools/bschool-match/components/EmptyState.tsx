"use client";

import React from "react";

type EmptyStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Run your first B-School Match",
  description = "Answer a few questions on the left and we’ll build a Dream / Competitive / Safe school list tailored to your profile.",
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/95 px-5 py-8 text-center text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600">
        <span className="text-lg">🎓</span>
      </div>
      <h2 className="text-sm font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-400"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
