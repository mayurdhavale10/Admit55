// src/app/api/mba/profileresumetool/upload/route.ts
import { NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const maxDuration = 30;

// ============================================================
// CONFIGURATION
// ============================================================
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 50000;

const ALLOWED_MIME_TYPES = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ],
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function validateFileType(fileName: string, mimeType: string): boolean {
  const lowerFileName = fileName.toLowerCase();
  
  if (lowerFileName.endsWith(".pdf")) {
    return ALLOWED_MIME_TYPES.pdf.includes(mimeType);
  }
  
  if (lowerFileName.endsWith(".docx")) {
    return ALLOWED_MIME_TYPES.docx.includes(mimeType);
  }
  
  return false;
}

function isPDFBuffer(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer.toString("utf-8", 0, 5) === "%PDF-";
}

function isDOCXBuffer(buffer: Buffer): boolean {
  return buffer.length > 2 && buffer[0] === 0x50 && buffer[1] === 0x4B;
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// ============================================================
// MAIN UPLOAD HANDLER
// ============================================================
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }

    console.log(`[Upload] Processing: ${file.name}, ${file.size} bytes, ${file.type}`);

    // ---- VALIDATE FILE SIZE ----
    if (file.size === 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
          received_size_mb: (file.size / 1024 / 1024).toFixed(2),
        },
        { status: 400 }
      );
    }

    // ---- VALIDATE FILE TYPE ----
    const fileName = file.name.toLowerCase();
    const mimeType = file.type;

    if (!validateFileType(fileName, mimeType)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only PDF and DOCX files are supported.",
          received_type: mimeType,
          received_name: file.name,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";
    let format = "";
    const needsServerExtraction  = false;

    // ============================================================
    // PDF HANDLING - NO EXTRACTION HERE
    // ============================================================
    if (fileName.endsWith(".pdf")) {
      if (!isPDFBuffer(buffer)) {
        return NextResponse.json(
          { error: "File claims to be PDF but is not a valid PDF file." },
          { status: 400 }
        );
      }

      console.log("[Upload] ✓ PDF validated (extraction will be done server-side)");
      
      // Convert buffer to base64 for transmission
      const base64 = buffer.toString('base64');
      
      return NextResponse.json({
        success: true,
        format: "pdf",
        needs_server_extraction: true,
        file_data: base64, // Send raw file data
        meta: {
          original_filename: file.name,
          format: "pdf",
          file_size_bytes: file.size,
          file_size_mb: (file.size / 1024 / 1024).toFixed(2),
          processed_at: new Date().toISOString(),
          extraction_method: "server_side_python",
        },
      });
    }

    // ============================================================
    // DOCX EXTRACTION - WORKS IN NODE.JS
    // ============================================================
    else if (fileName.endsWith(".docx")) {
      if (!isDOCXBuffer(buffer)) {
        return NextResponse.json(
          { error: "File claims to be DOCX but is not a valid Word document." },
          { status: 400 }
        );
      }

      try {
        console.log("[Upload] Parsing DOCX...");
        const result = await Promise.race([
          mammoth.extractRawText({ buffer }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("DOCX parsing timeout")), 20000)
          ),
        ]);

        extractedText = (result as any)?.value || "";
        format = "docx";
        console.log(`[Upload] ✓ DOCX parsed: ${extractedText.length} characters`);
      } catch (err: any) {
        console.error("[Upload] DOCX parsing failed:", err.message);
        return NextResponse.json(
          {
            error: "Failed to extract text from DOCX. The file may be corrupted or in an unsupported format.",
          },
          { status: 422 }
        );
      }

      // Clean and validate DOCX text
      extractedText = cleanText(extractedText);

      if (extractedText.length < MIN_TEXT_LENGTH) {
        return NextResponse.json(
          {
            error: `Extracted text too short (${extractedText.length} characters). Minimum ${MIN_TEXT_LENGTH} characters required.`,
          },
          { status: 422 }
        );
      }

      if (extractedText.length > MAX_TEXT_LENGTH) {
        console.warn(`[Upload] Text truncated from ${extractedText.length} to ${MAX_TEXT_LENGTH} chars`);
        extractedText = extractedText.slice(0, MAX_TEXT_LENGTH);
      }

      console.log(`[Upload] ✓ Successfully extracted ${extractedText.length} characters`);

      return NextResponse.json({
        success: true,
        text: extractedText,
        format: "docx",
        needs_server_extraction: false,
        meta: {
          original_filename: file.name,
          format: format,
          file_size_bytes: file.size,
          file_size_mb: (file.size / 1024 / 1024).toFixed(2),
          characters: extractedText.length,
          words: extractedText.split(/\s+/).length,
          lines: extractedText.split("\n").length,
          processed_at: new Date().toISOString(),
          extraction_method: "nodejs_mammoth",
        },
      });
    }

  } catch (err: any) {
    console.error("[Upload] Unexpected error:", err);

    const isDevelopment = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        error: "An unexpected error occurred while processing the file.",
        details: isDevelopment ? err?.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================
// HEALTH CHECK ENDPOINT
// ============================================================
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    endpoint: "/api/mba/profileresumetool/upload",
    supported_formats: ["pdf", "docx"],
    max_file_size_mb: MAX_FILE_SIZE / 1024 / 1024,
    pdf_extraction: "server_side_python",
    docx_extraction: "nodejs_mammoth",
    timestamp: new Date().toISOString(),
  });
}