// src/modules/data-client/cache.ts
import { redisGetJSON, redisSetJSON } from "@src/modules/data-client/redis";

export async function getOrSetJSON<T>(
  key: string,
  ttlSec: number,
  compute: () => Promise<T>
): Promise<T> {
  const cached = await redisGetJSON<T>(key);
  if (cached) return cached;
  const value = await compute();
  await redisSetJSON(key, value, ttlSec);
  return value;
}
