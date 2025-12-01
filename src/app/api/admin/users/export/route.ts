// src/app/api/admin/users/export/route.ts
import { NextResponse } from "next/server";
import { getLoggedInUsersCollection } from "@src/lib/db/loggedinuser/connectDB";
import type { LoggedInUser } from "@src/lib/models/UserLoggedIn";

// ✅ IMPORTANT:
// Replace this block with the *same* admin auth you used in /api/admin/users
async function ensureAdmin(req: Request) {
  const secretHeader = req.headers.get("x-admin-secret");
  if (!secretHeader || secretHeader !== process.env.ADMIN_ADMIN_SECRET) {
    // Or whatever you used earlier (session, token, etc.)
    throw new Response("Unauthorized", { status: 401 });
  }
}

function toIsoOrEmpty(value?: Date | string | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Wrap with quotes and escape embedded quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(req: Request) {
  try {
    // 🔐 Admin auth (same logic as /api/admin/users)
    await ensureAdmin(req);

    const { searchParams } = new URL(req.url);

    // Filters – keep these in sync with /api/admin/users
    const role = searchParams.get("role"); // "admin" | "user" | null
    const startDateStr = searchParams.get("startDate"); // e.g. 2025-01-01
    const endDateStr = searchParams.get("endDate"); // e.g. 2025-12-31
    const search = searchParams.get("q"); // name/email search

    const col = await getLoggedInUsersCollection<LoggedInUser>();

    const mongoFilter: Record<string, any> = {};

    // Filter by role
    if (role === "admin" || role === "user") {
      mongoFilter.role = role;
    }

    // Date range filter (on lastLogin; you can swap to createdAt if you prefer)
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
          // end of that day (23:59:59.999)
          end.setHours(23, 59, 59, 999);
          dateFilter.$lte = end;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        mongoFilter.lastLogin = dateFilter;
      }
    }

    // Simple text search on name/email
    if (search && search.trim().length > 0) {
      const regex = new RegExp(search.trim(), "i");
      mongoFilter.$or = [{ email: regex }, { name: regex }];
    }

    const users = await col
      .find(mongoFilter)
      .sort({ lastLogin: -1 })
      .toArray();

    // Build CSV header
    const header = [
      "name",
      "email",
      "role",
      "loginCount",
      "lastLogin",
      "createdAt",
    ].join(",");

    const rows = users.map((user) => {
      const name = escapeCsv(user.name ?? "");
      const email = escapeCsv(user.email ?? "");
      const roleVal = escapeCsv(user.role ?? "user");
      const loginCount = escapeCsv(user.loginCount ?? 0);
      const lastLogin = escapeCsv(toIsoOrEmpty(user.lastLogin));
      const createdAt = escapeCsv(toIsoOrEmpty(user.createdAt));

      return [name, email, roleVal, loginCount, lastLogin, createdAt].join(",");
    });

    const csv = [header, ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="logged_in_users.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof Response) {
      // thrown by ensureAdmin
      return err;
    }

    console.error("[GET /api/admin/users/export] Error:", err);
    return NextResponse.json(
      { error: "Failed to export users CSV" },
      { status: 500 }
    );
  }
}
