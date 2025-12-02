// src/app/api/bookings/create/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createBooking } from "@src/lib/models/SessionBooking";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Safe JSON parse
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const topic = (body.topic ?? "").toString().trim();
    const preferredTime = (body.preferredTime ?? "").toString().trim();
    const userName =
      (body.userName ?? session.user.name ?? "").toString().trim();
    const userPhone = (body.userPhone ?? "").toString().trim();
    const message = (body.message ?? "").toString().trim();

    if (!topic || !preferredTime) {
      return NextResponse.json(
        { error: "topic and preferredTime are required" },
        { status: 400 }
      );
    }

    const booking = await createBooking({
      userEmail: session.user.email,
      userName: userName || undefined,
      userPhone: userPhone || undefined,
      topic,
      preferredTime,
      message: message || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        booking,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[BOOKING CREATE ERROR]", err);
    return NextResponse.json(
      { success: false, error: "Server error while creating booking" },
      { status: 500 }
    );
  }
}
