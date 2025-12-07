// src/app/api/admin/bookings/[id]/route.ts
import { NextResponse } from "next/server";
import { updateBooking, deleteBooking } from "@src/models/bookings/SessionBooking";

type RouteContext = {
  params: { id: string };
};

/**
 * PATCH /api/admin/bookings/:id
 * Body: { status?, coachName?, coachId?, confirmedDate?, adminNotes? }
 */
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const id = context.params.id;

    if (!id) {
      return NextResponse.json(
        { error: "Missing booking id" },
        { status: 400 },
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const updates: any = {};

    if (body.status) updates.status = body.status;
    if (body.coachName) updates.coachName = body.coachName;
    if (body.coachId) updates.coachId = body.coachId;
    if (body.confirmedDate) updates.confirmedDate = body.confirmedDate;
    if (body.adminNotes) updates.adminNotes = body.adminNotes;

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
    console.error("[ADMIN BOOKING PATCH ERROR]", err);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/bookings/:id
 */
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const id = context.params.id;

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
    console.error("[ADMIN BOOKING DELETE ERROR]", err);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 },
    );
  }
}
