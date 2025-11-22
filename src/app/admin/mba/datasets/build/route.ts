import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Placeholder for dataset build logic
    return NextResponse.json({
      success: true,
      message: "Dataset build endpoint - coming soon",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Dataset build failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ready",
    message: "Dataset build API endpoint",
  });
}

export const dynamic = 'force-dynamic';