// src/lib/db/usage/getQuotaStatus.ts
import type { LLMProvider, ProviderQuotaDoc } from "./ProviderQuota";
import { getProviderQuotaCollection } from "./quota";
import { getLoggedInUserByEmail } from "@src/models/auth/UserLoggedIn";

const PROVIDERS: LLMProvider[] = ["groq", "openai", "ollama"];

function getDefaultLimit(provider: LLMProvider): number {
  if (provider === "groq") return Number(process.env.FREE_LIMIT_GROQ ?? 5);
  if (provider === "openai") return Number(process.env.FREE_LIMIT_OPENAI ?? 5);
  if (provider === "ollama") return Number(process.env.FREE_LIMIT_OLLAMA ?? 999999);
  return 5;
}

function jsonSafeLimit(n: number): number | "inf" {
  return Number.isFinite(n) ? n : "inf";
}

export type ProviderQuotaStatus = {
  provider: LLMProvider;
  used: number;
  limit: number | "inf";
  remaining: number | "inf";
};

export type QuotaStatusResponse = {
  email: string;
  providers: ProviderQuotaStatus[];
  asOf: string;
  plan?: string | null;
  role?: string | null;
};

export async function getQuotaStatusForEmail(email: string): Promise<QuotaStatusResponse> {
  // Read your “logged in user” profile (role/plan)
  const user = await getLoggedInUserByEmail(email);
  const role = (user as any)?.role ?? null;
  const plan = (user as any)?.plan ?? null;

  // Admin/pro = unlimited (dashboard should show inf)
  const isUnlimited = role === "admin" || plan === "pro";

  const col = await getProviderQuotaCollection<ProviderQuotaDoc>();
  const docs = await col
    .find({ email, provider: { $in: PROVIDERS } })
    .project({ provider: 1, used: 1 })
    .toArray();

  const usedMap = new Map<LLMProvider, number>();
  for (const d of docs) usedMap.set(d.provider, Number(d.used ?? 0));

  const providers: ProviderQuotaStatus[] = PROVIDERS.map((p) => {
    const used = usedMap.get(p) ?? 0;

    if (isUnlimited) {
      return { provider: p, used, limit: "inf", remaining: "inf" };
    }

    const limit = getDefaultLimit(p);
    const remaining = Math.max(0, limit - used);

    return {
      provider: p,
      used,
      limit: jsonSafeLimit(limit),
      remaining: jsonSafeLimit(remaining),
    };
  });

  return {
    email,
    providers,
    asOf: new Date().toISOString(),
    plan,
    role,
  };
}
