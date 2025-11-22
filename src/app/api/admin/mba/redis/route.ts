// src/app/api/admin/mba/redis/route.ts
import { NextResponse } from "next/server";
import { redisPing, redisSetJSON, redisGetJSON } from "@src/modules/data-client/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pong = await redisPing();
    return NextResponse.json({ ok: true, pong, path: "/api/admin/mba/redis" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { key = "admit55:test", value = { ok: true }, ttlSec = 60 } = await req.json();
    await redisSetJSON(key, value, ttlSec);
    const got = await redisGetJSON<typeof value>(key);
    return NextResponse.json({ ok: true, set: { key, value, ttlSec }, got });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
