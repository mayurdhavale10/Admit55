"use client";

import { BschoolMatchMode } from "@src/lib/bschoolmatch/types";
import { MODE_LABELS } from "@src/lib/bschoolmatch/prompts";

interface ModeSelectorProps {
  mode: BschoolMatchMode;
  onChange: (mode: BschoolMatchMode) => void;
}

const MODE_ORDER: BschoolMatchMode[] = [
  "questions-only",
  "resume-upload",
  "resume-from-profile",
];

const MODE_SUBTITLES: Record<BschoolMatchMode, string> = {
  "questions-only": "Fastest way to start · 2–3 minutes",
  "resume-upload": "Let us read your résumé and refine the match",
  "resume-from-profile": "Reuse your saved Admit55 profile data",
};

export default function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      {MODE_ORDER.map((m) => {
        const isActive = m === mode;

        const baseClasses =
          "flex flex-col justify-center rounded-2xl border px-6 py-4 transition-all shadow-sm w-full min-h-[90px]";

        // ✨ Active card — premium soft white with navy text
        const activeClasses =
          "border-white bg-white text-[#0A2540] shadow-[0_10px_30px_rgba(15,23,42,0.35)] scale-[1.02]";

        // ✨ Inactive card — soft navy with subtle glow
        const inactiveClasses =
          "border-white/20 bg-white/5 text-[#DCEBFF] hover:bg-white/10 hover:border-white/40";

        const label = MODE_LABELS[m] ?? m.replace("-", " ");
        const subtitle = MODE_SUBTITLES[m];

        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`${baseClasses} ${
              isActive ? activeClasses : inactiveClasses
            }`}
          >
            <span className="text-base font-semibold tracking-tight">
              {label}
            </span>

            <p
              className={`mt-2 text-[13px] leading-snug ${
                isActive ? "text-slate-600" : "text-[#DCEBFF]/80"
              }`}
            >
              {subtitle}
            </p>
          </button>
        );
      })}
    </div>
  );
}
