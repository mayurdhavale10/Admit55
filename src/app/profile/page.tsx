// src/app/profile/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "../api/auth/[...nextauth]/route";
import { connectDB, getLoggedInUsersCollection } from "@src/lib/db/loggedinuser/connectDB";
import type { LoggedInUser } from "@src/models/auth/UserLoggedIn";
import { getBookingsForUser } from "@src/models/bookings/SessionBooking";

import ProfileSummaryCard from "./components/ProfileSummaryCard";
import ProfileDetailsPanel from "./components/ProfileDetailsPanel";
import ProfileBookingCard from "./components/ProfileBookingCard";
import type { Booking } from "./components/ProfileBookingCard";

import { getQuotaStatusForEmail } from "@src/lib/db/usage/getQuotaStatus";
import type { QuotaStatusResponse } from "@src/lib/db/usage/getQuotaStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatLimit(x: number | "inf") {
  return x === "inf" ? "∞" : String(x);
}

function formatRemaining(x: number | "inf") {
  return x === "inf" ? "∞" : String(x);
}

function isZeroRemaining(x: number | "inf") {
  return x !== "inf" && x <= 0;
}

function hasAnyLimitReached(q: QuotaStatusResponse) {
  return q.providers.some((p) => isZeroRemaining(p.remaining));
}

function QuotaCard({ quota }: { quota: QuotaStatusResponse | null }) {
  if (!quota) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Free Usage</h3>
            <p className="text-sm text-slate-600">Quota status unavailable right now.</p>
          </div>
        </div>
      </div>
    );
  }

  const limitReached = hasAnyLimitReached(quota);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Free Usage</h3>
          <p className="text-sm text-slate-600">Track your remaining free runs (per provider).</p>
        </div>

        <div className="text-sm text-slate-600">
          <div>
            Role: <span className="font-semibold text-slate-900">{quota.role ?? "user"}</span>
          </div>
          <div>
            Plan: <span className="font-semibold text-slate-900">{quota.plan ?? "free"}</span>
          </div>
        </div>
      </div>

      {limitReached && (quota.plan ?? "free") !== "pro" && (quota.role ?? "user") !== "admin" && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-sm text-amber-900">
            ⚠️ You’ve reached the free limit for at least one provider.
          </div>
          <Link
            href="/upgradetopro?reason=quota&from=%2Fprofile"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Upgrade to Pro
          </Link>
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Provider</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Used</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Limit</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Remaining</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {quota.providers.map((p) => {
              const out = isZeroRemaining(p.remaining);
              return (
                <tr key={p.provider} className="bg-white">
                  <td className="px-4 py-3 font-semibold text-slate-900">{p.provider}</td>
                  <td className="px-4 py-3 text-slate-700">{p.used}</td>
                  <td className="px-4 py-3 text-slate-700">{formatLimit(p.limit)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-3 py-1 font-semibold",
                        out
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200",
                      ].join(" ")}
                    >
                      {formatRemaining(p.remaining)}
                      {out ? " • limit reached" : ""}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">Updated: {new Date(quota.asOf).toLocaleString()}</p>
    </div>
  );
}

export default async function ProfilePage() {
  // 1) Require logged-in user
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/api/auth/signin?callbackUrl=/profile#booking");
  }

  const email = session.user.email;

  // 2) Load profile from DB
  await connectDB();
  const col = await getLoggedInUsersCollection<LoggedInUser>();
  const existing = await col.findOne({ email });

  const profile = {
    email,
    name: existing?.name ?? session.user.name ?? "Future MBA Applicant",
    image: existing?.image ?? (session.user as any)?.image ?? undefined,
    headline: existing?.headline ?? "",
    targetIntake: existing?.targetIntake ?? "",
    myGoal: existing?.myGoal ?? "",
    mentorNotice: existing?.mentorNotice ?? "Important notice from your mentor will appear here.",
  };

  // 3) Load bookings for this user (latest first)
  const rawBookings = await getBookingsForUser(email);

  const bookings: Booking[] = rawBookings.map((b) => ({
    _id: b._id?.toString() ?? "",
    userEmail: b.userEmail,
    userName: b.userName ?? "",
    userPhone: b.userPhone ?? "",
    topic: b.topic,
    preferredTime: b.preferredTime,
    status: (b.status as Booking["status"]) ?? "pending",
    coachId: b.coachId ?? "",
    coachName: b.coachName ?? "",
    confirmedDate: b.confirmedDate ?? "",
    adminNotes: b.adminNotes ?? "",
    createdAt: b.createdAt?.toISOString?.() ?? "",
  }));

  // 4) Load quota status (server-side)
  let quota: QuotaStatusResponse | null = null;
  try {
    quota = await getQuotaStatusForEmail(email);
  } catch {
    quota = null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <div className="w-full bg-gradient-to-b from-[#0A2540] to-[#1747D6] text-white pb-8">
        <div className="pt-[96px] px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <ProfileSummaryCard profile={profile} />
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* PROFILE DETAILS */}
        <section className="mt-8">
          <ProfileDetailsPanel profile={profile} />
        </section>

        {/* QUOTA DASHBOARD */}
        <section className="mt-8">
          <QuotaCard quota={quota} />
        </section>

        {/* BOOKING */}
        <section id="booking" className="mt-10 scroll-mt-28">
          <ProfileBookingCard bookings={bookings} profileEmail={email} />
        </section>
      </div>
    </div>
  );
}
