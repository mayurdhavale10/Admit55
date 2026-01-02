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
 * ✅ Read quota doc (optionally create if missing)
 */
export async function getProviderQuotaDoc(params: {
  email: string;
  provider: LLMProvider;
  createIfMissing?: boolean;
}): Promise<ProviderQuotaDoc | null> {
  const { email, provider, createIfMissing = false } = params;

  if (createIfMissing) {
    await ensureQuotaDoc(email, provider);
  }

  const col = await getProviderQuotaCollection<ProviderQuotaDoc>();
  return col.findOne({ email, provider });
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

  // Your driver returns the updated document or null (no .value)
  const updated = await col.findOneAndUpdate(
    { email, provider, used: { $lt: limit } },
    { $inc: { used: 1 }, $set: { updatedAt: now } },
    { returnDocument: "after" }
  );

  return updated ?? null;
}

/**
 * ✅ Useful for admin actions: set used count (reset/quota edit)
 */
export async function setProviderQuotaUsed(params: {
  email: string;
  provider: LLMProvider;
  used: number;
}): Promise<void> {
  const { email, provider, used } = params;

  await ensureQuotaDoc(email, provider);

  const col = await getProviderQuotaCollection<ProviderQuotaDoc>();
  await col.updateOne(
    { email, provider },
    { $set: { used: Math.max(0, used), updatedAt: new Date() } }
  );
}

export function computeRemaining(used: number, limit: number) {
  return Math.max(0, limit - used);
}
