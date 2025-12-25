// src/app/api/mba/profileresumetool/analyze/route.ts
// Forward-only API (Next.js) -> Render FastAPI (ML_SERVICE_URL)
// ✅ Uses Admin-configured LLM settings (via /api/admin/mba/llm-settings)
// ✅ Forwards optional context (4–5 questions) as "context" JSON in FormData
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

// ============================================================
// CONFIG
// ============================================================
const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "https://admit55.onrender.com";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type AdminLLMSettings = {
  provider: string; // groq | openai | gemini | anthropic | deepseek | etc
  model: string;
  apiKey: string; // stored in-memory for now (Phase-1)
};

async function getAdminLLMHeaders(req: Request): Promise<Record<string, string>> {
  // Hit your own Next API route (same deployment) so it reads the in-memory config.
  // Forward ADMIN_TOKEN if you later protect this endpoint.
  const host = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const baseUrl = host ? `${proto}://${host}` : "";

  // If baseUrl can't be built (edge case), fallback to env/provider only.
  if (!baseUrl) {
    return {};
  }

  const adminToken = process.env.ADMIN_TOKEN || "";
  const r = await fetch(`${baseUrl}/api/admin/mba/llm-settings`, {
    method: "GET",
    headers: adminToken ? { "x-admin-token": adminToken } : undefined,
    // Important in Next: avoid caching admin settings
    cache: "no-store",
  });

  if (!r.ok) return {};

  const json = (await r.json()) as any;
  const data = json?.data as
    | { provider?: string; model?: string; apiKeyMasked?: string }
    | undefined;

  // ⚠️ Your GET route currently returns masked key only (apiKeyMasked),
  // so for actual forwarding, we also need the raw key on server-side.
  // Easiest fix: modify admin GET to return apiKey ONLY if request has x-admin-token.
  // For now, we will attempt to fetch a server-safe "rawKey" field if you add it.
  const rawKey = json?.rawApiKey as string | undefined;

  const headers: Record<string, string> = {};

  if (data?.provider) headers["x-llm-provider"] = String(data.provider);
  if (data?.model) headers["x-llm-model"] = String(data.model);
  if (rawKey) headers["x-llm-api-key"] = String(rawKey);

  return headers;
}

async function readContextFromForm(formData: FormData) {
  const raw = formData.get("context");
  if (typeof raw !== "string" || !raw.trim()) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
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

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

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

      if (!file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json(
          { error: "Only PDF files are supported", received_type: file.type },
          { status: 400 }
        );
      }

      const mlFormData = new FormData();
      mlFormData.append("file", file);

      const context = await readContextFromForm(formData);
      if (context) mlFormData.append("context", JSON.stringify(context));

      const mlResponse = await fetch(`${ML_SERVICE_URL}/analyze`, {
        method: "POST",
        body: mlFormData,
        headers: {
          ...llmHeaders,
        },
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
        return NextResponse.json(
          { error: "resume_text required (string)" },
          { status: 400 }
        );
      }

      const mlFormData = new FormData();
      mlFormData.append("resume_text", body.resume_text);

      if (body.context && typeof body.context === "object") {
        mlFormData.append("context", JSON.stringify(body.context));
      }

      const mlResponse = await fetch(`${ML_SERVICE_URL}/analyze`, {
        method: "POST",
        body: mlFormData,
        headers: {
          ...llmHeaders,
        },
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
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.stack
            : undefined,
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
    const mlHealth = response.ok
      ? await response.json().catch(() => ({}))
      : { status: "unreachable" };

    return NextResponse.json(
      {
        status: response.ok ? "healthy" : "degraded",
        endpoint: "/api/mba/profileresumetool/analyze",
        ml_service: {
          url: ML_SERVICE_URL,
          status: mlHealth.status || "unknown",
          reachable: response.ok,
        },
        capabilities: [
          "file_upload",
          "direct_text",
          "pdf",
          "optional_context",
          "admin_llm_settings_forwarded",
        ],
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
