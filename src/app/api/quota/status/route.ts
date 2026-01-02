// src/app/api/usage/quota/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@src/app/api/auth/[...nextauth]/route";
import { getQuotaStatusForEmail } from "@src/lib/db/usage/getQuotaStatus";
import { getLoggedInUserByEmail } from "@src/models/auth/UserLoggedIn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/usage/quota/status
 *
 * ✅ Normal user: returns their own quota
 * ✅ Admin: can pass ?email=someone@domain.com to view another user's quota
 *
 * Responses:
 * - 401 if not logged in
 * - 403 if non-admin tries to query another user's email
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const viewerEmail = session?.user?.email;

  if (!viewerEmail) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  // Viewer role/plan (for admin gating + UI)
  const viewerUser = await getLoggedInUserByEmail(viewerEmail);
  const viewerRole = (viewerUser as any)?.role ?? null;
  const viewerPlan = (viewerUser as any)?.plan ?? null;
  const isAdmin = viewerRole === "admin";

  const url = new URL(req.url);
  const requestedEmailParam = url.searchParams.get("email")?.trim() || null;

  // Default: self
  const targetEmail = requestedEmailParam || viewerEmail;

  // If requesting someone else, require admin
  if (requestedEmailParam && requestedEmailParam !== viewerEmail && !isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: admin access required to view other users' quota" },
      { status: 403 }
    );
  }

  const status = await getQuotaStatusForEmail(targetEmail);

  return NextResponse.json(
    {
      viewer: {
        email: viewerEmail,
        role: viewerRole,
        plan: viewerPlan,
        isAdmin,
      },
      requested_email: targetEmail,
      ...status,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
