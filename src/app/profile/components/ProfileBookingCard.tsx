"use client";

import { useState } from "react";

export default function ProfileBookingCard() {
  const [topic, setTopic] = useState("profile");
  const [preferredTime, setPreferredTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  async function submitBooking(e: any) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/bookings/create", {
      method: "POST",
      body: JSON.stringify({
        topic,
        preferredTime,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      alert("Failed to submit session request");
      return;
    }

    setSuccessMsg("Your session request has been submitted!");
  }

  return (
    <aside className="rounded-3xl shadow-xl border border-gray-300 bg-white dark:bg-[#0A0A0A] dark:border-gray-700 px-4 sm:px-6 py-6 sm:py-7">

      <div className="rounded-2xl bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 sm:p-6">

        <h2 className="text-lg font-semibold text-[#0A2540] dark:text-white">
          Book a Session
        </h2>
        <p className="mt-1 text-xs text-black dark:text-gray-200">
          Request a one-to-one session with an alum coach.
        </p>

        {/* Success message */}
        {successMsg && (
          <p className="mt-3 text-sm font-medium text-green-600 dark:text-green-400">
            {successMsg}
          </p>
        )}

        {/* Form */}
        <form onSubmit={submitBooking} className="mt-5 space-y-3 text-xs">

          {/* Topic */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-black dark:text-white">
              Primary topic
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A1A] px-3 py-2 text-xs text-black dark:text-white focus:ring-1 focus:ring-teal-500"
            >
              <option value="profile">Overall profile strategy</option>
              <option value="school">School shortlisting</option>
              <option value="essays">Essays & storytelling</option>
              <option value="interview">Interview preparation</option>
            </select>
          </div>

          {/* Preferred time */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-black dark:text-white">
              Preferred time window
            </label>
            <input
              type="text"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              placeholder="e.g., weekends, 7–9 PM IST"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A1A1A] px-3 py-2 text-xs text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-300 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#0D3D91] disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Request a strategy session"}
          </button>

          <p className="mt-2 text-[10px] text-black dark:text-gray-300">
            Your request will be reviewed by an admin.
          </p>
        </form>

      </div>
    </aside>
  );
}
