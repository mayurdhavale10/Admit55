// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@src/app/api/auth/[...nextauth]/route";
import { getLoggedInUsersCollection } from "@src/lib/db/loggedinuser/connectDB";
import type { LoggedInUser } from "@src/models/auth/UserLoggedIn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toIsoOrEmpty(value?: Date | string | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function safePlan(u: LoggedInUser): "free" | "pro" {
  return (u as any)?.plan === "pro" ? "pro" : "free";
}

function safeRole(u: LoggedInUser): "admin" | "user" {
  return (u as any)?.role === "admin" ? "admin" : "user";
}

// ✅ Admin-only list users (GET /api/admin/users)
export async function GET(req: Request) {
  try {
    // 0) Require login
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    // 1) Admin check (based on your LoggedInUser.role)
    const col = await getLoggedInUsersCollection<LoggedInUser>();
    const me = await col.findOne({ email });
    if (!me || safeRole(me) !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    // 2) Parse filters
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role"); // "admin" | "user" | null
    const plan = searchParams.get("plan"); // "free" | "pro" | null
    const startDateStr = searchParams.get("startDate"); // yyyy-mm-dd
    const endDateStr = searchParams.get("endDate"); // yyyy-mm-dd
    const search = searchParams.get("q"); // text search on name/email

    const mongoFilter: Record<string, any> = {};

    // Role filter
    if (role === "admin" || role === "user") {
      mongoFilter.role = role;
    }

    // Plan filter
    if (plan === "free" || plan === "pro") {
      mongoFilter.plan = plan;
    }

    // Date range filter on lastLogin
    if (startDateStr || endDateStr) {
      const dateFilter: Record<string, any> = {};

      if (startDateStr) {
        const start = new Date(startDateStr);
        if (!Number.isNaN(start.getTime())) dateFilter.$gte = start;
      }

      if (endDateStr) {
        const end = new Date(endDateStr);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          dateFilter.$lte = end;
        }
      }

      if (Object.keys(dateFilter).length > 0) {
        mongoFilter.lastLogin = dateFilter;
      }
    }

    // Text search on email / name
    if (search && search.trim().length > 0) {
      const regex = new RegExp(search.trim(), "i");
      mongoFilter.$or = [{ email: regex }, { name: regex }];
    }

    // 3) Query
    const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);

    const docs = await col
      .find(mongoFilter)
      .sort({ lastLogin: -1 })
      .limit(limit)
      .toArray();

    // 4) Shape response
    const users = docs.map((u) => ({
      _id: u._id ? String(u._id) : "",
      email: u.email,
      name: u.name ?? "",
      image: u.image ?? null,

      role: safeRole(u),
      plan: safePlan(u),
      planUpdatedAt: toIsoOrEmpty((u as any)?.planUpdatedAt ?? null),

      loginCount: u.loginCount ?? 0,
      lastLogin: toIsoOrEmpty(u.lastLogin),
      createdAt: toIsoOrEmpty(u.createdAt),
      updatedAt: toIsoOrEmpty(u.updatedAt),

      notes:
        u.notes?.map((n) => ({
          text: n.text,
          createdAt: toIsoOrEmpty(n.createdAt),
        })) ?? [],
    }));

    return NextResponse.json(
      { users, count: users.length, limit },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/admin/users] Error:", err);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
