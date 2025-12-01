// src/app/api/profile/update/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@src/lib/db/loggedinuser/connectDB";
import { getLoggedInUsersCollection } from "@src/lib/db/loggedinuser/connectDB";
import type { LoggedInUser } from "@src/lib/models/UserLoggedIn";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();

    const updateFields: Record<string, any> = {};

    if (body.name) updateFields.name = body.name;
    if (body.photo) updateFields.image = body.photo;
    if (body.headline) updateFields.headline = body.headline;
    if (body.targetIntake) updateFields.targetIntake = body.targetIntake;

    const col = await getLoggedInUsersCollection<LoggedInUser>();

    // If nothing to update, just return existing doc
    if (Object.keys(updateFields).length === 0) {
      const existingUser = await col.findOne({ email: session.user.email });
      return NextResponse.json({
        success: true,
        user: existingUser,
      });
    }

    const result = await col.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateFields },
      {
        returnDocument: "after",
        upsert: false,
      }
    );

    const updatedUser = result?.value ?? null;

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("[PROFILE UPDATE ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
