// src/app/api/admin/mba/llm-settings/route.ts
import { NextRequest, NextResponse } from "next/server";

type Provider = "groq" | "openai" | "anthropic" | "gemini";

/**
 * TEMP storage (Phase 1)
 * Replace with DB later (Mongo / Prisma / KV)
 */
let LLM_CONFIG: {
  provider: Provider;
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
} = {
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  apiKey: process.env.GROQ_API_KEY || "",
  temperature: 0.2,
  maxTokens: 2000,
};

function maskKey(key: string) {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

/**
 * GET — fetch current LLM settings
 * NOTE: llmClient.ts expects either:
 *  - raw settings object, OR
 *  - { success:true, data:{...} }
 * We'll return BOTH (backwards compatible + easy parsing).
 */
export async function GET() {
  const payload = {
    provider: LLM_CONFIG.provider,
    model: LLM_CONFIG.model,
    apiKey: LLM_CONFIG.apiKey,
    temperature: LLM_CONFIG.temperature ?? 0.2,
    maxTokens: LLM_CONFIG.maxTokens ?? 2000,
  };

  return NextResponse.json({
    success: true,
    data: {
      ...payload,
      apiKeyMasked: maskKey(LLM_CONFIG.apiKey),
    },
    // also include raw (optional convenience)
    ...payload,
    apiKeyMasked: maskKey(LLM_CONFIG.apiKey),
  });
}

/**
 * POST — update LLM settings
 * Accepts: provider, model, apiKey, temperature?, maxTokens?
 */
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { provider, model, apiKey, temperature, maxTokens } = body as Record<
      string,
      unknown
    >;

    if (typeof provider !== "string" || typeof model !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing provider / model" },
        { status: 400 }
      );
    }

    // allow apiKey to be optional if you want to keep existing key
    // but if user sends empty string, reject
    const apiKeyStr =
      typeof apiKey === "string" ? apiKey.trim() : LLM_CONFIG.apiKey;

    if (!apiKeyStr) {
      return NextResponse.json(
        { success: false, error: "Missing apiKey" },
        { status: 400 }
      );
    }

    const allowed: Provider[] = ["groq", "openai", "anthropic", "gemini"];
    if (!allowed.includes(provider as Provider)) {
      return NextResponse.json(
        { success: false, error: "Unsupported provider" },
        { status: 400 }
      );
    }

    if (!model.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing model" },
        { status: 400 }
      );
    }

    const tempNum =
      typeof temperature === "number" ? Math.max(0, Math.min(1, temperature)) : undefined;

    const maxTokNum =
      typeof maxTokens === "number"
        ? Math.max(256, Math.min(8000, Math.floor(maxTokens)))
        : undefined;

    LLM_CONFIG = {
      provider: provider as Provider,
      model: model.trim(),
      apiKey: apiKeyStr,
      temperature: tempNum ?? LLM_CONFIG.temperature ?? 0.2,
      maxTokens: maxTokNum ?? LLM_CONFIG.maxTokens ?? 2000,
    };

    return NextResponse.json({
      success: true,
      message: "LLM settings updated successfully",
      data: {
        provider: LLM_CONFIG.provider,
        model: LLM_CONFIG.model,
        apiKeyMasked: maskKey(LLM_CONFIG.apiKey),
        temperature: LLM_CONFIG.temperature,
        maxTokens: LLM_CONFIG.maxTokens,
      },
    });
  } catch (err) {
    console.error("LLM settings update failed:", err);
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 500 }
    );
  }
}
