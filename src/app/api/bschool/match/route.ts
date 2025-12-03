// src/app/api/bschool/match/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

// Point this to your Render ML service (same as profileresumetool)
const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "https://admit55.onrender.com";

// ============================================================
// POST /api/bschool/match
// ============================================================
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    console.log("\n" + "=".repeat(60));
    console.log("[BschoolMatch API] Forwarding to ML Service");
    console.log(`[ML Service] URL: ${ML_SERVICE_URL}/bschool-match`);
    console.log("=".repeat(60));

    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        {
          error:
            "Invalid content type. Use application/json with candidate_profile payload.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log(
      "[BschoolMatch API] Received JSON body keys:",
      Object.keys(body || {})
    );

    // Very light validation – real validation is inside ML service
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 }
      );
    }

    // Forward to ML service as-is (FastAPI expects the raw candidate_profile object)
    const mlResponse = await fetch(`${ML_SERVICE_URL}/bschool-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error(
        `[ML Service /bschool-match] Error ${mlResponse.status}: ${errorText}`
      );

      return NextResponse.json(
        {
          error: "ML service failed to process B-school match request",
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
      `[BschoolMatch API] ✓ Match complete in ${totalDuration}s (ML service)`
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
      `[BschoolMatch API] ✗ Match failed after ${duration}s:`,
      err instanceof Error ? err.message : String(err)
    );
    console.error("=".repeat(60) + "\n");

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unexpected error occurred in B-school match API",
        details:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.stack
            : undefined,
      },
      { status: 500 }
    );
  }
}

// Optional: quick health check for this API
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
        endpoint: "/api/bschool/match",
        ml_service: {
          url: ML_SERVICE_URL,
          status: mlHealth.status || "unknown",
          reachable: response.ok,
        },
        capabilities: ["bschool_match"],
        timestamp: new Date().toISOString(),
      },
      { status: response.ok ? 200 : 503 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status: "error",
        endpoint: "/api/bschool/match",
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
