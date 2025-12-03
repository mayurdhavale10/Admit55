"use client";

import { useState } from "react";
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
  // default: middle card selected
  const [mode, setMode] = useState<BschoolMatchMode>("resume-upload");

  const [result, setResult] = useState<BschoolMatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleRunMatch = async ({ answers, resumeFile }: MatchPayload) => {
    console.log("[BschoolMatch] submit payload", { mode, answers, resumeFile });

    setError(null);
    setIsLoading(true);
    setHasSubmitted(true);

    try {
      // --- NEW: try to read resume text on client (if provided) ---
      let resumeText: string | null = null;

      if (resumeFile) {
        try {
          const raw = await resumeFile.text();
          // Hard cap so we don't send crazy-large payloads to LLM
          const MAX_CHARS = 50000;
          resumeText = raw.slice(0, MAX_CHARS);
          console.log(
            "[BschoolMatch] Read resume text from file, length=",
            resumeText.length
          );
        } catch (fileErr) {
          console.error("[BschoolMatch] Failed to read resume file:", fileErr);
          // We silently fall back to answers-only if file read fails
          resumeText = null;
        }
      }

      // Build final request: answers + optional resume text
      const request = buildBschoolMatchRequestFromAnswers(answers, {
        mode,
        name: undefined,
        email: undefined,
        resumeText,          // ⬅️ now actually sending resume text
        resumeSummary: null, // can be wired later from profiler
        resumeAnalysis: null,
        profileResumeReport: undefined,
      });

      const response = await callBschoolMatch(request);
      setResult(response);
    } catch (err: unknown) {
      console.error("[BschoolMatch] failed:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to run B-School Match. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: BschoolMatchMode) => {
    setMode(newMode);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HERO SECTION */}
      <section className="w-full border-b border-slate-200 bg-gradient-to-b from-slate-800 to-blue-900 text-white">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-28 md:px-6 lg:px-10">
          <div className="flex flex-col items-center text-center">
            <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100">
              B-School Match • Admit55
            </p>

            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
              Find Your Perfect B-School Match
            </h1>

            <p className="mt-4 mb-10 max-w-3xl text-blue-100 text-lg md:text-xl leading-relaxed">
              Get an AI-curated, human-verified analysis of your MBA profile and
              discover schools that truly fit your goals. Upload your résumé and
              answer a few quick questions to begin.
            </p>
          </div>

          {/* Mode card */}
          <div className="mt-10 flex justify-center">
            <div
              className="
                w-full max-w-4xl
                rounded-2xl
                border border-white/25 
                bg-white/10 
                backdrop-blur-md
                shadow-[0_18px_45px_rgba(15,23,42,0.45)]
                px-4 py-4
                md:px-6 md:py-6
              "
            >
              <p className="text-lg md:text-xl font-semibold text-white">
                How would you like to start?
              </p>

              <div className="mt-5">
                <ModeSelector mode={mode} onChange={handleModeChange} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT – ONE COLUMN FLOW */}
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-10 md:px-6 lg:px-10">
        {/* Form – always visible */}
        <MatchForm
          mode={mode}
          isSubmitting={isLoading}
          onSubmit={handleRunMatch}
        />

        {/* Results – only after submit / while loading / error */}
        {(hasSubmitted || isLoading || error || result) && (
          <div className="mt-8">
            <MatchResults
              result={result}
              isLoading={isLoading}
              error={error}
              onRetry={() => setError(null)}
            />
          </div>
        )}
      </section>
    </main>
  );
}
