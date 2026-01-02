// src/modules/llm/guard/consumeProviderQuota.ts
import type { LLMProvider } from "@src/lib/db/usage/ProviderQuota";
import {
  computeRemaining,
  tryConsumeProviderQuota,
} from "@src/lib/db/usage/ProviderQuota";

import { getLoggedInUserByEmail } from "@src/models/auth/UserLoggedIn";

export class QuotaExceededError extends Error {
  status = 429;
  constructor(message: string) {
    super(message);
    this.name = "QuotaExceededError";
  }
}

const DEFAULT_LIMITS: Record<LLMProvider, number> = {
  groq: Number(process.env.FREE_LIMIT_GROQ ?? 5),
  openai: Number(process.env.FREE_LIMIT_OPENAI ?? 5),
  ollama: Number(process.env.FREE_LIMIT_OLLAMA ?? 999999),
};

export async function consumeProviderQuota(params: {
  email: string;
  provider: LLMProvider;
}) {
  const { email, provider } = params;

  // ✅ Admin bypass (you already store role in logged_in_users)
  const user = await getLoggedInUserByEmail(email);
  if (user?.role === "admin") {
    return { allowed: true as const, limit: Infinity, used: 0, remaining: Infinity };
  }

  // Optional: future pro plan bypass
  const plan = (user as any)?.plan;
  if (plan === "pro") {
    return { allowed: true as const, limit: Infinity, used: 0, remaining: Infinity };
  }

  const limit = DEFAULT_LIMITS[provider] ?? 5;

  const updated = await tryConsumeProviderQuota({ email, provider, limit });
  if (!updated) {
    throw new QuotaExceededError(
      `Free limit reached for ${provider} (${limit} calls). Upgrade to continue.`
    );
  }

  return {
    allowed: true as const,
    limit,
    used: updated.used,
    remaining: computeRemaining(updated.used, limit),
  };
}
