import { NextResponse } from "next/server";

// POST /admin/mba/datasets/build
export async function POST() {
  try {
    // Placeholder for dataset build logic
    return NextResponse.json({
      success: true,
      message: "Dataset build endpoint - coming soon",
    });
  } catch (error) {
    console.error("Dataset build failed:", error);
    return NextResponse.json(
      { success: false, error: "Dataset build failed" },
      { status: 500 }
    );
  }
}

// GET /admin/mba/datasets/build
export async function GET() {
  return NextResponse.json({
    status: "ready",
    message: "Dataset build API endpoint",
  });
}

// Ensures the route always runs server-side (never cached)
export const dynamic = "force-dynamic";
