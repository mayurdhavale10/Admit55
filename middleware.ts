// middleware.ts (project root)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// No-op: let every request pass through
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

// (optional) restrict which paths run middleware
export const config = {
  matcher: [
    // "/tools/:path*",           // enable later if you want gating
    // "/api/profileresumetool/:path*",
    // "/admin/:path*"
  ],
};
