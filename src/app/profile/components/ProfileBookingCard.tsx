"use client";

export default function ProfileBookingCard() {
  return (
    <aside className="rounded-3xl shadow-xl border border-slate-200 bg-white px-4 sm:px-6 py-6 sm:py-7">
      <div className="rounded-2xl bg-teal-50/70 backdrop-blur-xl border border-teal-100/70 shadow-sm p-5 sm:p-6">
        
        <h2 className="text-lg font-semibold text-[#0A2540]">
          Book a Session
        </h2>
        <p className="mt-1 text-xs text-[#0F172A]">
          Request a one-to-one session with an alum coach.
        </p>

        {/* Upcoming session */}
        <div className="mt-4 rounded-2xl bg-white/90 border border-slate-200 p-4 text-xs text-[#0A0A0A]">
          <p className="font-semibold">Upcoming session</p>
          <p className="mt-1">No session booked yet.</p>
          <p className="mt-1 text-[11px] text-[#1A1A1A]">
            Your confirmed session details will appear here.
          </p>
        </div>

        {/* FORM */}
        <form
          className="mt-5 space-y-3 text-xs"
          onSubmit={(e) => {
            e.preventDefault();
            alert(
              "Your session request has been recorded (client-side). In the next phase, this will be routed to the bookings backend and mentor dashboard."
            );
          }}
        >
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-[#0F172A]">
              Primary topic
            </label>
            <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#0A0A0A] focus:ring-1 focus:ring-teal-500">
              <option value="profile">Overall profile strategy</option>
              <option value="school">School shortlisting</option>
              <option value="essays">Essays & storytelling</option>
              <option value="interview">Interview preparation</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-[#0F172A]">
              Preferred time window
            </label>
            <input
              type="text"
              placeholder="e.g., weekends, 7–9 PM IST"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#0A0A0A] placeholder:text-[#444] focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#0D3D91]"
          >
            Request a strategy session
          </button>

          <p className="mt-2 text-[10px] text-[#1A1A1A]">
            We will sync this form with backend scheduling APIs soon.
          </p>
        </form>

      </div>
    </aside>
  );
}
