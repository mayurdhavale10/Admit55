"use client";

import React from "react";

type LoadingStateProps = {
  message?: string;
};

const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Running your B-School Match…",
}) => {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/95 px-5 py-8 text-center text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm">
      <div className="mb-3 h-9 w-9 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      <h2 className="text-sm font-semibold tracking-tight text-slate-900">
        {message}
      </h2>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
        This usually takes a few seconds as we parse your inputs and generate
        Dream / Competitive / Safe clusters.
      </p>
    </div>
  );
};

export default LoadingState;
