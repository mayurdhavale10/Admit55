import { getAllBookings } from "@src/lib/models/SessionBooking";

export default async function AdminBookingsPage() {
  const bookings = await getAllBookings();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Session Bookings</h1>

      <div className="space-y-4">
        {bookings.map((b) => (
          <div
            key={b._id?.toString()}
            className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-[#0E0E0E]"
          >
            <p><strong>User:</strong> {b.userEmail}</p>
            <p><strong>Topic:</strong> {b.topic}</p>
            <p><strong>Preferred Time:</strong> {b.preferredTime}</p>
            <p><strong>Status:</strong> {b.status}</p>
            <p><strong>Coach:</strong> {b.coachName || "-"}</p>
            <p><strong>Date:</strong> {b.confirmedDate || "-"}</p>

            <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg">
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
