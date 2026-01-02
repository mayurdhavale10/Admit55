// src/app/mba/tools/bschool-match/page.tsx
"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
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
    (typeof e?.message === "string" && e.message.match(/\b(401|402|403|429)\b/)?.[1]
      ? Number(e.message.match(/\b(401|402|403|429)\b/)?.[1])
      : undefined)
  );
}

export default function BschoolMatchPage() {
  const router = useRouter();
  const pathname = usePathname();

  const { data: session, status: authStatus } = useSession();
  const isAuthed = Boolean(session?.user?.email);
  const authLoading = authStatus === "loading";

  const [mode, setMode] = useState<BschoolMatchMode>("resume-upload");
  const [hasStarted, setHasStarted] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  const [result, setResult] = useState<BschoolMatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const requireLogin = async () => {
    await signIn("google", { callbackUrl: pathname || "/mba/tools/bschool-match" });
  };

  const handleRunMatch = async ({ answers, resumeFile }: MatchPayload) => {
    setError(null);

    if (!isAuthed) {
      await requireLogin();
      return;
    }

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
        email: session?.user?.email ?? undefined,
        resumeText,
        resumeSummary: null,
        resumeAnalysis: null,
        profileResumeReport: undefined,
      });

      const response = await callBschoolMatch(request);
      setResult(response);
      setHasStarted(false);
    } catch (err: unknown) {
      const status = extractStatus(err);

      if (status === 401) {
        await requireLogin();
        return;
      }

      if (status === 402 || status === 403 || status === 429) {
        router.push(
          `/upgradetopro?reason=quota&from=${encodeURIComponent(pathname || "")}`
        );
        return;
      }

      setError(err instanceof Error ? err.message : "Failed to run B-School Match.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = async (newMode: BschoolMatchMode) => {
    setMode(newMode);

    if (!isAuthed) {
      setHasStarted(false);
      setResult(null);
      setError("Please sign in to start.");
      await requireLogin();
      return;
    }

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
        <div className="w-full border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 md:px-6 lg:px-10 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {authLoading ? (
                "Checking login…"
              ) : isAuthed ? (
                <>
                  Signed in as{" "}
                  <span className="font-semibold">{session?.user?.email}</span>
                </>
              ) : (
                "You must sign in to use B-School Match."
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isAuthed && !authLoading && (
                <button
                  onClick={requireLogin}
                  className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
                >
                  Sign in
                </button>
              )}
              <button
                onClick={() => router.push("/upgradetopro")}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {!showResults && (
        <section className="w-full border-b border-slate-200 bg-gradient-to-b from-slate-800 to-blue-900 text-white">
          <div className="mx-auto max-w-6xl px-4 pb-14 pt-20 md:px-6 lg:px-10">
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

              {!authLoading && !isAuthed && (
                <div className="mt-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-blue-100">
                  🔒 Sign in required to run analysis (free users get limited runs).
                </div>
              )}
            </div>

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

      {hasStarted && !showResults && (
        <section className="mx-auto max-w-4xl px-4 pb-16 pt-10 md:px-6 lg:px-10">
          <div ref={formRef}>
            <MatchForm mode={mode} isSubmitting={isLoading} onSubmit={handleRunMatch} />
          </div>
        </section>
      )}

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
              <h2 className="text-2xl font-bold text-slate-900">
                Analyzing Your Profile...
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-[3px] border-sky-600 border-t-transparent animate-spin" />
                <p className="text-sm text-slate-600">Extracting your profile data...</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-[3px] border-emerald-600 border-t-transparent animate-spin" />
                <p className="text-sm text-slate-600">Matching 50+ business schools...</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-[3px] border-amber-600 border-t-transparent animate-spin" />
                <p className="text-sm text-slate-600">Generating fit analysis and strategy...</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {error && !isLoading && (
        <section className="mx-auto max-w-4xl px-4 pb-16 pt-10 md:px-6 lg:px-10">
          <div className="rounded-3xl bg-red-50 border border-red-200 p-8">
            <h3 className="text-xl font-bold text-red-900 mb-2">Analysis Failed</h3>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={handleStartOver}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/upgradetopro")}
                className="px-4 py-2 bg-white text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Upgrade
              </button>
            </div>
          </div>
        </section>
      )}

      {showResults && (
        <section className="w-full px-4 pb-16 pt-10 md:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <MatchResults result={result} isLoading={false} error={null} onRetry={handleStartOver} />
          </div>
        </section>
      )}
    </main>
  );
}
