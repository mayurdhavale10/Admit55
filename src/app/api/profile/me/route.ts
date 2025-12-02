// src/app/api/profile/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import { getLoggedInUsersCollection } from "@src/lib/db/loggedinuser/connectDB";
import { getBookingsForUser } from "@src/lib/models/SessionBooking";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const email = session.user.email;

    // 1️⃣ Fetch profile
    const col = await getLoggedInUsersCollection();
    const existing = await col.findOne({ email });

    const profile = {
      email,
      name: existing?.name ?? session.user.name ?? null,
      image: existing?.image ?? (session.user as any).image ?? null,
      headline: existing?.headline ?? null,
      targetIntake: existing?.targetIntake ?? null,
    };

    // 2️⃣ Fetch bookings for this user
    const bookings = await getBookingsForUser(email);

    return NextResponse.json(
      { profile, bookings },
      { status: 200 }
    );
  } catch (err) {
    console.error("[PROFILE:ME ERROR]", err);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
