// src/app/profile/components/ProfileBookingCard.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

type BookingStatus = "pending" | "assigned" | "completed" | "cancelled";

type Booking = {
  _id?: string;
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
};

function statusLabel(status: BookingStatus, b: Booking): string {
  switch (status) {
    case "pending":
      return "Pending review by an admin.";
    case "assigned":
      return `Assigned to ${b.coachName ?? "a coach"}${
        b.confirmedDate ? ` for ${b.confirmedDate}` : ""
      }.`;
    case "completed":
      return `Session completed with ${b.coachName ?? "your coach"}.`;
    case "cancelled":
      return "This session request was cancelled.";
    default:
      return "Status not available.";
  }
}

function statusChipClass(status: BookingStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "assigned":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "completed":
      return "bg-sky-50 text-sky-800 border-sky-200";
    case "cancelled":
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-slate-50 text-slate-800 border-slate-200";
  }
}

export default function ProfileBookingCard() {
  const { data: session } = useSession();

  // Prefill from session
  const defaultName = session?.user?.name ?? "";
  const defaultEmail = session?.user?.email ?? "";

  const [fullName, setFullName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("profile");
  const [preferredTime, setPreferredTime] = useState("");

  const [latestBooking, setLatestBooking] = useState<Booking | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAuthed = !!session?.user?.email;

  // Keep name/email in sync when session changes
  useEffect(() => {
    if (defaultName) setFullName(defaultName);
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultName, defaultEmail]);

  // Fetch latest booking for this user
  useEffect(() => {
    if (!isAuthed) return;

    const fetchBookings = async () => {
      try {
        setLoadingBooking(true);
        const res = await fetch("/api/profile/bookings", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          console.error("Failed to load bookings", await res.text());
          return;
        }

        const json = await res.json();
        const bookings: Booking[] = json.bookings ?? [];

        if (bookings.length > 0) {
          setLatestBooking(bookings[0]); // latest first from API
        } else {
          setLatestBooking(null);
        }
      } catch (err) {
        console.error("Error fetching bookings", err);
      } finally {
        setLoadingBooking(false);
      }
    };

    fetchBookings();
  }, [isAuthed]);

  const topicLabel = useMemo(() => {
    switch (latestBooking?.topic) {
      case "profile":
        return "Overall profile strategy";
      case "school":
        return "School shortlisting";
      case "essays":
        return "Essays & storytelling";
      case "interview":
        return "Interview preparation";
      default:
        return latestBooking?.topic ?? "-";
    }
  }, [latestBooking]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!isAuthed) {
      setErrorMsg("Please sign in to request a session.");
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!preferredTime.trim()) {
      setErrorMsg("Please enter a preferred time window.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: fullName,
          userPhone: phone,
          topic,
          preferredTime,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        console.error("Booking create error:", json);
        setErrorMsg(json.error || "Failed to submit session request.");
        return;
      }

      const booking: Booking = json.booking;
      setLatestBooking(booking);
      setSuccessMsg("Your session request has been submitted!");
      setErrorMsg(null);

      // Optionally clear only some fields
      // setPreferredTime("");
    } catch (err: any) {
      console.error("Booking create error", err);
      setErrorMsg("Unexpected error while submitting your request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className="rounded-3xl shadow-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-6 sm:py-7">
      <div className="rounded-2xl bg-gradient-to-br from-teal-50/80 via-cyan-50/80 to-white/90 backdrop-blur-xl border border-teal-100/70 shadow-sm p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#0A2540]">
              Book a Session
            </h2>
            <p className="mt-1 text-xs text-[#0A0A0A]">
              Request a one-to-one strategy session with an alum coach.
            </p>
          </div>

          {isAuthed ? (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-medium text-emerald-800">
              Logged in as&nbsp;
              <span className="truncate max-w-[120px]">
                {session?.user?.email}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-medium text-amber-800">
              Sign in to submit a booking
            </span>
          )}
        </div>

        {/* Latest / Upcoming Session */}
        <div className="mt-4 rounded-2xl bg-white/95 border border-slate-200 p-4 text-xs text-[#0A0A0A]">
          <p className="font-semibold text-[13px]">Upcoming session</p>

          {loadingBooking ? (
            <p className="mt-1 text-[11px] text-[#1A1A1A]">
              Loading your latest booking…
            </p>
          ) : !latestBooking ? (
            <>
              <p className="mt-1">No session booked yet.</p>
              <p className="mt-1 text-[11px] text-[#1A1A1A]">
                Once you book, your confirmed date, coach and meeting link will
                appear here.
              </p>
            </>
          ) : (
            <div className="mt-2 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold " +
                    statusChipClass(latestBooking.status)
                  }
                >
                  {latestBooking.status.toUpperCase()}
                </span>
                <span className="text-[11px] font-medium text-[#0A0A0A]">
                  {topicLabel}
                </span>
              </div>

              {latestBooking.confirmedDate && (
                <p className="text-[11px] text-[#111]">
                  <strong>Date:</strong> {latestBooking.confirmedDate}
                </p>
              )}

              {latestBooking.coachName && (
                <p className="text-[11px] text-[#111]">
                  <strong>Coach:</strong> {latestBooking.coachName}
                </p>
              )}

              <p className="text-[11px] text-[#1A1A1A]">
                {statusLabel(latestBooking.status, latestBooking)}
              </p>

              {latestBooking.adminNotes && (
                <p className="text-[11px] text-[#111] mt-1">
                  <strong>Note from admin:</strong> {latestBooking.adminNotes}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Success / Error */}
        {successMsg && (
          <p className="mt-3 text-xs font-medium text-emerald-700">
            {successMsg}
          </p>
        )}
        {errorMsg && (
          <p className="mt-2 text-xs font-medium text-rose-700">{errorMsg}</p>
        )}

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-3 text-xs text-[#0A0A0A]"
        >
          {/* Full name */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-[#0A0A0A]">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#0A0A0A] placeholder:text-slate-500 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Email (readonly) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-[#0A0A0A]">
              Email (login)
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-[#0A0A0A]"
            />
            <p className="text-[10px] text-[#1A1A1A]">
              We’ll use this email to link your booking and share details.
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-[#0A0A0A]">
              Phone / WhatsApp (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Include country code, e.g. +91…"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#0A0A0A] placeholder:text-slate-500 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Topic */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-[#0A0A0A]">
              Primary topic
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#0A0A0A] focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="profile">Overall profile strategy</option>
              <option value="school">School shortlisting</option>
              <option value="essays">Essays & storytelling</option>
              <option value="interview">Interview preparation</option>
            </select>
          </div>

          {/* Preferred time */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-[#0A0A0A]">
              Preferred time window
            </label>
            <input
              type="text"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              placeholder="For example: weekends, 7–9 PM IST"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#0A0A0A] placeholder:text-slate-500 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !isAuthed}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#0D3D91] disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Request a strategy session"}
          </button>

          <p className="mt-2 text-[10px] text-[#1A1A1A]">
            Your request will appear in the admin bookings panel. Once a coach
            is assigned, this section will update with the confirmed details.
          </p>
        </form>
      </div>
    </aside>
  );
}
