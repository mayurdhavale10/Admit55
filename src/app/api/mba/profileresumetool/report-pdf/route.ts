// src/app/api/mba/profileresumetool/report-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateReportPdf } from "@src/lib/mba/pdf/generateReportPdf";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Accept either { report: {...} } or raw report
    const report = body.report ?? body;

    if (!report || typeof report !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid 'report' payload" },
        { status: 400 }
      );
    }

    const pdfBuffer = await generateReportPdf(report);

    // ✅ Convert Buffer → Uint8Array for type-safe BodyInit
    const pdfUint8 = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfUint8, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="mba_profile_report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[report-pdf] Failed to generate PDF:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF report" },
      { status: 500 }
    );
  }
}
