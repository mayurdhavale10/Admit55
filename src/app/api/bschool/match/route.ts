// src/app/api/bschool/match/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@src/app/api/auth/[...nextauth]/route";
import type { LLMProvider } from "@src/lib/db/usage/ProviderQuota";
import {
  consumeProviderQuota,
  QuotaExceededError,
} from "@src/modules/llm/guard/consumeProviderQuota";

export const runtime = "nodejs";
export const maxDuration = 120;

// Point this to your Render ML service
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "https://admit55.onrender.com";
const PROVIDER: LLMProvider = "groq";

// ============================================================
// POST /api/bschool/match
// ============================================================
export async function POST(req: Request) {
  const startTime = Date.now();

  // 0) Require login
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Invalid content type. Use application/json with candidate_profile payload." },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Light validation (avoid consuming quota on bad requests)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
    }

    // 1) Consume quota (1 request = 1 counted call)
    let quotaInfo:
      | { allowed: true; limit: number | typeof Infinity; used: number; remaining: number | typeof Infinity }
      | null = null;

    try {
      quotaInfo = await consumeProviderQuota({ email, provider: PROVIDER });
    } catch (err: any) {
      if (err instanceof QuotaExceededError || err?.status === 429) {
        return NextResponse.json(
          { error: "Free limit reached. Upgrade to continue." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Server error while checking quota." },
        { status: 500 }
      );
    }

    const extraHeaders: Record<string, string> = {
      "x-llm-provider": PROVIDER,
    };

    if (quotaInfo) {
      extraHeaders["x-free-limit"] =
        quotaInfo.limit === Infinity ? "inf" : String(quotaInfo.limit);
      extraHeaders["x-free-remaining"] =
        quotaInfo.remaining === Infinity ? "inf" : String(quotaInfo.remaining);
    }

    // 2) Forward to ML service as-is
    const mlResponse = await fetch(`${ML_SERVICE_URL}/bschool-match`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders, // optional; harmless if backend ignores
      },
      body: JSON.stringify(body),
    });

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      return NextResponse.json(
        {
          error: "ML service failed to process B-school match request",
          status: mlResponse.status,
          details: errorText,
        },
        { status: mlResponse.status, headers: extraHeaders }
      );
    }

    const result = await mlResponse.json();
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json(
      {
        ...result,
        processing_meta: {
          ...(result?.processing_meta || {}),
          total_duration_seconds: parseFloat(totalDuration),
          ml_service_url: ML_SERVICE_URL,
          timestamp: new Date().toISOString(),
        },
      },
      { headers: extraHeaders }
    );
  } catch (err: unknown) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unexpected error occurred in B-school match API",
        details:
          process.env.NODE_ENV === "development" && err instanceof Error ? err.stack : undefined,
        duration_seconds: parseFloat(duration),
      },
      { status: 500 }
    );
  }
}

// ============================================================
// GET /api/bschool/match (health) - no auth needed
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
        endpoint: "/api/bschool/match",
        ml_service: {
          url: ML_SERVICE_URL,
          status: (mlHealth as any)?.status || "unknown",
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
