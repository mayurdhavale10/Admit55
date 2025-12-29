"use client";

import React from "react";
import TierSection from "./TierSection";

interface TieredMatchesProps {
  schools?: {
    ambitious?: any[];
    target?: any[];
    safe?: any[];
  };
}

export default function TieredMatches({ schools }: TieredMatchesProps) {
  // Mock data for preview
  const ambitious = schools?.ambitious?.length ? schools.ambitious : [
    { school_name: "Harvard Business School", program_name: "MBA", region: "US - East Coast", overall_match_score: 78 },
    { school_name: "Stanford GSB", program_name: "MBA", region: "US - West Coast", overall_match_score: 75 },
    { school_name: "Wharton", program_name: "MBA", region: "US - East Coast", overall_match_score: 76 }
  ];

  const target = schools?.target?.length ? schools.target : [
    { school_name: "Kellogg", program_name: "MBA", region: "US - Midwest", overall_match_score: 82 },
    { school_name: "Ross", program_name: "MBA", region: "US - Midwest", overall_match_score: 81 },
    { school_name: "Fuqua", program_name: "MBA", region: "US - South", overall_match_score: 80 },
    { school_name: "Yale SOM", program_name: "MBA", region: "US - East Coast", overall_match_score: 79 }
  ];

  const safe = schools?.safe?.length ? schools.safe : [
    { school_name: "Tepper", program_name: "MBA", region: "US - Midwest", overall_match_score: 88 },
    { school_name: "Foster", program_name: "MBA", region: "US - West Coast", overall_match_score: 87 },
    { school_name: "McCombs", program_name: "MBA", region: "US - South", overall_match_score: 86 }
  ];

  const totalSchools = ambitious.length + target.length + safe.length;

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl border border-slate-100">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <img 
            src="/logo/admit55_final_logo.webp"
            alt="Admit55"
            className="w-10 h-10 object-contain"
          />
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Your School Matches
          </h2>
        </div>
        <p className="text-slate-600 leading-relaxed">
          We've identified <span className="font-bold text-slate-900">{totalSchools} schools</span> across 3 tiers based on your profile, goals, and admissions probability.
        </p>
      </div>

      {/* Premium info card */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50/50 border border-sky-200/60 p-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sky-900 mb-2">How We Tier Schools</h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              <span className="font-semibold">Ambitious</span> = reach schools where your stats are below median · 
              <span className="font-semibold"> Target</span> = competitive schools where you fit well · 
              <span className="font-semibold"> Safe</span> = strong programs where you're above median
            </p>
          </div>
        </div>
      </div>

      {/* Tiers */}
      <div className="space-y-0">
        {ambitious.length > 0 && (
          <TierSection 
            tier="Ambitious" 
            schools={ambitious} 
            probability="15-30%" 
          />
        )}

        {target.length > 0 && (
          <TierSection 
            tier="Target" 
            schools={target} 
            probability="40-60%" 
          />
        )}

        {safe.length > 0 && (
          <TierSection 
            tier="Safe" 
            schools={safe} 
            probability="70%+" 
          />
        )}
      </div>

      {/* Bottom note */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <p className="text-xs text-slate-500 italic flex items-center gap-2">
          <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Apply to 6-8 schools across all three tiers for optimal results
        </p>
      </div>
    </div>
  );
}