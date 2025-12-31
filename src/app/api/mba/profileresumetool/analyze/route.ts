// src/app/api/mba/profileresumetool/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND =
  process.env.MBA_TOOLS_API_URL ||
  process.env.NEXT_PUBLIC_MBA_TOOLS_API_URL ||
  process.env.ML_SERVICE_URL ||
  "https://admit55.onrender.com";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
 * GET -> proxy health check
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
 * - multipart/form-data -> FastAPI /analyze (FormData)
 * - application/json -> FastAPI /analyze-json (JSON)
 */
export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";

  // ----------------------------
  // 1) MULTIPART (file upload)
  // ----------------------------
  if (ct.includes("multipart/form-data")) {
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

    // ✅ accept discovery_answers OR discoveryAnswers OR context
    const discoveryRaw = pickDiscoveryFromMultipart(incoming);
    if (discoveryRaw) {
      fwd.append("discovery_answers", discoveryRaw); // FastAPI reads this
      // also forward legacy key (safe)
      fwd.append("context", discoveryRaw);
    }

    // ✅ Debug (check Vercel logs)
    console.log("[PROXY] multipart keys:", Array.from(incoming.keys()));
    console.log("[PROXY] forwarded keys:", Array.from(fwd.keys()));
    console.log("[PROXY] has discovery:", Boolean(discoveryRaw));

    const r = await fetch(`${BACKEND}/analyze`, {
      method: "POST",
      body: fwd,
    });

    const buf = await r.arrayBuffer();
    return new NextResponse(buf, {
      status: r.status,
      headers: {
        "content-type": r.headers.get("content-type") || "application/json",
      },
    });
  }

  // ----------------------------
  // 2) JSON (text)
  // ----------------------------
  const body = await req.json().catch(() => null);

  if (!body?.resume_text || typeof body.resume_text !== "string") {
    return NextResponse.json({ error: "Missing resume_text" }, { status: 400 });
  }

  const discovery = pickDiscoveryFromJson(body);

  const payload = {
    resume_text: body.resume_text,
    discovery_answers: discovery || null,
  };

  console.log("[PROXY] json has discovery:", Boolean(payload.discovery_answers));

  const r = await fetch(`${BACKEND}/analyze-json`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const buf = await r.arrayBuffer();
  return new NextResponse(buf, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json",
    },
  });
}
