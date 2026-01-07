// src/app/mba/tools/bschool-match/BschoolMatchClient.tsx
"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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

function extractStatus(err: unknown): number | undefined {
  const e: any = err;
  return (
    e?.status ??
    e?.response?.status ??
    e?.cause?.status ??
    (typeof e?.message === "string" &&
    e.message.match(/\b(402|403|429)\b/)?.[1]
      ? Number(e.message.match(/\b(402|403|429)\b/)?.[1])
      : undefined)
  );
}

export default function BschoolMatchClient() {
  const router = useRouter();
  const pathname = usePathname();

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
          resumeText = (await resumeFile.text()).slice(0, 50_000);
        } catch {
          resumeText = null;
        }
      }

      const request = buildBschoolMatchRequestFromAnswers(answers, {
        mode,
        resumeText,
      });

      const response = await callBschoolMatch(request);
      setResult(response);
      setHasStarted(false);
    } catch (err) {
      const status = extractStatus(err);

      if (status === 402 || status === 403 || status === 429) {
        router.push(
          `/upgradetopro?reason=quota&from=${encodeURIComponent(pathname)}`
        );
        return;
      }

      setError("Failed to run B-School Match.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: BschoolMatchMode) => {
    setMode(newMode);
    setHasStarted(true);
    setTimeout(scrollToForm, 120);
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

  const showResults = result && !isLoading;

  return (
    <main className="min-h-screen bg-slate-50">
      {!showResults && (
        <section className="w-full border-b border-slate-200 bg-gradient-to-b from-slate-800 to-blue-900 text-white">
          <div className="mx-auto max-w-6xl px-4 pb-14 pt-24">
            <div className="text-center">
              <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
                B-School Match · Admit55
              </p>

              <h1 className="mt-6 flex justify-center gap-3 text-4xl md:text-6xl font-bold">
                <Image
                  src="/logo/admit55_final_logo.webp"
                  alt="Admit55"
                  width={96}
                  height={96}
                  className="h-16 w-16 md:h-24 md:w-24"
                />
                Find Your Perfect B-School Match
              </h1>

              <p className="mt-4 text-blue-100 text-lg">
                Upload your résumé and answer a few quick questions to begin.
              </p>
            </div>

            <div className="mt-10 max-w-4xl mx-auto rounded-2xl bg-white/10 p-6">
              <p className="text-lg font-semibold text-white">
                How would you like to start?
              </p>

              <div className="mt-5">
                <ModeSelector mode={mode} onChange={handleModeChange} />
              </div>
            </div>
          </div>
        </section>
      )}

      {hasStarted && !showResults && (
        <section className="mx-auto max-w-4xl px-4 py-12">
          <div ref={formRef}>
            <MatchForm
              mode={mode}
              isSubmitting={isLoading}
              onSubmit={handleRunMatch}
            />
          </div>
        </section>
      )}

      {isLoading && (
        <section className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-2xl font-bold">Analyzing your profile…</h2>
          </div>
        </section>
      )}

      {error && (
        <section className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-2xl bg-red-50 p-6 text-red-800">
            {error}
          </div>
        </section>
      )}

      {showResults && (
        <section className="px-4 py-12">
          <MatchResults
            result={result}
            isLoading={false}
            error={null}
            onRetry={handleStartOver}
          />
        </section>
      )}
    </main>
  );
}
