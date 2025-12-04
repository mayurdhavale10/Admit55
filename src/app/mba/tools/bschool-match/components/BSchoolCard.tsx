import { BschoolMatchSchoolDisplay } from "@src/lib/bschoolmatch/types";

interface BSchoolCardProps {
  school: BschoolMatchSchoolDisplay;
}

export default function BSchoolCard({ school }: BSchoolCardProps) {
  const matchPercent = school.overall_match_score;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-sm">
      {/* Name + match pill */}
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-slate-900 line-clamp-2">
          {school.school_name}
        </p>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 whitespace-nowrap">
          {matchPercent}% match
        </span>
      </div>

      {/* Program name */}
      <p className="mt-0.5 text-[11px] text-slate-600">
        {school.program_name}
      </p>

      {/* Region + program type */}
      <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-500">
        {school.region} · {school.program_type}
      </p>

      {/* Match bar */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>Fit score</span>
          <span>{matchPercent}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-sky-500"
            style={{ width: `${Math.min(Math.max(matchPercent, 0), 100)}%` }}
          />
        </div>
      </div>

      {/* Notes / short narrative */}
      {school.notes && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-700">
          {school.notes}
        </p>
      )}

      {/* Risks */}
      {school.risks && (
        <p className="mt-1.5 text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1">
          ⚠️ {school.risks}
        </p>
      )}

      {/* Top reasons (up to 3 bullets) */}
      {school.reasons && school.reasons.length > 0 && (
        <ul className="mt-2 space-y-1 text-[11px] text-slate-700">
          {school.reasons.slice(0, 3).map((reason, idx) => (
            <li key={idx} className="flex gap-1.5">
              <span className="mt-[3px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Detailed fit scores (expandable) */}
      <details className="mt-2">
        <summary className="cursor-pointer text-[10px] text-slate-500 hover:text-slate-700">
          View detailed scores
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="text-slate-500">Academic:</span>
            <span className="ml-1 font-semibold">{school.fit_scores.academic_fit}/10</span>
          </div>
          <div>
            <span className="text-slate-500">Career:</span>
            <span className="ml-1 font-semibold">{school.fit_scores.career_outcomes_fit}/10</span>
          </div>
          <div>
            <span className="text-slate-500">Geography:</span>
            <span className="ml-1 font-semibold">{school.fit_scores.geography_fit}/10</span>
          </div>
          <div>
            <span className="text-slate-500">Prestige:</span>
            <span className="ml-1 font-semibold">{school.fit_scores.brand_prestige}/10</span>
          </div>
          <div>
            <span className="text-slate-500">ROI:</span>
            <span className="ml-1 font-semibold">{school.fit_scores.roi_affordability}/10</span>
          </div>
          <div>
            <span className="text-slate-500">Culture:</span>
            <span className="ml-1 font-semibold">{school.fit_scores.culture_personal_fit}/10</span>
          </div>
        </div>
      </details>
    </div>
  );
}