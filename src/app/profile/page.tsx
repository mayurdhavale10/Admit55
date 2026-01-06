// src/app/profile/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "../api/auth/[...nextauth]/route";
import { connectDB, getLoggedInUsersCollection } from "@src/lib/db/loggedinuser/connectDB";
import type { LoggedInUser } from "@src/models/auth/UserLoggedIn";

import ProfileSummaryCard from "./components/ProfileSummaryCard";
import ProfileDetailsPanel from "./components/ProfileDetailsPanel";
import Guidance from "@src/sections/landing/guidance";

import { getQuotaStatusForEmail } from "@src/lib/db/usage/getQuotaStatus";
import type { QuotaStatusResponse } from "@src/lib/db/usage/getQuotaStatus";

import QuotaCard from "./components/QuotaCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  // 1) Require logged-in user
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/api/auth/signin?callbackUrl=/profile");
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

  // 3) Load quota status (server-side)
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

        {/* GUIDANCE SECTION */}
        <section className="mt-10">
          <Guidance />
        </section>
      </div>
    </div>
  );
}