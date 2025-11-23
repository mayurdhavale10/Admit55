import { NextResponse } from "next/server";
import { enqueueCollector } from "@src/modules/jobs/queues";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { query = "software engineer resume", pages = 1, perPage = 10 } = body || {};
  const job = await enqueueCollector({ source: "github", params: { query, pages, perPage } });
  return NextResponse.json({ ok: true, jobId: job.id });
}
