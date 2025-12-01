"use client";

import { useEffect, useState } from "react";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

type Booking = {
  _id: string;
  userEmail: string;
  userName?: string | null;
  sessionType?: string | null;
  preferredSlot?: string | null;
  createdAt?: string | null;
  status: BookingStatus;
  notes?: string | null;
};

const STATUS_BADGE_CLASSES: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-800 border border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  completed: "bg-sky-50 text-sky-800 border border-sky-200",
  cancelled: "bg-rose-50 text-rose-800 border border-rose-200",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/admin/bookings", {
          headers: {
            "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_ADMIN_SECRET ?? "",
          },
        });

        if (!res.ok) {
          // If API not implemented yet, fall back to demo data
          console.warn("GET /api/admin/bookings returned", res.status);
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        if (!cancelled) {
          setBookings(Array.isArray(json.bookings) ? json.bookings : []);
        }
      } catch {
        // Fallback demo row so the UI is usable even before backend is wired
        if (!cancelled) {
          setBookings([
            {
              _id: "demo-1",
              userEmail: "test@example.com",
              userName: "Demo Candidate",
              sessionType: "Profile Review",
              preferredSlot: "2025-12-05 18:00 IST",
              createdAt: new Date().toISOString(),
              status: "pending",
              notes: "Created from demo fallback – wire real API later.",
            },
          ]);
          setError(
            "Booking API not yet fully wired. Showing demo data for layout only."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-84px)] bg-transparent">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-10">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Booked Sessions
            </h1>
            <p className="text-sm text-sky-100/90 mt-1 max-w-xl">
              View and manage profile review / coaching sessions booked from the
              MBA tools.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.assign("/mba/tools/profileresumetool")}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs md:text-sm text-white hover:bg-white/15 transition-colors"
            >
              ↗ Open Profile/Resume Tool
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Session bookings
              </h2>
              <p className="text-xs text-slate-500">
                Each row is one candidate’s session request.
              </p>
            </div>

            {loading ? (
              <span className="text-xs text-slate-500">
                Loading bookings…
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Showing {bookings.length} booking
                {bookings.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {error && (
            <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-500">
                    Candidate
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500">
                    Session
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500">
                    Preferred slot
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500">
                    Created
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 && !loading ? (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-slate-500"
                      colSpan={6}
                    >
                      No sessions booked yet.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => {
                    const created =
                      b.createdAt && !Number.isNaN(Date.parse(b.createdAt))
                        ? new Date(b.createdAt).toLocaleString()
                        : "—";

                    const status: BookingStatus =
                      (b.status as BookingStatus) ?? "pending";

                    return (
                      <tr
                        key={b._id}
                        className="border-t border-slate-100 hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-slate-900">
                            {b.userName || "Unknown name"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {b.userEmail}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="text-slate-800">
                            {b.sessionType || "Profile / Resume Review"}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700">
                          {b.preferredSlot || "—"}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700">
                          {created}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span
                            className={
                              "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium " +
                              STATUS_BADGE_CLASSES[status]
                            }
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-slate-700 max-w-xs">
                          <div className="line-clamp-2">
                            {b.notes || "—"}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
