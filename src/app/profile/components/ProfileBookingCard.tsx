// src/app/profile/components/ProfileBookingCard.tsx
"use client";

import { FormEvent, useState } from "react";

export default function ProfileBookingCard() {
  const [primaryTopic, setPrimaryTopic] = useState("profile");
  const [timeWindow, setTimeWindow] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // For now: store locally + show inline confirmation instead of browser alert
    setSubmitted(true);

    // Later we’ll send this to /api/bookings/create
    // console.log({ primaryTopic, timeWindow });
  };

  return (
    <aside className="rounded-3xl shadow-xl border border-slate-200 bg-white px-4 sm:px-6 py-6 sm:py-7">
      <div className="rounded-2xl bg-teal-50/70 backdrop-blur-xl border border-teal-100/70 shadow-sm p-5 sm:p-6 text-slate-900">
        <h2 className="text-lg font-semibold text-[#0A2540]">
          Book a Session
        </h2>
        <p className="mt-1 text-xs text-slate-700">
          Request a one-to-one session with an alum coach. We will later connect
          this form to the live booking system.
        </p>

        {/* Upcoming Session */}
        <div className="mt-4 rounded-2xl bg-white/80 border border-slate-200 p-4 text-xs">
          <p className="font-medium text-slate-900">Upcoming session</p>
          <p className="mt-1 text-slate-700">
            No session booked yet.
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Once you book, your confirmed date, coach and meeting link will appear here.
          </p>
        </div>

        {/* Success banner (client-side only) */}
        {submitted && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
            Your session request has been recorded on this device. In the next
            phase, this will be sent to the bookings backend and mentor dashboard.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3 text-xs">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-800">
              Primary topic
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              value={primaryTopic}
              onChange={(e) => setPrimaryTopic(e.target.value)}
            >
              <option value="profile">Overall profile strategy</option>
              <option value="school">School shortlisting</option>
              <option value="essays">Essays and storytelling</option>
              <option value="interview">Interview preparation</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-800">
              Preferred time window
            </label>
            <input
              type="text"
              placeholder="For example: weekends, 7–9 PM IST"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#0D3D91] transition"
          >
            Request a strategy session
          </button>

          <p className="mt-2 text-[10px] text-slate-600">
            For now this only stores your preferences on the client side. In the
            next phase, we will route this to the bookings backend and your mentor dashboard.
          </p>
        </form>
      </div>
    </aside>
  );
}
