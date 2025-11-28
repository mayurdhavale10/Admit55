import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "https://admit55.onrender.com";

const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 50000;

/**
 * POST /api/mba/profileresumetool/rewrite
 * Accepts JSON: { resume_text: string }
 * Forwards to ML service as FormData
 */
export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    // Parse incoming JSON
    const body = await req.json();
    const resumeText = body?.resume_text;

    // Validation
    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "resume_text is required (string)" },
        { status: 400 }
      );
    }

    const trimmed = resumeText.trim();

    if (trimmed.length < MIN_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: `Not enough resume text to improve. Minimum ${MIN_TEXT_LENGTH} characters required.`,
          length: trimmed.length,
        },
        { status: 400 }
      );
    }

    if (trimmed.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: `Resume text too long (${trimmed.length} chars). Maximum ${MAX_TEXT_LENGTH} allowed.`,
        },
        { status: 400 }
      );
    }

    // Prepare FormData for ML service
    const formData = new FormData();
    formData.append("resume_text", trimmed);

    console.log(`[Rewrite API] Sending to: ${ML_SERVICE_URL}/rewrite`);
    console.log(`[Rewrite API] Resume length: ${trimmed.length} chars`);

    // Call ML service
    const mlRes = await fetch(`${ML_SERVICE_URL}/rewrite`, {
      method: "POST",
      body: formData,
    });

    console.log(`[Rewrite API] ML service response: ${mlRes.status}`);

    // Parse response
    let mlJson;
    try {
      mlJson = await mlRes.json();
    } catch (parseError) {
      console.error("[Rewrite API] Failed to parse ML response as JSON:", parseError);
      return NextResponse.json(
        {
          error: "ML service returned invalid JSON",
          status: mlRes.status,
        },
        { status: 500 }
      );
    }

    // Handle ML service error
    if (!mlRes.ok) {
      const msg =
        mlJson?.error ||
        mlJson?.detail ||
        `ML service error (${mlRes.status})`;

      console.error("[Rewrite API] ML service error:", msg);

      return NextResponse.json(
        {
          error: msg,
          status: mlRes.status,
          details: mlJson,
        },
        { status: mlRes.status }
      );
    }

    // Extract improved resume
    const improvedResume =
      mlJson?.improved_resume ||
      mlJson?.improvedResume ||
      mlJson?.data?.improved_resume ||
      mlJson?.text ||
      "";

    if (!improvedResume || typeof improvedResume !== "string") {
      console.error("[Rewrite API] No improved_resume in response:", mlJson);
      return NextResponse.json(
        {
          error: "ML service did not return improved_resume field",
          raw_response: mlJson,
        },
        { status: 500 }
      );
    }

    const elapsed = (Date.now() - startedAt) / 1000;

    console.log(`[Rewrite API] ✓ Success in ${elapsed.toFixed(2)}s`);

    return NextResponse.json({
      success: true,
      improved_resume: improvedResume,
      meta: {
        source: "remote-ml-service",
        ml_service_url: ML_SERVICE_URL,
        processing_time_seconds: elapsed,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[Rewrite API] Unexpected error:", err);
    return NextResponse.json(
      {
        error: err?.message || "Unexpected error in rewrite endpoint",
        stack: process.env.NODE_ENV === "development" ? err?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mba/profileresumetool/rewrite
 * Health check endpoint
 */
export async function GET() {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const mlHealth = res.ok ? await res.json() : { status: "unreachable" };

    return NextResponse.json(
      {
        status: res.ok ? "healthy" : "degraded",
        endpoint: "/api/mba/profileresumetool/rewrite",
        ml_service: {
          url: ML_SERVICE_URL,
          status: mlHealth.status || "unknown",
          reachable: res.ok,
        },
        timestamp: new Date().toISOString(),
      },
      { status: res.ok ? 200 : 503 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        endpoint: "/api/mba/profileresumetool/rewrite",
        ml_service: {
          url: ML_SERVICE_URL,
          reachable: false,
          error: err?.message || String(err),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}