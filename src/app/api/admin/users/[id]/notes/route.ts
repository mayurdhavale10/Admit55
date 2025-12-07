// src/app/api/admin/users/[id]/notes/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getLoggedInUsersCollection } from "@src/lib/db/loggedinuser/connectDB";
import type { LoggedInUser } from "@src/models/auth/UserLoggedIn";

// 🚨 TEMP: disable admin check
async function ensureAdmin(_req: Request) {
  return;
}

type UserNote = {
  text: string;
  createdAt: Date;
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    const update: any = {
      $push: { notes: note },
      $set: { updatedAt: now },
    };

    const result = await col.findOneAndUpdate(
      { _id: userId },
      update,
      {
        returnDocument: "after",
        projection: { notes: 1 },
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
      return err;
    }

    console.error("[POST /api/admin/users/[id]/notes] Error:", err);
    return NextResponse.json(
      { error: "Failed to add note" },
      { status: 500 }
    );
  }
}
