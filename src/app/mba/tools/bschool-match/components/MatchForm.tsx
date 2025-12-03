"use client";

import { FormEvent, useState, ChangeEvent } from "react";
import {
  BschoolMatchMode,
  QuestionAnswerMap,
} from "@src/lib/bschoolmatch/types";
import { BSMATCH_QUESTIONS } from "@src/lib/bschoolmatch/questionBank";
import QuestionField from "./QuestionField";

interface MatchFormProps {
  mode: BschoolMatchMode;
  isSubmitting: boolean;
  onSubmit: (payload: {
    answers: QuestionAnswerMap;
    resumeFile: File | null;
  }) => void;
}

export default function MatchForm({
  mode,
  isSubmitting,
  onSubmit,
}: MatchFormProps) {
  const [answers, setAnswers] = useState<QuestionAnswerMap>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleChange = (id: string, value: unknown) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleResumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setResumeFile(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ answers, resumeFile });
  };

  const isQuestionsMode = mode === "questions-only";
  const isResumeUploadMode = mode === "resume-upload";
  const isProfileMode = mode === "resume-from-profile";

  const headerTitle =
    mode === "questions-only"
      ? "Answer quick questions"
      : mode === "resume-upload"
      ? "Upload your résumé + answer key questions"
      : "Use saved Admit55 profile";

  const headerSubtitle =
    mode === "questions-only"
      ? "Best if you're just getting started. Takes ~2–3 minutes."
      : mode === "resume-upload"
      ? "Upload your résumé (PDF / DOC / DOCX) and answer a few key questions so we fully understand your goals and constraints."
      : "We’ll use your saved profile & résumé analysis from Admit55 to generate your B-School list.";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)] md:px-6 md:py-6"
    >
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Your profile inputs
          </p>
          <h2 className="mt-1 text-base md:text-lg font-semibold text-slate-900">
            {headerTitle}
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-500">
            {headerSubtitle}
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || (isResumeUploadMode && !resumeFile)}
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-xs md:text-sm font-semibold text-white shadow-[0_10px_30px_rgba(16,185,129,0.45)] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Finding your match…" : "Find My B-School List"}
        </button>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* BODY */}
      <div className="mt-4 space-y-4">
        {/* MODE 2: RESUME UPLOAD (HYBRID: RESUME + QUESTIONS) */}
        {isResumeUploadMode && (
          <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 px-4 py-6">
            <p className="text-sm font-semibold text-emerald-900">
              Upload your résumé
            </p>
            <p className="mt-1 text-xs text-emerald-800/90">
              We’ll parse your work experience, academics and impact from your
              résumé and combine it with your answers below to build a precise
              Dream / Competitive / Safe list.
            </p>

            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-emerald-300/80 bg-white px-4 py-6 text-center hover:bg-emerald-50">
              <span className="text-xs font-medium text-emerald-900">
                Click to upload PDF / DOC / DOCX
              </span>
              <span className="text-[11px] text-emerald-700">
                Max 5 MB. Make sure your latest roles and achievements are
                included.
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeChange}
                className="hidden"
              />
            </label>

            {resumeFile && (
              <p className="mt-3 text-[11px] font-medium text-emerald-900">
                Selected file:{" "}
                <span className="font-semibold">{resumeFile.name}</span>
              </p>
            )}

            {!resumeFile && (
              <p className="mt-3 text-[11px] text-emerald-800">
                Please upload a résumé before running your match.
              </p>
            )}

            <p className="mt-4 text-[11px] text-emerald-900">
              Next: answer the short questions below so we understand your test
              scores, goals, budget and geography preferences.
            </p>
          </div>
        )}

        {/* MODE 1 & 2: QUESTIONS BLOCK (QUESTIONS-ONLY + RESUME-UPLOAD) */}
        {(isQuestionsMode || isResumeUploadMode) && (
          <>
            <div className="mt-4 space-y-4">
              {BSMATCH_QUESTIONS.map((q) => (
                <QuestionField
                  key={q.id}
                  question={q}
                  value={answers[q.id]}
                  onChange={handleChange}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Tip: Give short, concrete answers for goals, test scores and
              preferences. Clear inputs = sharper B-school recommendations.
            </p>
          </>
        )}

        {/* MODE 3: USE SAVED PROFILE */}
        {isProfileMode && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5">
            <p className="text-sm font-semibold text-slate-900">
              Use saved profile & résumé analysis
            </p>
            <p className="mt-1 text-xs text-slate-600">
              We’ll reuse the data from your existing Admit55 profile (career
              trajectory, academics and goals) to run a fresh B-School match.
            </p>
            <ul className="mt-3 list-disc pl-4 text-[11px] text-slate-600">
              <li>Make sure your profile is up to date before running.</li>
              <li>
                If you recently uploaded a new résumé, re-analyze it in the
                Profile & Résumé tool first.
              </li>
            </ul>
          </div>
        )}
      </div>
    </form>
  );
}
