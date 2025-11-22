// src/app/api/admin/mba/datasets/build/route.ts
import { NextResponse } from "next/server";
import { processedToDatasets } from "@src/modules/jobs/tasks/processedToDatasets";

export const dynamic = "force-dynamic";

type Source = "github" | "kaggle" | "huggingface" | "ats" | "partner_uploads";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const allowed = new Set<Source>([
    "github",
    "kaggle",
    "huggingface",
    "ats",
    "partner_uploads",
  ]);

  const sources: Source[] = Array.isArray(body?.sources) && body.sources.length
    ? body.sources.filter((s: string): s is Source => allowed.has(s as Source))
    : ["github"];

  // NOTE: BuildOptions has no 'label', so we only pass 'sources'.
  const res = await processedToDatasets({ sources });

  return NextResponse.json({ ok: true, ...res });
}
