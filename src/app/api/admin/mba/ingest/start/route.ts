// src/app/api/admin/mba/ingest/start/route.ts
import { NextResponse } from "next/server";
import { inboxToProcessed } from "@src/modules/jobs/tasks/inboxToProcessed";

export const dynamic = "force-dynamic";

const ALLOWED = ["github", "huggingface", "kaggle", "ats", "partner_uploads"] as const;
type Source = (typeof ALLOWED)[number];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      sources?: string[];
      limit?: number;
      minChars?: number;
    };

    const wanted = Array.isArray(body.sources) ? body.sources : ALLOWED.slice();
    const sources = wanted.filter((s): s is Source => (ALLOWED as readonly string[]).includes(s));

    if (sources.length === 0) {
      return NextResponse.json({ ok: false, error: "No valid sources provided." }, { status: 400 });
    }

    const results = await Promise.all(
      sources.map((source) =>
        inboxToProcessed({
          source,
          limit: typeof body.limit === "number" ? body.limit : undefined,
          minChars: typeof body.minChars === "number" ? body.minChars : undefined,
        })
      )
    );

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("ingest/start error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
