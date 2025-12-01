"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";

type PrimaryTopic =
  | "profile"
  | "school"
  | "essays"
  | "interview";

export default function ProfileBookingCard() {
  const { data: session } = useSession();

  const [topic, setTopic] = useState<PrimaryTopic>("profile");
  const [timeWindow, setTimeWindow] = useState("");
  const [notes, setNotes] = useState("");

  const [hasRequested, setHasRequested] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // For now, store only in local state (no backend yet)
      setHasRequested(true);
      setSubmittedAt(new Date().toLocaleString());

      alert("Your session request has been recorded (client-side). In the next phase, this will be routed to the bookings backend and mentor dashboard.");
    },
    []
  );

  const primaryTopicLabelMap: Record<PrimaryTopic, string> = {
    profile: "Overall profile strategy",
    school: "School shortlisting",
    essays: "Essays and storytelling",
    interview: "Interview preparation",
  };

  return (
    <aside className="rounded-3xl shadow-xl border border-slate-200 bg-white px-4 sm:px-6 py-6 sm:py-7">
      {/* Glassy Card */}
      <div className="rounded-2xl bg-teal-50/70 backdrop-blur-xl border border-teal-100/70 shadow-sm p-5 sm:p-6 text-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0A2540]">
              Book a Session
            </h2>
            <p className="mt-1 text-xs text-slate-700 max-w-lg">
              Request a one-to-one session with an alum coach. In the next phase, this form will be connected to the live booking and mentor allocation system.
            </p>
          </div>

          {session?.user?.email && (
            <p className="text-[11px] text-slate-600 bg-white/70 border border-slate-200 rounded-full px-3 py-1">
              Requesting as <span className="font-medium">{session.user.email}</span>
            </p>
          )}
        </div>

        {/* Upcoming Session Card */}
        <div className="mt-4 rounded-2xl bg-white/80 border border-slate-200 p-4 text-xs">
          <p className="font-medium text-slate-900">Upcoming session</p>

          {!hasRequested && (
            <>
              <p className="mt-1 text-slate-700">No session booked yet.</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Once you submit a request, your preferred topic and time window will appear here. Later, this will show confirmed date, coach and meeting link.
              </p>
            </>
          )}

          {hasRequested && (
            <div className="mt-2 space-y-1">
              <p className="text-slate-800">
                <span className="font-semibold">Requested topic:</span>{" "}
                {primaryTopicLabelMap[topic]}
              </p>
              {timeWindow && (
                <p className="text-slate-800">
                  <span className="font-semibold">Preferred time window:</span>{" "}
                  {timeWindow}
                </p>
              )}
              {notes && (
                <p className="text-slate-800">
                  <span className="font-semibold">Additional context:</span>{" "}
                  {notes}
                </p>
              )}
              {submittedAt && (
                <p className="text-[11px] text-slate-500">
                  Request captured locally at {submittedAt}.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Booking Form */}
        <form
          className="mt-5 space-y-3 text-xs"
          onSubmit={handleSubmit}
        >
          {/* Primary Topic */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-800">
              Primary topic
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value as PrimaryTopic)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="profile">Overall profile strategy</option>
              <option value="school">School shortlisting</option>
              <option value="essays">Essays and storytelling</option>
              <option value="interview">Interview preparation</option>
            </select>
          </div>

          {/* Preferred Time Window */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-800">
              Preferred time window
            </label>
            <input
              type="text"
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value)}
              placeholder="For example: weekends, 7–9 PM IST"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Optional Notes */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-800">
              Anything specific you want to cover? (optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. 'I am targeting R1 2026 for US programs, want to refine story and school list.'"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#0D3D91] transition"
          >
            Request a strategy session
          </button>

          <p className="mt-2 text-[10px] text-slate-600">
            For now this only stores your preferences on the client side. In the next phase, we will route this to the bookings backend and your mentor dashboard.
          </p>
        </form>
      </div>
    </aside>
  );
}
