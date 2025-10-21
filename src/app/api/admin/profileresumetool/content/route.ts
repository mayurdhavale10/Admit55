import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, route: "admin/profileresumetool/content" });
}

// rename to _req (signals “intentionally unused”)
export async function POST(_req: Request) {
  return NextResponse.json({ ok: true, note: "content POST stub" });
}
