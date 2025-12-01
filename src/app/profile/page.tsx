"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import ProfileSummaryCard from "./components/ProfileSummaryCard";
import ProfileDetailsPanel from "./components/ProfileDetailsPanel";
import ProfileBookingCard from "./components/ProfileBookingCard";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);

  // Load profile from DB
  useEffect(() => {
    async function load() {
      if (!session?.user?.email) return;

      const res = await fetch("/api/profile/update", { method: "POST" });
      const data = await res.json();

      if (data?.user) {
        setProfile(data.user);
      } else {
        // fallback minimal profile
        setProfile({
          name: session.user.name,
          email: session.user.email,
          headline: "",
          targetIntake: "",
          myGoal: "",
          mentorNotice: "Important notice from your mentor will appear here.",
        });
      }
    }
    load();
  }, [session]);

  const handleProfileUpdated = () => {
    // reload profile when updated
    if (!session?.user?.email) return;

    fetch("/api/profile/update", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setProfile(data.user);
      });
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Loading profile...
      </div>
    );
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

        {/* DETAIL PANEL */}
        <section className="mt-8">
          <ProfileDetailsPanel
            profile={profile}
            onProfileUpdated={handleProfileUpdated}
          />
        </section>

        {/* BOOKING */}
        <section className="mt-10">
          <ProfileBookingCard />
        </section>

      </div>
    </div>
  );
}
