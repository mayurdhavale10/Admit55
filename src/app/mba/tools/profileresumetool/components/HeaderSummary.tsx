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
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "base"
      ? "border-sky-200 bg-sky-50 text-sky-800"
      : tone === "focus"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
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

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      {/* Top Row */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={pill.tone}>{pill.label}</Pill>
        </div>

        {/* Score box (top-right) */}
        <div className="flex items-center gap-3 sm:text-right">
          <Image
            src="/logo/admit55_final_logo.webp"
            alt="Admit55"
            width={50}
            height={50}
            className="w-12 h-12 object-contain"
          />
          <div>
            <div className="text-sm text-slate-500 mb-1">Overall Score</div>
            <div className="text-4xl font-extrabold tracking-tight text-slate-900">
              {typeof averageScore === "number" ? averageScore.toFixed(1) : "—"}
              <span className="text-xl font-semibold text-slate-500 ml-1">/ 10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Title with Logo */}
      <div className="mt-8 flex items-center gap-3">
        <Image
          src="/logo/admit55_final_logo.webp"
          alt="Admit55"
          width={40}
          height={40}
          className="w-10 h-10 object-contain"
        />
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Your MBA Profile Analysis
          </h1>
          {candidateName?.trim() ? (
            <p className="mt-1 text-sm text-slate-500">
              Candidate: <span className="font-semibold text-slate-700">{candidateName}</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* Highlight chips */}
      {chips.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {chips.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Summary */}
      {summary?.trim() ? (
        <p className="mt-6 text-base leading-relaxed text-slate-700">
          {summary}
        </p>
      ) : null}

      {/* Applicant Archetype */}
      {(applicantArchetypeTitle?.trim() || applicantArchetypeSubtitle?.trim()) && (
        <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-6">
          <div className="flex items-center gap-3 text-teal-900">
            <Image
              src="/logo/admit55_final_logo.webp"
              alt="Admit55"
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
            />
            <div className="text-base font-semibold">Applicant Archetype</div>
          </div>

          {applicantArchetypeTitle?.trim() && (
            <div className="mt-3 text-lg font-semibold text-slate-900">
              {applicantArchetypeTitle}
            </div>
          )}

          {applicantArchetypeSubtitle?.trim() && (
            <div className="mt-1.5 text-sm text-slate-700">
              {applicantArchetypeSubtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}