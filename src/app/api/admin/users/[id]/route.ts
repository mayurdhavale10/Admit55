// src/app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";

import { authOptions } from "@src/app/api/auth/[...nextauth]/route";
import { getLoggedInUsersCollection } from "@src/lib/db/loggedinuser/connectDB";
import type { LoggedInUser } from "@src/models/auth/UserLoggedIn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeRole(u: LoggedInUser): "admin" | "user" {
  return (u as any)?.role === "admin" ? "admin" : "user";
}

function safePlan(x: any): "free" | "pro" {
  return x === "pro" ? "pro" : "free";
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // 0) Require login
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const col = await getLoggedInUsersCollection<LoggedInUser>();

    // 1) Admin check
    const me = await col.findOne({ email });
    if (!me || safeRole(me) !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    // 2) Target user id
    const { id } = await ctx.params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }
    const _id = new ObjectId(id);

    // 3) Payload: { plan?: "free"|"pro", role?: "admin"|"user" }
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const next: Record<string, any> = {};
    const now = new Date();

    if (body.plan !== undefined) {
      if (body.plan !== "free" && body.plan !== "pro") {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      next.plan = safePlan(body.plan);
      next.planUpdatedAt = now;
    }

    if (body.role !== undefined) {
      if (body.role !== "admin" && body.role !== "user") {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      next.role = body.role;
    }

    if (Object.keys(next).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update. Provide plan and/or role." },
        { status: 400 }
      );
    }

    next.updatedAt = now;

    const result = await col.updateOne({ _id }, { $set: next });
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await col.findOne({ _id });

    return NextResponse.json(
      {
        ok: true,
        user: updated
          ? {
              _id: String(updated._id),
              email: updated.email,
              name: updated.name ?? "",
              role: safeRole(updated),
              plan: safePlan((updated as any)?.plan),
              planUpdatedAt: (updated as any)?.planUpdatedAt
                ? new Date((updated as any).planUpdatedAt).toISOString()
                : "",
            }
          : null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[PATCH /api/admin/users/[id]] Error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
