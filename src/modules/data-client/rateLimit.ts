import { getRedis } from "@src/modules/data-client/redis";

export async function rateLimit(ip: string, bucket: string, limit: number, windowSec: number) {
  const r = getRedis();
  const key = `rl:${bucket}:${ip}`;
  const now = Date.now();
  const ttl = await r.ttl(key);
  const current = await r.incr(key);
  if (ttl < 0) await r.expire(key, windowSec);
  return { allowed: current <= limit, remaining: Math.max(limit - current, 0), resetInSec: Math.max(ttl, windowSec) };
}
