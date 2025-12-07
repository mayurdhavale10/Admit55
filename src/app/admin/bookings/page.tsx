export const dynamic = "force-dynamic";
// or: export const revalidate = 0;

import { getAllBookings } from "@src/models/bookings/SessionBooking";
import AdminBookingsClient from "@src/app/admin/bookings/AdminBookingsClient";

export default async function AdminBookingsPage() {
  const bookings = await getAllBookings();

  const initialBookings = bookings.map((b) => ({
    _id: b._id?.toString() ?? "",
    userEmail: b.userEmail,
    userName: b.userName ?? "",
    userPhone: b.userPhone ?? "",
    topic: b.topic,
    preferredTime: b.preferredTime,
    status: b.status,
    coachId: b.coachId ?? "",
    coachName: b.coachName ?? "",
    confirmedDate: b.confirmedDate ?? "",
    adminNotes: b.adminNotes ?? "",
    createdAt: b.createdAt?.toISOString?.() ?? "",
    updatedAt: b.updatedAt ? b.updatedAt.toISOString() : "",
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-50 mb-6">
          Session Bookings
        </h1>

        <AdminBookingsClient initialBookings={initialBookings} />
      </div>
    </div>
  );
}
