import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ ok: true, note: "models POST stub" }); }
export async function GET() { return NextResponse.json({ ok: true, models: [] }); }
