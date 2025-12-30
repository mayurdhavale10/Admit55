"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import {
  BschoolMatchMode,
  BschoolMatchResponse,
  QuestionAnswerMap,
} from "@src/lib/bschoolmatch/types";
import { callBschoolMatch } from "@src/lib/bschoolmatch/client";
import { buildBschoolMatchRequestFromAnswers } from "@src/lib/bschoolmatch/mappers";

import MatchForm from "./components/MatchForm";
import MatchResults from "./components/MatchResults";
import ModeSelector from "./components/ModeSelector";

type MatchPayload = {
  answers: QuestionAnswerMap;
  resumeFile: File | null;
};

export default function BschoolMatchPage() {
  const [mode, setMode] = useState<BschoolMatchMode>("resume-upload");
  const [hasStarted, setHasStarted] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  const [result, setResult] = useState<BschoolMatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleRunMatch = async ({ answers, resumeFile }: MatchPayload) => {
    setError(null);
    setIsLoading(true);

    try {
      let resumeText: string | null = null;

      if (resumeFile) {
        try {
          const raw = await resumeFile.text();
          resumeText = raw.slice(0, 50_000);
        } catch {
          resumeText = null;
        }
      }

      const request = buildBschoolMatchRequestFromAnswers(answers, {
        mode,
        name: undefined,
        email: undefined,
        resumeText,
        resumeSummary: null,
        resumeAnalysis: null,
        profileResumeReport: undefined,
      });

      const response = await callBschoolMatch(request);
      setResult(response);
      
      // Hide form after successful submission
      setHasStarted(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to run B-School Match.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: BschoolMatchMode) => {
    setMode(newMode);
    setHasStarted(true);
    setTimeout(scrollToForm, 120);

    // Reset results when changing mode
    setResult(null);
    setError(null);
  };

  const handleStartOver = () => {
    setResult(null);
    setError(null);
    setHasStarted(false);
    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Show results, hide everything else
  const showResults = result && !isLoading;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO - Hide when showing results */}
      {!showResults && (
        <section className="w-full border-b border-slate-200 bg-gradient-to-b from-slate-800 to-blue-900 text-white">
          <div className="mx-auto max-w-6xl px-4 pb-14 pt-28 md:px-6 lg:px-10">
            <div className="flex flex-col items-center text-center">
              <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100">
                B-School Match • Admit55
              </p>

              <h1 className="mt-6 flex items-center justify-center gap-3 text-4xl font-bold tracking-tight md:text-6xl">
                <Image
                  src="/logo/admit55_final_logo.webp"
                  alt="Admit55"
                  width={96}
                  height={96}
                  priority
                  className="h-16 w-16 md:h-24 md:w-24"
                />
                Find Your Perfect B-School Match
              </h1>

              <p className="mt-4 mb-10 max-w-3xl text-blue-100 text-lg md:text-xl leading-relaxed">
                Upload your résumé and answer a few quick questions to begin.
              </p>
            </div>

            {/* MODE CARD */}
            <div className="mt-10 flex justify-center">
              <div className="w-full max-w-4xl rounded-2xl border border-white/25 bg-white/10 backdrop-blur-md shadow-[0_18px_45px_rgba(15,23,42,0.45)] px-4 py-4 md:px-6 md:py-6">
                <p className="text-lg md:text-xl font-semibold text-white">
                  How would you like to start?
                </p>

                <div className="mt-5">
                  <ModeSelector mode={mode} onChange={handleModeChange} />
                </div>

                {!hasStarted && (
                  <p className="mt-4 text-sm text-blue-100/80">
                    Select an option to begin — we'll take you to the form.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FORM - Only show if started and no results */}
      {hasStarted && !showResults && (
        <section className="mx-auto max-w-4xl px-4 pb-16 pt-10 md:px-6 lg:px-10">
          <div ref={formRef}>
            <MatchForm mode={mode} isSubmitting={isLoading} onSubmit={handleRunMatch} />
          </div>
        </section>
      )}

      {/* LOADING STATE */}
      {isLoading && (
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:px-6 lg:px-10">
          <div className="rounded-3xl bg-white p-8 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="/logo/admit55_final_logo.webp"
                alt="Admit55"
                className="w-10 h-10 object-contain"
                width={40}
                height={40}
              />
              <h2 className="text-2xl font-bold text-slate-900">Analyzing Your Profile...</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-3 border-sky-600 border-t-transparent animate-spin" />
                <p className="text-sm text-slate-600">Extracting your profile data...</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
                <p className="text-sm text-slate-600">Matching 50+ business schools...</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-3 border-amber-600 border-t-transparent animate-spin" />
                <p className="text-sm text-slate-600">Generating fit analysis and strategy...</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ERROR STATE */}
      {error && !isLoading && (
        <section className="mx-auto max-w-4xl px-4 pb-16 pt-10 md:px-6 lg:px-10">
          <div className="rounded-3xl bg-red-50 border border-red-200 p-8">
            <h3 className="text-xl font-bold text-red-900 mb-2">Analysis Failed</h3>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={handleStartOver}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </section>
      )}

      {/* RESULTS - Full width, no containers */}
      {showResults && (
        <section className="w-full px-4 pb-16 pt-10 md:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <MatchResults
              result={result}
              isLoading={false}
              error={null}
              onRetry={handleStartOver}
            />
          </div>
        </section>
      )}
    </main>
  );
}