// src/app/api/profile/bookings/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getSessionBookingsCollection } from "@src/lib/db/loggedinuser/connectDB";
import type { SessionBooking } from "@src/models/bookings/SessionBooking";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const col = await getSessionBookingsCollection<SessionBooking>();

    const bookings = await col
      .find({ userEmail: session.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      {
        success: true,
        bookings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PROFILE BOOKINGS ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load bookings" },
      { status: 500 }
    );
  }
}
