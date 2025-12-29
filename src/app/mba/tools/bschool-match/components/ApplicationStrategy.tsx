"use client";

interface ApplicationStrategyProps {
  strategy?: {
    portfolio?: string[];
    essayTheme?: string;
    focusAreas?: string[];
    timeline?: string;
  };
}

export default function ApplicationStrategy({ strategy }: ApplicationStrategyProps) {
  // Mock data for preview
  const portfolio = strategy?.portfolio?.length ? strategy.portfolio : [
    "2 Ambitious (Harvard, Booth)",
    "4 Target (Kellogg, Ross, Fuqua, Yale)",
    "2 Safe (Tepper, Foster)"
  ];

  const essayTheme = strategy?.essayTheme || 
    "Tech PM who wants to scale impact through strategy consulting";

  const focusAreas = strategy?.focusAreas?.length ? strategy.focusAreas : [
    "Your product launches and measurable impact",
    "Team leadership across geographies",
    "Non-profit board role (differentiator for tech PMs)",
    "Specific consulting firms and practice areas of interest"
  ];

  const timeline = strategy?.timeline || 
    "R1 Deadline: Sept 15 (6 months away) • Retake GMAT by June • Start essays in July";

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-shadow duration-300">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <img 
            src="/logo/admit55_final_logo.webp"
            alt="Admit55"
            className="w-10 h-10 object-contain"
          />
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            Your Application Strategy
          </h3>
        </div>
        <p className="text-slate-600 leading-relaxed">
          Recommended approach to maximize your admission chances
        </p>
      </div>

      <div className="space-y-6">
        {/* School Portfolio */}
        <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50/50 border border-sky-200/60 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-sky-900">Recommended School Portfolio</h4>
          </div>
          <p className="text-sm text-slate-600 mb-3">Apply to 6-8 schools across all tiers:</p>
          <ul className="space-y-2">
            {portfolio.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-slate-700">
                <span className="text-sky-600 font-bold mt-0.5">•</span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Essay Theme */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50/50 border border-emerald-200/60 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-emerald-900">Essay Theme</h4>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed bg-white/60 rounded-lg p-4 border border-emerald-100">
            "{essayTheme}"
          </p>
        </div>

        {/* Focus Areas */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-amber-900">What to Highlight in Applications</h4>
          </div>
          <ul className="space-y-2">
            {focusAreas.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-slate-700">
                <span className="text-amber-600 font-bold mt-0.5">•</span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-slate-600 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-slate-900">Key Timeline</h4>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {timeline}
          </p>
        </div>
      </div>

      {/* Bottom tip */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="flex gap-3 items-start bg-sky-50/50 rounded-xl p-4 border border-sky-100">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed flex-1">
            <span className="font-semibold text-slate-900">Strategy tip:</span> Balance your portfolio with 2-4-2 distribution (Ambitious-Target-Safe). This maximizes admit chances while keeping options open for negotiations.
          </p>
        </div>
      </div>
    </div>
  );
}