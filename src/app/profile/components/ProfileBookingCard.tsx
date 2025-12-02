"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

type BookingStatus = "pending" | "assigned" | "completed" | "cancelled";

export type Booking = {
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
};

export default function ProfileBookingCard({
  bookings,
  profileEmail,
}: {
  bookings: Booking[];
  profileEmail: string;
}) {
  const { data: session } = useSession();

  // Latest booking taken directly from props (server)
  const latestInitial = bookings.length > 0 ? bookings[0] : null;

  const [latestBooking, setLatestBooking] = useState<Booking | null>(
    latestInitial,
  );

  const [fullName, setFullName] = useState(
    session?.user?.name ?? latestInitial?.userName ?? "",
  );
  const [email, setEmail] = useState(profileEmail);
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("profile");
  const [preferredTime, setPreferredTime] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAuthed = !!session?.user?.email;

  // Update local state if server sends new bookings
  useEffect(() => {
    setLatestBooking(latestInitial);
  }, [latestInitial]);

  // Friendly topic names
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

  function statusDetail(status: BookingStatus) {
    if (!latestBooking) return "";

    switch (status) {
      case "pending":
        return "Pending review by an admin.";
      case "assigned":
        return `Assigned to ${latestBooking.coachName ?? "a coach"}${
          latestBooking.confirmedDate
            ? ` for ${latestBooking.confirmedDate}`
            : ""
        }.`;
      case "completed":
        return `Session completed with ${latestBooking.coachName ?? "your coach"}.`;
      case "cancelled":
        return "This session request was cancelled.";
      default:
        return "";
    }
  }

  function statusChip(status: BookingStatus) {
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
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isAuthed) {
      setErrorMsg("Please sign in to request a session.");
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!preferredTime.trim()) {
      setErrorMsg("Preferred time cannot be empty.");
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
        setErrorMsg(json.error || "Failed to create session.");
        return;
      }

      const newBooking: Booking = json.booking;
      setLatestBooking(newBooking);
      setSuccessMsg("Your session request has been submitted!");
    } catch (err) {
      console.error(err);
      setErrorMsg("Unexpected error submitting request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className="rounded-3xl shadow-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-6 sm:py-7">
      <div className="rounded-2xl bg-gradient-to-br from-teal-50/80 via-cyan-50/80 to-white/90 backdrop-blur-xl border border-teal-100/70 shadow-sm p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0A2540]">
              Book a Session
            </h2>
            <p className="mt-1 text-xs text-[#0A0A0A]">
              Request a one-to-one strategy session with an alum coach.
            </p>
          </div>

          {isAuthed && (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-medium text-emerald-800">
              Logged in as {profileEmail}
            </span>
          )}
        </div>

        {/* Upcoming Session */}
        <div className="mt-4 rounded-2xl bg-white/95 border border-slate-200 p-4 text-xs text-[#0A0A0A]">
          <p className="font-semibold text-[13px]">Upcoming session</p>

          {!latestBooking ? (
            <>
              <p className="mt-1">No session booked yet.</p>
              <p className="mt-1 text-[11px]">
                Once you book, the confirmed session will appear here.
              </p>
            </>
          ) : (
            <div className="mt-2 space-y-1">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusChip(
                  latestBooking.status,
                )}`}
              >
                {latestBooking.status.toUpperCase()}
              </span>

              <span className="text-[11px] font-medium">
                {topicLabel}
              </span>

              {latestBooking.confirmedDate && (
                <p className="text-[11px]">
                  <strong>Date:</strong> {latestBooking.confirmedDate}
                </p>
              )}

              {latestBooking.coachName && (
                <p className="text-[11px]">
                  <strong>Coach:</strong> {latestBooking.coachName}
                </p>
              )}

              <p className="text-[11px]">{statusDetail(latestBooking.status)}</p>

              {latestBooking.adminNotes && (
                <p className="text-[11px] mt-1">
                  <strong>Note:</strong> {latestBooking.adminNotes}
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
          <p className="mt-2 text-xs font-medium text-rose-700">
            {errorMsg}
          </p>
        )}

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-3 text-xs text-[#0A0A0A]"
        >
          {/* Full name */}
          <div>
            <label className="text-[11px] font-medium">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="text-[11px] font-medium">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-[11px] font-medium">
              Phone / WhatsApp (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          {/* Topic */}
          <div>
            <label className="text-[11px] font-medium">Primary topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            >
              <option value="profile">Overall profile strategy</option>
              <option value="school">School shortlisting</option>
              <option value="essays">Essays & storytelling</option>
              <option value="interview">Interview preparation</option>
            </select>
          </div>

          {/* Preferred time */}
          <div>
            <label className="text-[11px] font-medium">
              Preferred time window
            </label>
            <input
              type="text"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !isAuthed}
            className="mt-3 w-full rounded-xl bg-[#0A2540] py-2.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Request a strategy session"}
          </button>
        </form>
      </div>
    </aside>
  );
}
