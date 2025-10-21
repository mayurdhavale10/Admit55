import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "../../../../modules/repo-profileresumetool/profiles";
import { saveEvaluation } from "../../../../modules/repo-profileresumetool/evaluations";
import { evaluateProfile } from "../../../../modules/core-gap/profileresumetool/evaluate";
import type { Evaluation, ProfileResume } from "../../../../modules/schemas/profileresumetool/types";

type EvalBody = { userId?: string };

export async function POST(req: NextRequest) {
  const { userId } = (await req.json()) as EvalBody;
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const pr = await getProfile(userId);
  if (!pr) return NextResponse.json({ error: "profile not found" }, { status: 404 });

  const evaln: Evaluation = evaluateProfile(pr as ProfileResume);
  await saveEvaluation(evaln);
  return NextResponse.json(evaln);
}
