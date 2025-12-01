"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";

export default function ProfileSummaryCard({
  profile,
}: {
  profile: {
    name?: string;
    email: string;
    image?: string;
    headline?: string;
    targetIntake?: string;
    myGoal?: string;
    mentorNotice?: string;
  };
}) {
  const { data: session } = useSession();

  const userName =
    profile?.name || session?.user?.name || "Future MBA Applicant";
  const userEmail = profile?.email || session?.user?.email || "";
  const headline = profile?.headline || "Future MBA Applicant";
  const targetIntake = profile?.targetIntake || "Not set yet";
  const myGoal = profile?.myGoal || "No goal added yet";
  const mentorNotice = profile?.mentorNotice || "No new notices";

  // Avatar letter
  const avatarLetter = userName?.charAt(0)?.toUpperCase() ?? "A";

  return (
    <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-start gap-4">

        {/* Avatar — letter only */}
        <div className="relative h-16 w-16 rounded-2xl bg-sky-900/70 flex items-center justify-center shrink-0 text-white text-2xl font-semibold">
          {avatarLetter}
        </div>

        {/* Text + badges */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Your Admit55 Profile
          </h1>

          <p className="mt-1 text-sm text-sky-100/85 truncate">
            {userName} · {userEmail}
          </p>

          {/* Headline */}
          <p className="mt-2 text-xs text-sky-200">{headline}</p>

          {/* Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-emerald-300/60 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Getting started
            </span>

            <span className="inline-flex items-center rounded-full border border-sky-300/60 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-50">
              MBA journey workspace
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3 text-xs text-slate-100/90">

        {/* Target Intake */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="font-semibold text-[13px] text-white">Target intake</p>
          <p className="mt-1 text-sm text-white">{targetIntake}</p>
          <p className="mt-1 text-[11px] text-slate-100/80">
            We will use this to align timelines and deadlines.
          </p>
        </div>

        {/* My Goal */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="font-semibold text-[13px] text-white">My Goal</p>
          <p className="mt-1 text-sm text-white">{myGoal}</p>
          <p className="mt-1 text-[11px] text-slate-100/80">
            Your long-term plan for MBA or career.
          </p>
        </div>

        {/* Mentor Notice */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="font-semibold text-[13px] text-white">
            Notice from mentor
          </p>
          <p className="mt-1 text-sm text-white">{mentorNotice}</p>
          <p className="mt-1 text-[11px] text-slate-100/80">
            Important updates shared by your assigned coach.
          </p>
        </div>
      </div>
    </div>
  );
}
