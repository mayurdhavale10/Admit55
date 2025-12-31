import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BASE =
  process.env.MBA_TOOLS_API_BASE_URL ||
  process.env.MBA_TOOLS_API_URL ||
  "http://localhost:8000"; // change if your FastAPI runs elsewhere

function jsonError(status: number, error: string, details?: string) {
  return NextResponse.json(
    { error, details: details || null, timestamp: new Date().toISOString() },
    { status }
  );
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    route: "/api/mba/profileresumetool/analyze",
    forwards_to: API_BASE,
    supports: ["multipart/form-data (file)", "application/json (text)"],
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  const isMultipart = ct.includes("multipart/form-data");

  try {
    // -------------------------
    // 1) FILE UPLOAD (multipart)
    // -------------------------
    if (isMultipart) {
      const incoming = await req.formData();

      const file = incoming.get("file");
      const resumeText = incoming.get("resume_text");
      const discovery = incoming.get("discovery_answers");

      const out = new FormData();

      if (file instanceof File) out.append("file", file, file.name);
      if (typeof resumeText === "string" && resumeText.trim()) out.append("resume_text", resumeText.trim());
      if (typeof discovery === "string" && discovery.trim()) out.append("discovery_answers", discovery.trim());

      const upstream = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: out,
      });

      const text = await upstream.text();
      let payload: any = null;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }

      return NextResponse.json(payload, { status: upstream.status });
    }

    // -------------------------
    // 2) TEXT ANALYSIS (JSON)
    // -------------------------
    const raw = await req.text(); // safer than req.json() for debugging
    let body: any;

    try {
      body = JSON.parse(raw);
    } catch (e: any) {
      console.error("[analyze route] Invalid JSON. First 200 chars:", JSON.stringify(raw.slice(0, 200)));
      return jsonError(400, "Invalid JSON body", e?.message || String(e));
    }

    const resume_text = typeof body?.resume_text === "string" ? body.resume_text : "";
    const discovery_answers =
      body?.discovery_answers && typeof body.discovery_answers === "object"
        ? body.discovery_answers
        : null;

    const upstream = await fetch(`${API_BASE}/analyze-json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_text, discovery_answers }),
    });

    const text = await upstream.text();
    let payload: any = null;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    return NextResponse.json(payload, { status: upstream.status });
  } catch (e: any) {
    console.error("[analyze route] Server error:", e);
    return jsonError(500, "Analyze route failed", e?.message || String(e));
  }
}
