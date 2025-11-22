// src/modules/data-client/redis.ts
import Redis from "ioredis";

let _redis: Redis | null = null;

export function getRedis() {
  if (!_redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL not set");
    _redis = new Redis(url, {
      tls: url.startsWith("rediss://") ? {} : undefined,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return _redis;
}

export async function redisPing() {
  const r = getRedis();
  if (r.status !== "ready") await r.connect();
  return r.ping();
}

export async function redisSetJSON<T>(key: string, value: T, ttlSec?: number) {
  const r = getRedis();
  const payload = JSON.stringify(value);
  return ttlSec ? r.set(key, payload, "EX", ttlSec) : r.set(key, payload);
}

export async function redisGetJSON<T>(key: string): Promise<T | null> {
  const r = getRedis();
  const s = await r.get(key);
  return s ? (JSON.parse(s) as T) : null;
}
