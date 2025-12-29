"use client";

interface KeyInsightsListProps {
  insights?: string[];
}

export default function KeyInsightsList({ insights }: KeyInsightsListProps) {
  // Fallback mock data for preview
  const displayInsights = insights?.length 
    ? insights 
    : [
        "Your tech background + 720 GMAT make you competitive at top 15 programs",
        "Focus on schools with strong consulting placement (Kellogg, Fuqua, Ross)",
        "Indian male tech → consulting is common; you need a strong differentiation story",
        "Consider retaking GMAT (target 740+) to strengthen ambitious tier applications"
      ];

  if (!displayInsights.length) return null;

  return (
    <div className="rounded-3xl bg-white p-6 md:p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <img 
          src="/logo/admit55_final_logo.webp"
          alt="Admit55"
          className="w-10 h-10 object-contain"
        />
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Key Insights</h3>
      </div>

      {/* Insights Grid */}
      <div className="space-y-4">
        {displayInsights.map((insight, idx) => (
          <div 
            key={idx}
            className="rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50/40 border border-sky-200/60 p-5 hover:border-sky-300 transition-all duration-200 group"
          >
            <div className="flex gap-4">
              {/* Number badge */}
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm group-hover:bg-sky-700 transition-colors">
                {idx + 1}
              </div>

              {/* Insight text */}
              <p className="flex-1 text-sm text-slate-800 leading-relaxed pt-1">
                {insight}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Optional footer note */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500 italic flex items-center gap-2">
          <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Based on your profile analysis and school admission patterns
        </p>
      </div>
    </div>
  );
}