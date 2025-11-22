import { NextResponse } from "next/server";

/**
 * Handles GET requests for the profile resume tool content.
 * Returns a simple JSON payload confirming the route.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    route: "admin/profileresumetool/content",
  });
}

/**
 * Handles POST requests (stub).
 * The underscore in `_req` signals the parameter is intentionally unused.
 */
export async function POST(_req: Request): Promise<NextResponse> {
  
  void _req; 

  return NextResponse.json({
    ok: true,
    note: "content POST stub",
  });
}

export const dynamic = "force-static"; // optional — improves build performance
