import { BschoolMatchResponse, toDisplaySchool, mapTierForDisplay } from "@src/lib/bschoolmatch/types";
import BSchoolCard from "./BSchoolCard";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import LoadingState from "./LoadingState";

interface MatchResultsProps {
  result: BschoolMatchResponse | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export default function MatchResults({
  result,
  isLoading,
  error,
  onRetry,
}: MatchResultsProps) {
  const hasResults = !!result;

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!hasResults || !result) {
    return <EmptyState />;
  }

  const { summary, matches } = result;

  // ✅ FIX: Convert backend matches to display format BEFORE filtering
  const displayMatches = matches.map(toDisplaySchool);

  return (
    <div className="space-y-5">
      {/* Summary card */}
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Overall Match Summary
          </p>
          {summary.risk_profile && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
              Risk profile:&nbsp;
              <span className="capitalize">{summary.risk_profile}</span>
            </span>
          )}
        </div>

        <h2 className="mt-2 text-lg font-semibold text-slate-900">
          {summary.headline || summary.profile_snapshot}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {summary.narrative || summary.target_strategy}
        </p>

        {(summary.key_drivers || summary.key_factors) && 
         (summary.key_drivers?.length || summary.key_factors?.length) ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(summary.key_drivers || summary.key_factors || []).map((driver, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[11px] text-sky-700"
              >
                {driver}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Tier columns */}
      <div className="grid gap-4 md:grid-cols-3">
        {(["ambitious", "target", "safe"] as const).map((backendTier) => {
          // ✅ FIX: Filter displayMatches (which are BschoolMatchSchoolDisplay)
          const schools = displayMatches.filter((s) => s.tier === backendTier);
          
          const displayTier = mapTierForDisplay(backendTier);
          
          const tierLabel =
            displayTier === "dream"
              ? "Dream"
              : displayTier === "competitive"
              ? "Competitive"
              : "Safe";

          const tierAccentClasses =
            displayTier === "dream"
              ? "border-pink-300 bg-pink-50 text-pink-800"
              : displayTier === "competitive"
              ? "border-sky-300 bg-sky-50 text-sky-800"
              : "border-emerald-300 bg-emerald-50 text-emerald-800";

          return (
            <div
              key={backendTier}
              className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm"
            >
              <div
                className={`inline-flex items-center justify-between gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tierAccentClasses}`}
              >
                <span>{tierLabel}</span>
                <span className="text-[10px] opacity-80">
                  {schools.length} match{schools.length === 1 ? "" : "es"}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {schools.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No strong {tierLabel.toLowerCase()} matches yet. Try
                    tweaking geography, budget or risk preference and run the
                    match again.
                  </p>
                )}

                {/* ✅ FIX: Pass BschoolMatchSchoolDisplay to BSchoolCard */}
                {schools.map((school) => (
                  <BSchoolCard key={school.id} school={school} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}