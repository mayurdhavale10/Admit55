"use client";

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
  if (a >= 6.5) return { label: "Strong Base", tone: "base" as const };
  return { label: "Needs Focus", tone: "focus" as const };
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "strong" | "base" | "focus" | "neutral" | "grounded" | "warn";
}) {
  const styles =
    tone === "strong"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "base"
      ? "border-sky-200 bg-sky-50 text-sky-800"
      : tone === "focus"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "grounded"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warn"
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
  totalScore,
  summary,
  highlights,
  applicantArchetypeTitle,
  applicantArchetypeSubtitle,
  verification,
}: Props) {
  const ok = verification?.ok ?? true;
  const pill = profilePill(averageScore);

  const chips =
    Array.isArray(highlights) && highlights.length > 0
      ? highlights.filter(Boolean).slice(0, 18)
      : [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      {/* Top Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={pill.tone}>{pill.label}</Pill>

          <Pill tone={ok ? "grounded" : "warn"}>
            <span className="text-base leading-none">{ok ? "✅" : "⚠️"}</span>
            {ok ? "Grounded" : "May be generic"}
          </Pill>
        </div>

        {/* Score box (top-right) */}
        <div className="sm:text-right">
          <div className="text-sm text-slate-500">Overall score</div>
          <div className="mt-1 flex items-end gap-2 sm:justify-end">
            <div className="text-4xl font-extrabold tracking-tight text-slate-900">
              {typeof averageScore === "number" ? averageScore.toFixed(1) : "—"}
            </div>
            <div className="pb-1 text-sm font-semibold text-slate-500">/ 10</div>
          </div>

          {typeof totalScore === "number" && (
            <div className="mt-1 text-sm text-slate-500">
              Total: {totalScore.toFixed(1)}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mt-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Your MBA Profile Analysis
        </h1>
        {candidateName?.trim() ? (
          <p className="mt-2 text-sm text-slate-500">
            Candidate: <span className="font-semibold text-slate-700">{candidateName}</span>
          </p>
        ) : null}
      </div>

      {/* Highlight chips */}
      {chips.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
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
        <p className="mt-5 text-base leading-relaxed text-slate-700">
          {summary}
        </p>
      ) : null}

      {/* Applicant Archetype */}
      {(applicantArchetypeTitle?.trim() || applicantArchetypeSubtitle?.trim()) && (
        <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <div className="flex items-center gap-2 text-teal-900">
            <span className="text-lg">🎯</span>
            <div className="text-base font-semibold">Applicant Archetype</div>
          </div>

          {applicantArchetypeTitle?.trim() && (
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {applicantArchetypeTitle}
            </div>
          )}

          {applicantArchetypeSubtitle?.trim() && (
            <div className="mt-1 text-sm text-slate-700">
              {applicantArchetypeSubtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}