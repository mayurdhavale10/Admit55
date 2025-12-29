"use client";

import { BschoolMatchMode } from "@src/lib/bschoolmatch/types";

interface ModeSelectorProps {
  mode: BschoolMatchMode;
  onChange: (mode: BschoolMatchMode) => void;
}

const MODE_ORDER: BschoolMatchMode[] = ["quick-profile", "resume-upload"];

const MODE_LABELS: Record<BschoolMatchMode, string> = {
  "quick-profile": "Quick Profile",
  "resume-upload": "Upload Resume",
};

const MODE_SUBTITLES: Record<BschoolMatchMode, string> = {
  "quick-profile": "No resume · 3–5 minutes",
  "resume-upload": "Recommended · Resume + 4 key questions",
};

export default function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {MODE_ORDER.map((m) => {
        const isActive = m === mode;

        const base =
          "flex flex-col justify-center rounded-2xl border px-6 py-4 transition-all shadow-sm w-full min-h-[92px] text-left";
        const active =
          "border-white bg-white text-[#0A2540] shadow-[0_10px_30px_rgba(15,23,42,0.35)] scale-[1.02]";
        const inactive =
          "border-white/20 bg-white/5 text-[#DCEBFF] hover:bg-white/10 hover:border-white/40";

        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`${base} ${isActive ? active : inactive}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-semibold tracking-tight">
                {MODE_LABELS[m]}
              </span>

              {m === "resume-upload" && (
                <span
                  className={`inline-flex text-[11px] px-2 py-1 rounded-full font-extrabold shadow-sm ${
                    isActive
                      ? "bg-amber-400 text-amber-900"
                      : "bg-amber-400/20 text-amber-200"
                  }`}
                >
                  RECOMMENDED
                </span>
              )}
            </div>

            <p
              className={`mt-2 text-[13px] leading-snug ${
                isActive ? "text-slate-600" : "text-[#DCEBFF]/80"
              }`}
            >
              {MODE_SUBTITLES[m]}
            </p>
          </button>
        );
      })}
    </div>
  );
}
