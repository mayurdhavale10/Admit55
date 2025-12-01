// src/app/api/profile/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@src/lib/db/loggedinuser/connectDB";
import { getLoggedInUsersCollection } from "@src/lib/db/loggedinuser/connectDB";
import type { LoggedInUser } from "@src/lib/models/UserLoggedIn";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();

    const col = await getLoggedInUsersCollection<LoggedInUser>();
    const existing = await col.findOne({ email: session.user.email });

    // If no DB document yet, we fall back to session only
    const payload = {
      email: session.user.email,
      name: existing?.name ?? session.user.name ?? null,
      image: existing?.image ?? (session.user as any).image ?? null,
      headline: existing?.headline ?? null,
      targetIntake: existing?.targetIntake ?? null,
    };

    return NextResponse.json({ profile: payload }, { status: 200 });
  } catch (error) {
    console.error("[PROFILE ME ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
