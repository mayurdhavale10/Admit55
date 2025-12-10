// src/app/profile/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "../api/auth/[...nextauth]/route";
import {
  connectDB,
  getLoggedInUsersCollection,
} from "@src/lib/db/loggedinuser/connectDB";
import type { LoggedInUser } from "@src/models/auth/UserLoggedIn";
import { getBookingsForUser } from "@src/models/bookings/SessionBooking";

import ProfileSummaryCard from "./components/ProfileSummaryCard";
import ProfileDetailsPanel from "./components/ProfileDetailsPanel";
import ProfileBookingCard from "./components/ProfileBookingCard";
import type { Booking } from "./components/ProfileBookingCard";

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
    mentorNotice:
      existing?.mentorNotice ??
      "Important notice from your mentor will appear here.",
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

        {/* BOOKING CARD — UPDATED WITH ID */}
        <section id="booking" className="mt-10 scroll-mt-28">
          <ProfileBookingCard bookings={bookings} profileEmail={email} />
        </section>

      </div>
    </div>
  );
}
