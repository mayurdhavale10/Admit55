// src/lib/db/usage/ProviderQuota.ts
import { ObjectId, type Document } from "mongodb";
import { getProviderQuotaCollection } from "./quota";

export type LLMProvider = "groq" | "openai" | "ollama";

export interface ProviderQuotaDoc extends Document {
  _id?: ObjectId;
  email: string;
  provider: LLMProvider;
  used: number;
  createdAt: Date;
  updatedAt: Date;
}

async function ensureQuotaDoc(email: string, provider: LLMProvider) {
  const col = await getProviderQuotaCollection<ProviderQuotaDoc>();
  const now = new Date();

  await col.updateOne(
    { email, provider },
    {
      $setOnInsert: {
        email,
        provider,
        used: 0,
        createdAt: now,
      },
      $set: { updatedAt: now },
    },
    { upsert: true }
  );
}

/**
 * ✅ Atomic: increments only if used < limit, else returns null
 */
export async function tryConsumeProviderQuota(params: {
  email: string;
  provider: LLMProvider;
  limit: number;
}): Promise<ProviderQuotaDoc | null> {
  const { email, provider, limit } = params;

  await ensureQuotaDoc(email, provider);

  const col = await getProviderQuotaCollection<ProviderQuotaDoc>();
  const now = new Date();

  // In your driver version, this returns the updated document or null (NO .value)
  const updated = await col.findOneAndUpdate(
    { email, provider, used: { $lt: limit } },
    { $inc: { used: 1 }, $set: { updatedAt: now } },
    { returnDocument: "after" }
  );

  return updated ?? null;
}

export function computeRemaining(used: number, limit: number) {
  return Math.max(0, limit - used);
}
