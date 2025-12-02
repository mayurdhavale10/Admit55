// src/app/admin/bookings/AdminBookingsClient.tsx
"use client";

import { useMemo, useState } from "react";

type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "assigned"
  | "completed"
  | "cancelled";

type BookingDTO = {
  _id: string;
  userEmail: string;
  userName?: string;
  userPhone?: string;
  topic: string;
  preferredTime: string;
  status: BookingStatus;
  coachId?: string;
  coachName?: string;
  confirmedDate?: string;
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function AdminBookingsClient({
  initialBookings,
}: {
  initialBookings: BookingDTO[];
}) {
  const [bookings, setBookings] = useState<BookingDTO[]>(initialBookings);
  const [filterStatus, setFilterStatus] = useState<BookingStatus | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredBookings = useMemo(() => {
    if (filterStatus === "all") return bookings;
    return bookings.filter((b) => b.status === filterStatus);
  }, [bookings, filterStatus]);

  function statusBadge(status: BookingStatus) {
    const map: Record<
      BookingStatus,
      { label: string; className: string }
    > = {
      pending: {
        label: "Pending",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      },
      accepted: {
        label: "Accepted",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      rejected: {
        label: "Rejected",
        className: "bg-rose-50 text-rose-700 border-rose-200",
      },
      assigned: {
        label: "Assigned",
        className: "bg-sky-50 text-sky-700 border-sky-200",
      },
      completed: {
        label: "Completed",
        className: "bg-slate-900 text-slate-100 border-slate-800",
      },
      cancelled: {
        label: "Cancelled",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      },
    };

    const meta = map[status];

    return (
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${meta.className}`}
      >
        {meta.label}
      </span>
    );
  }

  // 🔧 Now uses POST /api/admin/bookings/update
  async function updateStatus(id: string, status: BookingStatus) {
    try {
      setBusyId(id);

      const res = await fetch("/api/admin/bookings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        // not JSON, ignore parse error
      }

      if (!res.ok || json?.success !== true) {
        console.error(
          "Failed to update booking:",
          res.status,
          text || json?.error,
        );
        alert(
          `Failed to update booking status (HTTP ${res.status}).\n` +
            (json?.error || text || "Unknown error from server."),
        );
        return;
      }

      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status } : b)),
      );
    } catch (err) {
      console.error("Network error while updating booking:", err);
      alert("Network error while updating booking.");
    } finally {
      setBusyId(null);
    }
  }

  // 🔧 Now uses POST /api/admin/bookings/update
  async function assignCoach(id: string) {
    const coachName = window.prompt("Enter coach name to assign:");
    if (!coachName) return;

    try {
      setBusyId(id);
      const res = await fetch("/api/admin/bookings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, coachName, status: "assigned" }),
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        // ignore parse error
      }

      if (!res.ok || json?.success !== true) {
        console.error("Failed to assign coach:", res.status, text || json?.error);
        alert(
          `Failed to assign coach (HTTP ${res.status}).\n` +
            (json?.error || text || "Unknown error from server."),
        );
        return;
      }

      setBookings((prev) =>
        prev.map((b) =>
          b._id === id ? { ...b, coachName, status: "assigned" } : b,
        ),
      );
    } catch (err) {
      console.error("Network error while assigning coach:", err);
      alert("Network error while assigning coach.");
    } finally {
      setBusyId(null);
    }
  }

  // 🔧 Now uses POST /api/admin/bookings/delete
  async function deleteBooking(id: string) {
    if (!window.confirm("Delete this booking request?")) return;

    try {
      setBusyId(id);
      const res = await fetch("/api/admin/bookings/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        // ignore parse error
      }

      if (!res.ok || json?.success !== true) {
        console.error("Failed to delete booking:", res.status, text || json?.error);
        alert(
          `Failed to delete booking (HTTP ${res.status}).\n` +
            (json?.error || text || "Unknown error from server."),
        );
        return;
      }

      setBookings((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      console.error("Network error while deleting booking:", err);
      alert("Network error while deleting booking.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Total bookings:{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-50">
            {bookings.length}
          </span>
        </p>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-300">
            Filter by status:
          </span>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as BookingStatus | "all")
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500 text-center dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-300">
            No bookings match this filter.
          </div>
        )}

        {filteredBookings.map((b) => (
          <div
            key={b._id}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 dark:bg-slate-900 dark:border-slate-700"
          >
            {/* Top row: user + status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {b.userName || b.userEmail}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {b.userEmail}
                  {b.userPhone ? ` · ${b.userPhone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(b.status)}
              </div>
            </div>

            {/* Middle: details */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs text-slate-700 dark:text-slate-200">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  Topic
                </p>
                <p className="mt-0.5 capitalize">
                  {b.topic || "Not specified"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  Preferred Time
                </p>
                <p className="mt-0.5">
                  {b.preferredTime || "Not specified"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  Coach
                </p>
                <p className="mt-0.5">
                  {b.coachName ? b.coachName : "Not assigned"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  Confirmed Date
                </p>
                <p className="mt-0.5">
                  {b.confirmedDate ? b.confirmedDate : "Not scheduled"}
                </p>
              </div>
              {b.adminNotes && (
                <div className="sm:col-span-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    Admin Notes
                  </p>
                  <p className="mt-0.5 text-[11px]">{b.adminNotes}</p>
                </div>
              )}
            </div>

            {/* Bottom: actions */}
            <div className="mt-4 flex flex-wrap gap-2 justify-end">
              {/* Assign coach */}
              <button
                type="button"
                disabled={!!busyId}
                onClick={() => assignCoach(b._id)}
                className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-100 disabled:opacity-50"
              >
                Assign Coach
              </button>

              {/* Accept / Reject only when pending */}
              {b.status === "pending" && (
                <>
                  <button
                    type="button"
                    disabled={!!busyId}
                    onClick={() => updateStatus(b._id, "accepted")}
                    className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={!!busyId}
                    onClick={() => updateStatus(b._id, "rejected")}
                    className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-800 hover:bg-rose-100 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}

              {/* Mark completed */}
              {b.status === "accepted" ||
              b.status === "assigned" ||
              b.status === "pending" ? (
                <button
                  type="button"
                  disabled={!!busyId}
                  onClick={() => updateStatus(b._id, "completed")}
                  className="inline-flex items-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-50 hover:bg-black disabled:opacity-50"
                >
                  Mark Completed
                </button>
              ) : null}

              {/* Delete */}
              <button
                type="button"
                disabled={!!busyId}
                onClick={() => deleteBooking(b._id)}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
