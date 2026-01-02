// src/modules/llm/tools/guardedLLM.ts
import type { LLMProvider } from "@src/lib/db/usage/ProviderQuota";
import { consumeProviderQuota } from "@src/modules/llm/guard/consumeProviderQuota";

export async function guardedLLMCall<T>(params: {
  email: string;           // from NextAuth session
  provider: LLMProvider;   // "groq" | "openai" | "ollama"
  invoke: () => Promise<T>;
}) {
  const { email, provider, invoke } = params;

  // 1) Check quota (or bypass)
  await consumeProviderQuota({ email, provider });

  // 2) Run real LLM call
  return invoke();
}
