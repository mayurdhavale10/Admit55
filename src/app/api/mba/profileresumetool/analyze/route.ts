// src/app/api/mba/profileresumetool/analyze/route.ts
// Forward-only API (Next.js) -> Render FastAPI (ML_SERVICE_URL)
// ✅ Uses Admin-configured LLM settings (via /api/admin/mba/llm-settings)
// ✅ Forwards optional discovery context as "discovery_answers" (preferred) to FastAPI
// ✅ Backward-compatible: accepts incoming "context" too
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

// ============================================================
// CONFIG
// ============================================================
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "https://admit55.onrender.com";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ------------------------------------------------------------
// Admin LLM headers (optional)
// ------------------------------------------------------------
async function getAdminLLMHeaders(req: Request): Promise<Record<string, string>> {
  const host = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const baseUrl = host ? `${proto}://${host}` : "";

  if (!baseUrl) return {};

  const adminToken = process.env.ADMIN_TOKEN || "";
  const r = await fetch(`${baseUrl}/api/admin/mba/llm-settings`, {
    method: "GET",
    headers: adminToken ? { "x-admin-token": adminToken } : undefined,
    cache: "no-store",
  });

  if (!r.ok) return {};

  const json = (await r.json()) as any;
  const data = json?.data as { provider?: string; model?: string } | undefined;

  // NOTE: you must return raw key only for server-authenticated requests.
  // If your admin endpoint returns it as `rawApiKey`, we forward it.
  const rawKey = json?.rawApiKey as string | undefined;

  const headers: Record<string, string> = {};
  if (data?.provider) headers["x-llm-provider"] = String(data.provider);
  if (data?.model) headers["x-llm-model"] = String(data.model);
  if (rawKey) headers["x-llm-api-key"] = String(rawKey);

  return headers;
}

// ------------------------------------------------------------
// Helpers: read JSON context from form/body
// ------------------------------------------------------------
function safeParseJsonObject(raw: unknown): Record<string, any> | null {
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;
    try {
      const parsed = JSON.parse(s);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as any;
      return null;
    } catch {
      return null;
    }
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as any;
  return null;
}

async function readDiscoveryFromForm(formData: FormData): Promise<Record<string, any> | null> {
  // Accept multiple possible keys from frontend:
  // - discovery_answers (preferred)
  // - discoveryAnswers (camelCase)
  // - context (legacy)
  const candidates = ["discovery_answers", "discoveryAnswers", "context"];

  for (const key of candidates) {
    const v = formData.get(key);
    const parsed = safeParseJsonObject(v);
    if (parsed) return parsed;
  }
  return null;
}

function readDiscoveryFromJsonBody(body: any): Record<string, any> | null {
  // Accept multiple possible keys
  return (
    safeParseJsonObject(body?.discovery_answers) ||
    safeParseJsonObject(body?.discoveryAnswers) ||
    safeParseJsonObject(body?.context) ||
    null
  );
}

// ============================================================
// MAIN ENDPOINT - Forward to Render ML Service
// ============================================================
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const contentType = req.headers.get("content-type") || "";
    const llmHeaders = await getAdminLLMHeaders(req);

    // ----------------------------
    // FILE UPLOAD (multipart)
    // ----------------------------
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
      if (file.size === 0) return NextResponse.json({ error: "File is empty" }, { status: 400 });

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            received_size_mb: (file.size / 1024 / 1024).toFixed(2),
          },
          { status: 400 }
        );
      }

      if (!file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json(
          { error: "Only PDF files are supported", received_type: file.type },
          { status: 400 }
        );
      }

      const mlFormData = new FormData();
      mlFormData.append("file", file);

      // ✅ IMPORTANT: FastAPI expects discovery_answers (preferred)
      const discovery = await readDiscoveryFromForm(formData);
      if (discovery) {
        mlFormData.append("discovery_answers", JSON.stringify(discovery));
        // optional: also send legacy key (won't hurt, but not required)
        // mlFormData.append("context", JSON.stringify(discovery));
      }

      const mlResponse = await fetch(`${ML_SERVICE_URL}/analyze`, {
        method: "POST",
        body: mlFormData,
        headers: { ...llmHeaders },
      });

      if (!mlResponse.ok) {
        const errorText = await mlResponse.text();
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

      return NextResponse.json({
        ...result,
        processing_meta: {
          ...(result.processing_meta || {}),
          total_duration_seconds: parseFloat(totalDuration),
          ml_service_url: ML_SERVICE_URL,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // ----------------------------
    // DIRECT TEXT (application/json)
    // ----------------------------
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as any;

      if (!body.resume_text || typeof body.resume_text !== "string") {
        return NextResponse.json({ error: "resume_text required (string)" }, { status: 400 });
      }

      const mlFormData = new FormData();
      mlFormData.append("resume_text", body.resume_text);

      // ✅ IMPORTANT: FastAPI expects discovery_answers (preferred)
      const discovery = readDiscoveryFromJsonBody(body);
      if (discovery) {
        mlFormData.append("discovery_answers", JSON.stringify(discovery));
        // optional legacy:
        // mlFormData.append("context", JSON.stringify(discovery));
      }

      const mlResponse = await fetch(`${ML_SERVICE_URL}/analyze`, {
        method: "POST",
        body: mlFormData,
        headers: { ...llmHeaders },
      });

      if (!mlResponse.ok) {
        const errorText = await mlResponse.text();
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

      return NextResponse.json({
        ...result,
        processing_meta: {
          ...(result.processing_meta || {}),
          total_duration_seconds: parseFloat(totalDuration),
          ml_service_url: ML_SERVICE_URL,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid content type. Use multipart/form-data or application/json" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unexpected error occurred",
        duration_seconds: parseFloat(duration),
        details:
          process.env.NODE_ENV === "development" && err instanceof Error ? err.stack : undefined,
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
    const response = await fetch(`${ML_SERVICE_URL}/health`, { method: "GET" });
    const mlHealth = response.ok ? await response.json().catch(() => ({})) : { status: "unreachable" };

    return NextResponse.json(
      {
        status: response.ok ? "healthy" : "degraded",
        endpoint: "/api/mba/profileresumetool/analyze",
        ml_service: {
          url: ML_SERVICE_URL,
          status: mlHealth.status || "unknown",
          reachable: response.ok,
        },
        capabilities: ["file_upload", "direct_text", "pdf", "discovery_answers_forwarding"],
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
