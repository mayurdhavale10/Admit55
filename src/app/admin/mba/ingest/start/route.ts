import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Placeholder for ingest logic
    return NextResponse.json({
      success: true,
      message: "Ingest started - coming soon",
    });
  } catch {
    return NextResponse.json(
      { error: "Ingest failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ready",
    message: "Ingest start API endpoint",
  });
}

export const dynamic = 'force-dynamic';