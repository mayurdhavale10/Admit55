// src/app/api/mba/profileresumetool/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@src/app/api/auth/[...nextauth]/route";
import type { LLMProvider } from "@src/lib/db/usage/ProviderQuota";
import {
  consumeProviderQuota,
  QuotaExceededError,
} from "@src/modules/llm/guard/consumeProviderQuota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BACKEND =
  process.env.MBA_TOOLS_API_URL ||
  process.env.NEXT_PUBLIC_MBA_TOOLS_API_URL ||
  process.env.ML_SERVICE_URL ||
  "https://admit55.onrender.com";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PROVIDER: LLMProvider = "groq";

function pickDiscoveryFromMultipart(incoming: FormData): string | null {
  const keys = ["discovery_answers", "discoveryAnswers", "context"];
  for (const k of keys) {
    const v = incoming.get(k);
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function pickDiscoveryFromJson(body: any): any | null {
  return body?.discovery_answers ?? body?.discoveryAnswers ?? body?.context ?? null;
}

/**
 * GET -> proxy health check (no auth needed)
 */
export async function GET() {
  const r = await fetch(`${BACKEND}/health`, { cache: "no-store" });
  const buf = await r.arrayBuffer();
  return new NextResponse(buf, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json",
    },
  });
}

/**
 * POST -> proxy analyze
 * - requires login
 * - consumes 1 free call (provider = groq)
 * - multipart/form-data -> FastAPI /analyze
 * - application/json -> FastAPI /analyze-json
 */
export async function POST(req: NextRequest) {
  // 0) Require login
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const ct = req.headers.get("content-type") || "";

  // 1) Build/validate request first (so we don't consume quota on bad inputs)
  let mode: "multipart" | "json" = "json";
  let fwdForm: FormData | null = null;
  let jsonPayload: any | null = null;

  if (ct.includes("multipart/form-data")) {
    mode = "multipart";
    const incoming = await req.formData();

    const file = incoming.get("file") as File | null;
    const resumeText = incoming.get("resume_text");

    if (!file && !resumeText) {
      return NextResponse.json(
        { error: "Provide either file or resume_text" },
        { status: 400 }
      );
    }

    if (file) {
      if (file.size === 0) {
        return NextResponse.json({ error: "File is empty" }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File too large. Max ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`,
            received_mb: (file.size / 1024 / 1024).toFixed(2),
          },
          { status: 400 }
        );
      }
    }

    const fwd = new FormData();
    if (file) fwd.append("file", file);
    if (resumeText) fwd.append("resume_text", String(resumeText));

    const discoveryRaw = pickDiscoveryFromMultipart(incoming);
    if (discoveryRaw) {
      // FastAPI reads discovery_answers; context kept for backward-compat
      fwd.append("discovery_answers", discoveryRaw);
      fwd.append("context", discoveryRaw);
    }

    fwdForm = fwd;
  } else {
    // JSON
    const body = await req.json().catch(() => null);

    if (!body?.resume_text || typeof body.resume_text !== "string") {
      return NextResponse.json({ error: "Missing resume_text" }, { status: 400 });
    }

    const discovery = pickDiscoveryFromJson(body);

    jsonPayload = {
      resume_text: body.resume_text,
      discovery_answers: discovery || null,
    };
  }

  // 2) Consume quota (1 request = 1 counted call)
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

  // 3) Add metadata headers
  const extraHeaders: Record<string, string> = {
    "x-llm-provider": PROVIDER,
  };

  if (quotaInfo) {
    extraHeaders["x-free-limit"] =
      quotaInfo.limit === Infinity ? "inf" : String(quotaInfo.limit);
    extraHeaders["x-free-remaining"] =
      quotaInfo.remaining === Infinity ? "inf" : String(quotaInfo.remaining);
  }

  // 4) Forward to backend
  if (mode === "multipart") {
    const r = await fetch(`${BACKEND}/analyze`, {
      method: "POST",
      body: fwdForm!, // safe
      headers: extraHeaders, // IMPORTANT: do NOT set content-type for FormData
    });

    const buf = await r.arrayBuffer();
    return new NextResponse(buf, {
      status: r.status,
      headers: {
        "content-type": r.headers.get("content-type") || "application/json",
        ...extraHeaders,
      },
    });
  }

  const r = await fetch(`${BACKEND}/analyze-json`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify(jsonPayload),
  });

  const buf = await r.arrayBuffer();
  return new NextResponse(buf, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json",
      ...extraHeaders,
    },
  });
}
