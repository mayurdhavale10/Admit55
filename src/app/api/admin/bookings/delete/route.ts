import { NextResponse } from "next/server";
import { deleteBooking } from "@src/lib/models/SessionBooking";

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing booking id" },
        { status: 400 },
      );
    }

    const ok = await deleteBooking(id);

    if (!ok) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[ADMIN BOOKINGS DELETE ERROR]", err);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 },
    );
  }
}
