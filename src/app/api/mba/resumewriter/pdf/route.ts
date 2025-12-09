// src/app/api/mba/resumewriter/pdf/route.ts
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/mba/resumewriter/pdf
// Body: { resume_text: string, file_name?: string }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.resume_text !== "string") {
      return NextResponse.json(
        { error: "resume_text (string) is required" },
        { status: 400 }
      );
    }

    const resumeText = body.resume_text.trim();
    if (!resumeText) {
      return NextResponse.json(
        { error: "resume_text cannot be empty" },
        { status: 400 }
      );
    }

    const rawFileName =
      typeof body.file_name === "string" && body.file_name.trim().length > 0
        ? body.file_name.trim()
        : "resume";

    // Very simple sanitization
    const safeFileName = rawFileName.replace(/[^a-zA-Z0-9_\-]+/g, "_");

    // Create PDF with pdfkit
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const chunks: Uint8Array[] = [];
    let pdfBuffer: Buffer;

    // Collect PDF data chunks
    doc.on("data", (chunk) => {
      // chunk is Buffer, but we store as Uint8Array for TS-friendliness
      const uint8 = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
      chunks.push(uint8);
    });

    const bufferPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => {
        try {
          pdfBuffer = Buffer.concat(
            chunks.map((c) =>
              Buffer.isBuffer(c) ? c : Buffer.from(c as Uint8Array)
            )
          );
          resolve(pdfBuffer);
        } catch (e) {
          reject(e);
        }
      });
      doc.on("error", (err) => reject(err));
    });

    // Basic styling
    doc.fontSize(11);
    doc.font("Helvetica");

    // Optionally: title (name) on top if present
    const firstLine = resumeText.split("\n")[0];
    if (firstLine.length < 80) {
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text(firstLine, { align: "left" })
        .moveDown(1);

      doc.fontSize(11).font("Helvetica");
      const remaining = resumeText.slice(firstLine.length).trimStart();
      doc.text(remaining || "", {
        align: "left",
        lineGap: 4,
      });
    } else {
      // Just dump full text
      doc.text(resumeText, {
        align: "left",
        lineGap: 4,
      });
    }

    doc.end();

    const finalBuffer = await bufferPromise;

    // ✅ Convert Buffer → Uint8Array so TS is happy
    const uint8Array = new Uint8Array(finalBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName}.pdf"`,
      },
    });
  } catch (err: unknown) {
    console.error("[ResumeWriter][PDF] Error:", err);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
