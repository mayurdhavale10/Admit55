// src/app/api/mba/profileresumetool/report-pdf/route.ts
import { NextRequest } from "next/server";
import { generateReportPdf } from "@src/lib/mba/pdf/generateReportPdf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const report = body?.report;

    if (!report) {
      return new Response(
        JSON.stringify({ error: "Missing 'report' in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const pdfBytes = await generateReportPdf(report); // Uint8Array

    // ✅ Send Uint8Array directly – cast to satisfy TS
    return new Response(pdfBytes as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="mba_profile_report.pdf"',
      },
    });
  } catch (err: any) {
    console.error("[report-pdf] Failed to generate PDF:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to generate PDF report",
        detail: err?.message || String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
