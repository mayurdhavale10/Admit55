// src/app/api/admin/users/[id]/notes/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getLoggedInUsersCollection } from "@src/lib/db/loggedinuser/connectDB";
import type { LoggedInUser } from "@src/lib/models/UserLoggedIn";

// ✅ IMPORTANT:
// Replace this with the SAME admin auth you used in /api/admin/users
async function ensureAdmin(req: Request) {
  const secretHeader = req.headers.get("x-admin-secret");
  if (!secretHeader || secretHeader !== process.env.ADMIN_ADMIN_SECRET) {
    throw new Response("Unauthorized", { status: 401 });
  }
}

// Explicit note type (kept simple)
type UserNote = {
  text: string;
  createdAt: Date;
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 🔐 Admin auth
    await ensureAdmin(req);

    const { id } = params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing user id" },
        { status: 400 }
      );
    }

    const userId = new ObjectId(id);

    const body = await req.json().catch(() => null);
    const text = body?.text;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid 'text' in request body" },
        { status: 400 }
      );
    }

    const now = new Date();

    const note: UserNote = {
      text: text.trim(),
      createdAt: now,
    };

    const col = await getLoggedInUsersCollection<LoggedInUser>();

    // 👇 Key fix: cast the update as `any` so we bypass the overly strict PushOperator typing
    const update: any = {
      $push: { notes: note },
      $set: { updatedAt: now },
    };

    const result = await col.findOneAndUpdate(
      { _id: userId },
      update,
      {
        returnDocument: "after",
        projection: { notes: 1 }, // only return notes
      }
    );

    const value = result?.value;
    if (!value) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const updatedNotes = value.notes ?? [];

    return NextResponse.json(
      {
        success: true,
        notes: updatedNotes,
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof Response) {
      // from ensureAdmin
      return err;
    }

    console.error("[POST /api/admin/users/[id]/notes] Error:", err);
    return NextResponse.json(
      { error: "Failed to add note" },
      { status: 500 }
    );
  }
}
