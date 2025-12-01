"use client";

import { useState } from "react";

export default function ProfileBookingCard() {
  const [topic, setTopic] = useState("profile");
  const [timeWindow, setTimeWindow] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    setSubmitted(true);

    // In the next sprint, replace this with:
    // await fetch("/api/bookings/create", { method: "POST", body: JSON.stringify({...}) })
  }

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-lg p-6 sm:p-8">

      {/* Heading */}
      <h2 className="text-xl font-semibold text-[#0A2540] tracking-tight">
        Book a Session
      </h2>
      <p className="mt-1 text-sm text-slate-600 max-w-lg">
        Request a one-to-one strategy session with an alum coach.
      </p>

      {/* Upcoming */}
      <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-sm">
        <p className="font-medium text-slate-900 text-sm">Upcoming session</p>

        <p className="mt-1 text-sm text-slate-700">
          No session booked yet.
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Once you book, your date, coach and meeting link will appear here.
        </p>
      </div>

      {/* FORM */}
      <div className="mt-8 rounded-3xl bg-white/60 backdrop-blur-xl border border-slate-300/40 p-5 sm:p-6 shadow-inner">

        {/* Topic */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Primary topic
          </label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="profile">Overall profile strategy</option>
            <option value="school">School shortlisting</option>
            <option value="essays">Essays / storytelling</option>
            <option value="interview">Interview preparation</option>
          </select>
        </div>

        {/* Time window */}
        <div className="mt-4 space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Preferred time window
          </label>
          <input
            type="text"
            placeholder="e.g. weekends, 7–9 PM IST"
            value={timeWindow}
            onChange={(e) => setTimeWindow(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          className="mt-5 w-full rounded-xl bg-[#0A2540] text-white text-sm font-semibold px-4 py-2.5 shadow-md hover:bg-[#0D3D91] transition"
        >
          Request a strategy session
        </button>

        {/* Inline success message */}
        {submitted && (
          <p className="mt-3 text-xs text-emerald-600 font-medium">
            ✔ Your session request has been saved locally.  
            Backend booking integration will be added next.
          </p>
        )}
      </div>
    </div>
  );
}
