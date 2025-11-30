// src/app/api/mba/profileresumetool/email/route.ts
import { NextResponse } from "next/server";
import { generateReportPdf, type MbaReportPayload } from "@src/lib/mba/pdf/generateReportPdf";
import { sendMbaReportEmail } from "@src/lib/email/mbaReportMailer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { report, to } = body as { report?: MbaReportPayload; to?: string };

    if (!report) {
      return NextResponse.json({ error: "Missing report payload" }, { status: 400 });
    }

    // 🧠 AUTH HOOK (for later):
    // If you implement auth, derive `userEmail` from session/JWT here
    // and use it when `to` is not provided.
    const recipient = (to || "").trim();
    if (!recipient) {
      return NextResponse.json({ error: "Missing recipient email (to)" }, { status: 400 });
    }

    // Ensure downloaded_at is set (used in PDF header)
    const enrichedReport: MbaReportPayload = {
      ...report,
      downloaded_at: report.downloaded_at || new Date().toISOString(),
    };

    const pdfBytes = await generateReportPdf(enrichedReport);

    await sendMbaReportEmail(recipient, pdfBytes, enrichedReport);

    return NextResponse.json({
      ok: true,
      to: recipient,
      message: "Report email queued successfully",
    });
  } catch (err: any) {
    console.error("[email-report] Failed to send report email:", err);

    return NextResponse.json(
      {
        error: "Failed to send report email",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
