import { NextResponse } from "next/server";
import { updateBooking } from "@src/models/bookings/SessionBooking";

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { id, status, coachName, coachId, confirmedDate, adminNotes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing booking id" },
        { status: 400 },
      );
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (coachName) updates.coachName = coachName;
    if (coachId) updates.coachId = coachId;
    if (confirmedDate) updates.confirmedDate = confirmedDate;
    if (adminNotes) updates.adminNotes = adminNotes;

    const updated = await updateBooking(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, booking: updated },
      { status: 200 },
    );
  } catch (err) {
    console.error("[ADMIN BOOKINGS UPDATE ERROR]", err);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 },
    );
  }
}
