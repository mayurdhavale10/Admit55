// import { NextRequest, NextResponse } from "next/server";
// import { inboxToProcessed } from "@/src/modules/jobs/tasks/inboxToProcessed";
// import { processedToDatasets } from "@/src/modules/jobs/tasks/processedToDatasets";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// export async function POST(req: NextRequest) {
//   const body = await req.json().catch(() => ({}));
//   const { action, source } = body;

//   if (action === "promote") {
//     if (!source) return NextResponse.json({ error: "source_required" }, { status: 400 });
//     const r = await inboxToProcessed(source);
//     return NextResponse.json({ ok: true, ...r });
//   }

//   if (action === "build_dataset") {
//     const r = await processedToDatasets();
//     return NextResponse.json({ ok: true, ...r });
//   }

//   return NextResponse.json({ error: "unknown_action" }, { status: 400 });
// }
