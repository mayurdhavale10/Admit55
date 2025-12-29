"use client";

import KeyInsightsList from "./KeyInsightsList";
import TieredMatches from "./TieredMatches";
import FitStoryStrength from "./FitStoryStrength";
import ApplicationStrategy from "./ApplicationStrategy";
import ActionPlanTimeline from "./ActionPlanTimeline";
import CTASection from "./CTASection";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";

interface MatchResultsProps {
  result?: any;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function MatchResults({ 
  result, 
  isLoading, 
  error, 
  onRetry 
}: MatchResultsProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-xl border border-slate-100">
        <LoadingState />
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border-3 border-sky-600 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-600">Analyzing your profile...</p>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-slate-600">Matching 50+ schools...</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border-3 border-amber-600 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-600">Generating fit analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  // Empty state
  if (!result) {
    return <EmptyState />;
  }

  // Extract data from result
  const keyInsights = result?.key_insights || result?.insights || [];
  
  const schools = {
    ambitious: result?.schools_by_tier?.ambitious || result?.ambitious || [],
    target: result?.schools_by_tier?.target || result?.target || [],
    safe: result?.schools_by_tier?.safe || result?.safe || []
  };

  const fitStory = {
    strengths: result?.fit_story?.strengths || result?.strengths || [],
    concerns: result?.fit_story?.concerns || result?.concerns || [],
    improvements: result?.fit_story?.improvements || result?.fixes || []
  };

  const strategy = result?.strategy || {};
  
  const timeline = result?.action_plan || result?.timeline || {};

  // Download handler
  const handleDownload = async () => {
    try {
      const res = await fetch("/api/mba/bschool-match/report-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: result })
      });

      if (!res.ok) {
        alert("Failed to generate PDF report.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bschool_match_report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
      alert("Could not generate report for download.");
    }
  };

  const handleBookSession = () => {
    alert("Booking flow will be added - redirecting to calendar...");
  };

  const handleStartOver = () => {
    window.location.href = "/mba/tools/bschool-match";
  };

  return (
    <div className="space-y-8">
      {/* 1. Key Insights */}
      {keyInsights.length > 0 && (
        <KeyInsightsList insights={keyInsights} />
      )}

      {/* 2. Tiered School Matches */}
      <TieredMatches schools={schools} />

      {/* 3. Fit Story Analysis */}
      <FitStoryStrength 
        strengths={fitStory.strengths}
        concerns={fitStory.concerns}
        improvements={fitStory.improvements}
      />

      {/* 4. Application Strategy */}
      <ApplicationStrategy strategy={strategy} />

      {/* 5. Action Plan Timeline */}
      <ActionPlanTimeline timeline={timeline} />

      {/* 6. CTA Section */}
      <CTASection 
        onDownload={handleDownload}
        onBookSession={handleBookSession}
        onStartOver={handleStartOver}
      />

      {/* Meta info footer */}
      {result?.processing_meta && (
        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-100">
          <p>
            Generated using {result.processing_meta.model || "AI"} • 
            {result.processing_meta.total_duration_seconds 
              ? ` Processed in ${result.processing_meta.total_duration_seconds}s`
              : ""
            }
          </p>
          {result?.generated_at && (
            <p className="mt-1">
              {new Date(result.generated_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}