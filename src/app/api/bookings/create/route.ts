import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createBooking } from "@src/lib/models/SessionBooking";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();

    const booking = await createBooking({
      userEmail: session.user.email,
      topic: body.topic,
      preferredTime: body.preferredTime,
    });

    return NextResponse.json({ success: true, booking });
  } catch (err) {
    console.error("BOOKING ERROR", err);
    return NextResponse.json({ success: false, error: "Server error" });
  }
}
