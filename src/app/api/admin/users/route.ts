// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { getLoggedInUsersCollection } from "@src/lib/db/loggedinuser/connectDB";
import type { LoggedInUser } from "@src/lib/models/UserLoggedIn";

// ✅ IMPORTANT:
// Replace this with the SAME admin auth you want (session/cookies/etc.)
async function ensureAdmin(req: Request) {
  const secretHeader = req.headers.get("x-admin-secret");
  if (!secretHeader || secretHeader !== process.env.ADMIN_ADMIN_SECRET) {
    throw new Response("Unauthorized", { status: 401 });
  }
}

function toIsoOrEmpty(value?: Date | string | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export async function GET(req: Request) {
  try {
    // 🔐 Admin auth
    await ensureAdmin(req);

    const { searchParams } = new URL(req.url);

    const role = searchParams.get("role"); // "admin" | "user" | null
    const startDateStr = searchParams.get("startDate"); // 2025-01-01
    const endDateStr = searchParams.get("endDate"); // 2025-12-31
    const search = searchParams.get("q"); // text search on name/email

    const col = await getLoggedInUsersCollection<LoggedInUser>();

    const mongoFilter: Record<string, any> = {};

    // Role filter
    if (role === "admin" || role === "user") {
      mongoFilter.role = role;
    }

    // Date range filter on lastLogin
    if (startDateStr || endDateStr) {
      const dateFilter: Record<string, any> = {};
      if (startDateStr) {
        const start = new Date(startDateStr);
        if (!Number.isNaN(start.getTime())) {
          dateFilter.$gte = start;
        }
      }
      if (endDateStr) {
        const end = new Date(endDateStr);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999); // end of day
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

    // Optional: simple limit (you can make this a query param later)
    const limit = 200;

    const docs = await col
      .find(mongoFilter)
      .sort({ lastLogin: -1 })
      .limit(limit)
      .toArray();

    // Map Mongo docs -> frontend-friendly objects
    const users = docs.map((u) => ({
      _id: u._id ? String(u._id) : "",
      email: u.email,
      name: u.name ?? "",
      image: u.image ?? null,
      role: u.role ?? "user",
      loginCount: u.loginCount ?? 0,
      lastLogin: toIsoOrEmpty(u.lastLogin),
      createdAt: toIsoOrEmpty(u.createdAt),
      notes:
        u.notes?.map((n) => ({
          text: n.text,
          createdAt: toIsoOrEmpty(n.createdAt),
        })) ?? [],
    }));

    return NextResponse.json({ users }, { status: 200 });
  } catch (err) {
    if (err instanceof Response) {
      // from ensureAdmin
      return err;
    }

    console.error("[GET /api/admin/users] Error:", err);
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}
