"use client";

import Image from "next/image";

export default function ProfileSummaryCard({ profile }: {
  profile: {
    name?: string;
    email: string;
    headline?: string;
    targetIntake?: string;
    myGoal?: string;
    mentorNotice?: string;
  };
}) {
  const {
    name = "Future MBA Applicant",
    email,
    headline,
    targetIntake,
    myGoal,
    mentorNotice,
  } = profile;

  const avatarLetter = name.charAt(0).toUpperCase();

  return (
    <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-sm text-white">
      {/* Header */}
      <div className="flex items-start gap-4">
        
        {/* Avatar */}
        <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-sky-900/70 flex items-center justify-center shrink-0">
          <span className="text-2xl font-semibold text-white">
            {avatarLetter}
          </span>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Your Admit55 Profile
          </h1>
          <p className="mt-1 text-sm text-white/95 truncate">
            {name} · {email}
          </p>

          {/* Badges */}
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

      {/* Stats / Info Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3 text-xs">

        {/* Target Intake */}
        <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
          <p className="font-semibold text-[13px]">Target intake</p>
          <p className="mt-1 text-sm text-white">
            {targetIntake || "Not set yet"}
          </p>
          <p className="mt-1 text-[11px] text-white/85">
            We will use this to align timelines and deadlines.
          </p>
        </div>

        {/* My Goal */}
        <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
          <p className="font-semibold text-[13px]">My Goal</p>
          <p className="mt-1 text-sm text-white">
            {myGoal || "Not defined"}
          </p>
          <p className="mt-1 text-[11px] text-white/85">
            Your personal MBA direction and motivation.
          </p>
        </div>

        {/* Mentor Notice */}
        <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
          <p className="font-semibold text-[13px]">Notice from Mentor</p>
          <p className="mt-1 text-sm text-white">
            {mentorNotice || "No important notices yet."}
          </p>
          <p className="mt-1 text-[11px] text-white/85">
            Your mentor can update this in real time.
          </p>
        </div>

      </div>
    </div>
  );
}
