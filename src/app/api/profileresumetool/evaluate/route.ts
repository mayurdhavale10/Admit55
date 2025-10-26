import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/src/modules/repo-profileresumetool/profiles";
import { saveEvaluation } from "@/src/modules/repo-profileresumetool/evaluations";
import { evaluateProfile } from "@/src/modules/core-gap/profileresumetool/evaluate";
import type { ProfileResume } from "@/src/modules/schemas/profileresumetool/types";
import type { EvaluationOutput } from "@/src/modules/schemas/profileresumetool/evaluation";

type Body = { userId?: string; persona?: "fulltime"|"executive"|"deferred"|"switcher"|"international"|"reapplicant"; track?: string };

export async function POST(req: NextRequest) {
  const { userId, persona = "fulltime", track } = (await req.json()) as Body;
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const pr = await getProfile(userId);
  if (!pr) return NextResponse.json({ error: "profile not found" }, { status: 404 });

  // New evaluator output (no userId/createdAt inside)
  const evalOut: EvaluationOutput = evaluateProfile(pr as ProfileResume, { persona, track });

  // Wrap for DB (adds userId + createdAt)
  const dbEval = {
    userId,
    createdAt: new Date(),
    ...evalOut,
  };

  await saveEvaluation(dbEval);
  return NextResponse.json(dbEval);
}
