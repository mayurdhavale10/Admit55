"use client";

import React from "react";

export interface RecommendationItem {
  id?: string;
  type?: string;
  area?: string;
  priority?: "high" | "medium" | "low" | string;
  current_score?: number | null;
  action: string;
  estimated_impact?: string;
}

interface RecommendationCardProps {
  recommendations: RecommendationItem[];
}

export default function RecommendationCard({
  recommendations,
}: RecommendationCardProps) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-md w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Actionable Recommendations</h3>
      </div>

      {/* Recommendations List */}
      <div className="space-y-5">
        {recommendations.map((item, idx) => (
          <div 
            key={item.id ?? idx} 
            className="rounded-xl bg-blue-50 border-2 border-blue-100 p-5"
          >
            <div className="flex gap-4">
              {/* Number Badge */}
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white text-base font-bold shadow-sm">
                  {idx + 1}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-base text-gray-700 leading-relaxed">
                  {item.action}
                </p>
                
                {item.estimated_impact && (
                  <p className="text-sm text-blue-700 mt-2 italic font-medium">
                    💡 {item.estimated_impact}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}