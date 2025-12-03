// src/lib/bschoolmatch/client.ts

import {
  BschoolMatchResponse,
  BschoolMatchMode,
  QuestionAnswerMap,
  BschoolMatchRequest,
} from "./types";
import {
  buildBschoolMatchRequestFromAnswers,
  BuildProfileOptions,
  BuildFromResumeOptions,
  buildBschoolMatchRequestFromResume,
} from "./mappers";

// -----------------------------------------------------------------------------
// Low-level client: takes a ready BschoolMatchRequest
// -----------------------------------------------------------------------------

/**
 * Low-level helper: send a prepared BschoolMatchRequest
 * to the Next.js API route and return the parsed response.
 */
export async function callBschoolMatch(
  request: BschoolMatchRequest
): Promise<BschoolMatchResponse> {
  const res = await fetch("/api/bschool/match", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    let details: unknown = undefined;
    try {
      details = await res.json();
    } catch {
      // ignore JSON parse errors – we’ll still throw a generic message
    }

    throw new Error(
      `B-school match failed with status ${res.status}${
        details ? ` – ${JSON.stringify(details)}` : ""
      }`
    );
  }

  const data = (await res.json()) as BschoolMatchResponse;
  return data;
}

// -----------------------------------------------------------------------------
// High-level helpers
// -----------------------------------------------------------------------------

export interface RunBschoolMatchOptions
  extends Omit<BuildProfileOptions, "mode"> {
  mode: BschoolMatchMode;
  answers: QuestionAnswerMap;
  /**
   * Optional: full profile resume report from ProfileResume tool
   * (gets forwarded so the ML pipeline can reuse it).
   */
  profileResumeReport?: any;
}

/**
 * High-level helper:
 * 1) Build CandidateProfile + BschoolMatchRequest from questionnaire answers
 * 2) Call /api/bschool/match via callBschoolMatch
 */
export async function runBschoolMatch(
  opts: RunBschoolMatchOptions
): Promise<BschoolMatchResponse> {
  const request: BschoolMatchRequest = buildBschoolMatchRequestFromAnswers(
    opts.answers,
    {
      mode: opts.mode,
      name: opts.name,
      email: opts.email,
      resumeText: opts.resumeText ?? null,
      resumeSummary: opts.resumeSummary ?? null,
      resumeAnalysis: opts.resumeAnalysis,
      profileResumeReport: opts.profileResumeReport,
    }
  );

  return callBschoolMatch(request);
}

/**
 * Convenience helper for resume-only flows (modes "resume-upload" / "resume-from-profile").
 * You can use this in the UI where there is no questionnaire, only resume context.
 */
export async function runBschoolMatchFromResume(
  opts: BuildFromResumeOptions
): Promise<BschoolMatchResponse> {
  const request: BschoolMatchRequest =
    buildBschoolMatchRequestFromResume(opts);

  return callBschoolMatch(request);
}
