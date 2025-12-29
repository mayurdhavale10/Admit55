"use client";

import { useState } from "react";

interface CTASectionProps {
  onDownload?: () => void;
  onBookSession?: () => void;
  onStartOver?: () => void;
}

export default function CTASection({ 
  onDownload, 
  onBookSession, 
  onStartOver 
}: CTASectionProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (onDownload) {
        await onDownload();
      } else {
        // Default behavior
        alert("PDF download will be implemented");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBookSession = () => {
    if (onBookSession) {
      onBookSession();
    } else {
      alert("Booking flow will be added");
    }
  };

  const handleStartOver = () => {
    if (onStartOver) {
      onStartOver();
    } else {
      window.location.href = "/mba/tools/bschool-match";
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-sky-900 p-8 shadow-2xl border border-white/10">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
          Ready to Take the Next Step?
        </h3>
        <p className="text-sky-100 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
          Download your personalized report, book a strategy session with an MBA consultant, or explore different scenarios.
        </p>
      </div>

      {/* CTA Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        {/* Download Report */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="group rounded-2xl bg-white/95 backdrop-blur-sm p-6 text-left hover:bg-white hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
              {isDownloading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-slate-900 mb-1">
                Download Report
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Get a comprehensive PDF with all insights, school matches, and action plan
              </p>
            </div>
          </div>
        </button>

        {/* Book Session */}
        <button
          onClick={handleBookSession}
          className="group rounded-2xl bg-white/95 backdrop-blur-sm p-6 text-left hover:bg-white hover:scale-105 transition-all duration-200 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-green-500 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-slate-900 mb-1">
                Book Strategy Session
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Get personalized guidance from an MBA consultant to refine your strategy
              </p>
            </div>
          </div>
        </button>

        {/* Start Over */}
        <button
          onClick={handleStartOver}
          className="group rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 p-6 text-left hover:bg-white/20 hover:border-white/40 transition-all duration-200"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-white mb-1">
                Start New Match
              </h4>
              <p className="text-xs text-sky-100 leading-relaxed">
                Try different profile scenarios or update your information
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Bottom info */}
      <div className="text-center">
        <p className="text-xs text-sky-200 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Your data is secure and confidential. We never share your information.
        </p>
      </div>
    </div>
  );
}