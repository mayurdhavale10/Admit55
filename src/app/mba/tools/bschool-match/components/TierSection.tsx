"use client";

import React from "react";

// Mock school card for preview (replace with your BSchoolCard.tsx)
function SchoolCardPreview({ school }: { school: any }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="font-semibold text-slate-900">{school.school_name}</h4>
        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
          {school.overall_match_score}% match
        </span>
      </div>
      <p className="text-xs text-slate-600">{school.program_name}</p>
      <p className="text-xs text-slate-500 mt-1">{school.region}</p>
    </div>
  );
}

interface TierSectionProps {
  tier: "Ambitious" | "Target" | "Safe";
  schools: any[];
  probability?: string;
}

const TIER_CONFIG = {
  Ambitious: {
    color: "emerald",
    icon: "🚀",
    gradient: "from-emerald-50 to-green-50/50",
    border: "border-emerald-200/60",
    badgeBg: "bg-emerald-600",
    textColor: "text-emerald-900",
    description: "Reach for these top programs"
  },
  Target: {
    color: "sky",
    icon: "🎯",
    gradient: "from-sky-50 to-cyan-50/50",
    border: "border-sky-200/60",
    badgeBg: "bg-sky-600",
    textColor: "text-sky-900",
    description: "Best fit schools where you're competitive"
  },
  Safe: {
    color: "amber",
    icon: "✅",
    gradient: "from-amber-50 to-orange-50/50",
    border: "border-amber-200/60",
    badgeBg: "bg-amber-600",
    textColor: "text-amber-900",
    description: "Strong programs where you're above median"
  }
};

export default function TierSection({ tier, schools, probability }: TierSectionProps) {
  const config = TIER_CONFIG[tier];
  
  // Mock schools for preview
  const displaySchools = schools?.length ? schools : [
    { school_name: `${tier} School 1`, program_name: "MBA Program", region: "US", overall_match_score: 75 },
    { school_name: `${tier} School 2`, program_name: "MBA Program", region: "US", overall_match_score: 72 },
    { school_name: `${tier} School 3`, program_name: "MBA Program", region: "US", overall_match_score: 70 }
  ];

  if (!displaySchools.length) return null;

  return (
    <section className="mb-8">
      {/* Tier Header */}
      <div className={`rounded-3xl bg-gradient-to-br ${config.gradient} border ${config.border} p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${config.badgeBg} flex items-center justify-center text-2xl shadow-md`}>
              {config.icon}
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${config.textColor} tracking-tight`}>
                {tier}
              </h3>
              {probability && (
                <p className="text-sm text-slate-600 mt-0.5">
                  {probability} admit probability
                </p>
              )}
            </div>
          </div>
          
          {/* School count badge */}
          <div className={`px-4 py-2 rounded-full ${config.badgeBg} text-white text-sm font-bold shadow-sm`}>
            {displaySchools.length} {displaySchools.length === 1 ? 'school' : 'schools'}
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          {config.description}
        </p>
      </div>

      {/* Schools Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displaySchools.map((school, idx) => (
          <SchoolCardPreview key={idx} school={school} />
        ))}
      </div>

      {/* Divider line */}
      <div className="mt-8 border-t border-slate-200"></div>
    </section>
  );
}