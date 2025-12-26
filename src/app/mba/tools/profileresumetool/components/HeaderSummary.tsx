"use client";

import Image from "next/image";

type Props = {
  candidateName?: string;

  // scoring
  averageScore?: number | null;
  totalScore?: number | null;

  // content from header_summary
  summary?: string;
  highlights?: string[];
  applicantArchetypeTitle?: string;
  applicantArchetypeSubtitle?: string;

  verification?: { ok: boolean; explanation: string };

  // meta (optional, not displayed)
  generatedAt?: string;
  pipelineVersion?: string;
  processingMeta?: {
    total_duration_seconds?: number | null;
    input_method?: string;
    llm?: { provider?: string; model?: string; apiKeyMasked?: string };
  };
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function profilePill(avg?: number | null) {
  const a = typeof avg === "number" ? avg : null;

  if (a === null) {
    return { label: "Profile Summary", tone: "neutral" as const };
  }

  if (a >= 8) return { label: "Strong Profile", tone: "strong" as const };
  if (a >= 7.0) return { label: "Strong Base", tone: "base" as const };
  return { label: "Needs Focus", tone: "focus" as const };
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "strong" | "base" | "focus" | "neutral";
}) {
  const styles =
    tone === "strong"
      ? "border-emerald-300/60 bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-900 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-100"
      : tone === "base"
      ? "border-blue-300/60 bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-900 hover:border-blue-400 hover:shadow-md hover:shadow-blue-100"
      : tone === "focus"
      ? "border-amber-300/60 bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-900 hover:border-amber-400 hover:shadow-md hover:shadow-amber-100"
      : "border-slate-300/60 bg-gradient-to-r from-slate-50 to-slate-100/50 text-slate-900 hover:border-slate-400 hover:shadow-md hover:shadow-slate-100";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border-2 px-5 py-2.5 text-sm font-bold transition-all duration-300 ease-out hover:scale-105",
        styles
      )}
    >
      {children}
    </span>
  );
}

export default function HeaderSummary({
  candidateName,
  averageScore,
  summary,
  highlights,
  applicantArchetypeTitle,
  applicantArchetypeSubtitle,
}: Props) {
  const pill = profilePill(averageScore);

  const chips =
    Array.isArray(highlights) && highlights.length > 0
      ? highlights.filter(Boolean).slice(0, 18)
      : [];

  // Get accent color based on pill tone
  const accentColor =
    pill.tone === "strong"
      ? "border-emerald-500"
      : pill.tone === "base"
      ? "border-blue-500"
      : "border-amber-500";

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/30 to-white p-8 shadow-lg shadow-slate-200/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Row - Only Profile Pill */}
      <div className="flex items-center gap-2">
        <Pill tone={pill.tone}>{pill.label}</Pill>
      </div>

      {/* Title with Logo */}
      <div className="mt-8 flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-emerald-400/20 blur-xl rounded-full animate-pulse" />
          <Image
            src="/logo/admit55_final_logo.webp"
            alt="Admit55"
            width={48}
            height={48}
            className="w-12 h-12 object-contain relative z-10"
          />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            Your MBA Profile Analysis
          </h1>
          {candidateName?.trim() ? (
            <p className="mt-1.5 text-sm text-slate-600">
              Candidate: <span className="font-bold text-slate-800">{candidateName}</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* Highlight chips */}
      {chips.length > 0 && (
        <div className="mt-7 flex flex-wrap gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          {chips.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="rounded-lg border border-slate-300/70 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:shadow-md hover:border-slate-400 hover:scale-105 transition-all duration-200 ease-out"
              style={{
                animationDelay: `${i * 50}ms`,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Summary */}
      {summary?.trim() ? (
        <p className="mt-7 text-base leading-relaxed text-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          {summary}
        </p>
      ) : null}

      {/* Applicant Archetype - Glassmorphism */}
      {(applicantArchetypeTitle?.trim() || applicantArchetypeSubtitle?.trim()) && (
        <div className={cn(
          "mt-7 rounded-2xl border-l-4 bg-gradient-to-br from-teal-50/80 via-cyan-50/60 to-blue-50/80 backdrop-blur-md p-6 shadow-lg shadow-teal-100/50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400 hover:shadow-xl hover:scale-[1.01] transition-all duration-300",
          accentColor
        )}>
          <div className="flex items-center gap-3 text-teal-900">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400/30 to-blue-400/30 blur-lg rounded-full" />
              <Image
                src="/logo/admit55_final_logo.webp"
                alt="Admit55"
                width={32}
                height={32}
                className="w-8 h-8 object-contain relative z-10"
              />
            </div>
            <div className="text-base font-bold bg-gradient-to-r from-teal-900 to-cyan-900 bg-clip-text text-transparent">
              Applicant Archetype
            </div>
          </div>

          {applicantArchetypeTitle?.trim() && (
            <div className="mt-4 text-lg font-bold text-slate-900">
              {applicantArchetypeTitle}
            </div>
          )}

          {applicantArchetypeSubtitle?.trim() && (
            <div className="mt-2 text-sm font-medium text-slate-700">
              {applicantArchetypeSubtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}