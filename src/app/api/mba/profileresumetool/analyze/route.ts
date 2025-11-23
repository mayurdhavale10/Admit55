// src/app/api/mba/profileresumetool/analyze/route.ts
// SIMPLIFIED VERSION - Just forwards to Render ML Service
// All Python/ML logic is now handled by Render.com FastAPI service
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

// ============================================================
// CONFIG
// ============================================================
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "https://admit55.onrender.com";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = {
  pdf: ["application/pdf"],
};

// ============================================================
// MAIN ENDPOINT - Forward to Render ML Service
// ============================================================
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    console.log("\n" + "=".repeat(60));
    console.log("[Analyze API] Forwarding to ML Service");
    console.log(`[ML Service] URL: ${ML_SERVICE_URL}`);
    console.log("=".repeat(60));

    const contentType = req.headers.get("content-type") || "";

    // HANDLE FILE UPLOAD
    if (contentType.includes("multipart/form-data")) {
      console.log("[Analyze API] Processing file upload...");
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      console.log(`[Analyze API] File received: ${file.name} (${file.type}, ${file.size} bytes)`);

      // Validate file
      if (file.size === 0) {
        return NextResponse.json({ error: "File is empty" }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            received_size_mb: (file.size / 1024 / 1024).toFixed(2),
          },
          { status: 400 }
        );
      }

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json(
          {
            error: "Only PDF files are supported",
            received_type: file.type,
          },
          { status: 400 }
        );
      }

      // Forward to ML service
      console.log("[Analyze API] Forwarding to Render ML service...");
      
      const mlFormData = new FormData();
      mlFormData.append("file", file);

      const mlResponse = await fetch(`${ML_SERVICE_URL}/analyze`, {
        method: "POST",
        body: mlFormData,
      });

      if (!mlResponse.ok) {
        const errorText = await mlResponse.text();
        console.error(`[ML Service] Error ${mlResponse.status}: ${errorText}`);
        
        return NextResponse.json(
          {
            error: "ML service failed to process request",
            status: mlResponse.status,
            details: errorText,
          },
          { status: mlResponse.status }
        );
      }

      const result = await mlResponse.json();
      const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log("\n" + "=".repeat(60));
      console.log(`[Analyze API] ✓ Analysis complete in ${totalDuration}s`);
      console.log("=".repeat(60) + "\n");

      // Add processing metadata
      return NextResponse.json({
        ...result,
        processing_meta: {
          ...result.processing_meta,
          total_duration_seconds: parseFloat(totalDuration),
          ml_service_url: ML_SERVICE_URL,
          timestamp: new Date().toISOString(),
        },
      });
    }
    // HANDLE DIRECT TEXT (JSON)
    else if (contentType.includes("application/json")) {
      console.log("[Analyze API] Processing JSON input...");
      const body = await req.json();

      if (!body.resume_text || typeof body.resume_text !== "string") {
        return NextResponse.json({ error: "resume_text required (string)" }, { status: 400 });
      }

      console.log(`[Analyze API] Text received: ${body.resume_text.length} characters`);

      // Forward to ML service
      console.log("[Analyze API] Forwarding to Render ML service...");
      
      const mlFormData = new FormData();
      mlFormData.append("resume_text", body.resume_text);

      const mlResponse = await fetch(`${ML_SERVICE_URL}/analyze`, {
        method: "POST",
        body: mlFormData,
      });

      if (!mlResponse.ok) {
        const errorText = await mlResponse.text();
        console.error(`[ML Service] Error ${mlResponse.status}: ${errorText}`);
        
        return NextResponse.json(
          {
            error: "ML service failed to process request",
            status: mlResponse.status,
            details: errorText,
          },
          { status: mlResponse.status }
        );
      }

      const result = await mlResponse.json();
      const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log("\n" + "=".repeat(60));
      console.log(`[Analyze API] ✓ Analysis complete in ${totalDuration}s`);
      console.log("=".repeat(60) + "\n");

      return NextResponse.json({
        ...result,
        processing_meta: {
          ...result.processing_meta,
          total_duration_seconds: parseFloat(totalDuration),
          ml_service_url: ML_SERVICE_URL,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid content type. Use multipart/form-data or application/json" },
        { status: 400 }
      );
    }
  } catch (err: unknown) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.error("\n" + "=".repeat(60));
    console.error(`[Analyze API] ✗ Analysis failed after ${duration}s`);
    console.error("Error:", err instanceof Error ? err.message : String(err));
    console.error("=".repeat(60) + "\n");

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unexpected error occurred",
        details: process.env.NODE_ENV === "development" && err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================
// HEALTH CHECK ENDPOINT
// ============================================================
export async function GET() {
  try {
    // Test ML service connection
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const mlHealth = response.ok ? await response.json() : { status: "unreachable" };

    return NextResponse.json(
      {
        status: response.ok ? "healthy" : "degraded",
        endpoint: "/api/mba/profileresumetool/analyze",
        ml_service: {
          url: ML_SERVICE_URL,
          status: mlHealth.status || "unknown",
          reachable: response.ok,
        },
        capabilities: ["file_upload", "direct_text", "pdf"],
        timestamp: new Date().toISOString(),
      },
      { status: response.ok ? 200 : 503 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status: "error",
        ml_service: {
          url: ML_SERVICE_URL,
          reachable: false,
          error: err instanceof Error ? err.message : String(err),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}