// src/app/api/mba/resumewriter/generate/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

// ============================================================
// CONFIG
// ============================================================
const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "https://admit55.onrender.com";


export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    console.log("\n" + "=".repeat(60));
    console.log("[ResumeWriter API] Forwarding to ML Service");
    console.log(`[ML Service] URL: ${ML_SERVICE_URL}/resumewriter`);
    console.log("=".repeat(60));

    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 }
      );
    }

    // Just basic validation – details are handled in FastAPI
    console.log("[ResumeWriter API] Received payload keys:", Object.keys(body));

    const mlResponse = await fetch(`${ML_SERVICE_URL}/resumewriter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error(
        `[ML Service] Error ${mlResponse.status}: ${errorText.slice(0, 500)}`
      );

      return NextResponse.json(
        {
          error: "ML service failed to generate resume",
          status: mlResponse.status,
          details: errorText,
        },
        { status: mlResponse.status }
      );
    }

    const result = await mlResponse.json();
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n" + "=".repeat(60));
    console.log(
      `[ResumeWriter API] ✓ Resume generation complete in ${totalDuration}s`
    );
    console.log("=".repeat(60) + "\n");

    return NextResponse.json({
      ...result,
      processing_meta: {
        ...(result.processing_meta || {}),
        total_duration_seconds: parseFloat(totalDuration),
        ml_service_url: ML_SERVICE_URL,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.error("\n" + "=".repeat(60));
    console.error(
      `[ResumeWriter API] ✗ Generation failed after ${duration}s`
    );
    console.error(
      "Error:",
      err instanceof Error ? err.message : String(err)
    );
    console.error("=".repeat(60) + "\n");

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unexpected error occurred",
        details:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.stack
            : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================
// GET /api/mba/resumewriter/generate  (health check)
// ============================================================
export async function GET() {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const mlHealth = response.ok ? await response.json() : { status: "unknown" };

    return NextResponse.json(
      {
        status: response.ok ? "healthy" : "degraded",
        endpoint: "/api/mba/resumewriter/generate",
        ml_service: {
          url: ML_SERVICE_URL,
          status: mlHealth.status || "unknown",
          reachable: response.ok,
        },
        capabilities: ["resume_writer"],
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