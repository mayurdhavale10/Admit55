// src/app/profile/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import ProfileSummaryCard from "./components/ProfileSummaryCard";
import ProfileDetailsPanel from "./components/ProfileDetailsPanel";
import ProfileBookingCard from "./components/ProfileBookingCard";

type Profile = {
  name?: string;
  email: string;
  image?: string;
  headline?: string;
  targetIntake?: string;
  myGoal?: string;
  mentorNotice?: string;
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Helper to build a fallback profile (used for guests or if API fails)
  function buildFallbackProfile(): Profile {
    return {
      name: session?.user?.name ?? "Future MBA Applicant",
      email: session?.user?.email ?? "Sign in to personalise",
      image: (session?.user as any)?.image ?? undefined,
      headline: "",
      targetIntake: "",
      myGoal: "",
      mentorNotice: "Important notice from your mentor will appear here.",
    };
  }

  // Load profile from DB (or fallback to session)
  useEffect(() => {
    // If not logged in, just build a client-side profile and stop
    if (!session) {
      setProfile(buildFallbackProfile());
      return;
    }

    if (!session.user?.email) {
      setProfile(buildFallbackProfile());
      return;
    }

    const load = async () => {
      try {
        const res = await fetch("/api/profile/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          // API error → fall back to session-only profile
          console.error(
            "Failed to load profile from /api/profile/me",
            await res.text(),
          );
          setProfile(buildFallbackProfile());
          return;
        }

        const data = await res.json();
        const p = data?.profile ?? {};

        const merged: Profile = {
          email:
            p.email ??
            session?.user?.email ??
            "Sign in to personalise",
          name:
            p.name ??
            session?.user?.name ??
            "Future MBA Applicant",
          image: p.image ?? (session?.user as any)?.image ?? undefined,
          headline: p.headline ?? "",
          targetIntake: p.targetIntake ?? "",
          myGoal: p.myGoal ?? "",
          mentorNotice:
            p.mentorNotice ??
            "Important notice from your mentor will appear here.",
        };

        setProfile(merged);
      } catch (err) {
        console.error("Error loading profile:", err);
        setProfile(buildFallbackProfile());
      }
    };

    load();
  }, [session]);

  // Called after ProfileDetailsPanel saves via /api/profile/update
  const handleProfileUpdated = async () => {
    if (!session?.user?.email) {
      setProfile(buildFallbackProfile());
      return;
    }

    try {
      const res = await fetch("/api/profile/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        console.error(
          "Failed to reload profile from /api/profile/me",
          await res.text(),
        );
        setProfile(buildFallbackProfile());
        return;
      }

      const data = await res.json();
      const p = data?.profile ?? {};

      const merged: Profile = {
        email:
          p.email ??
          session?.user?.email ??
          "Sign in to personalise",
        name:
          p.name ??
          session?.user?.name ??
          "Future MBA Applicant",
        image: p.image ?? (session?.user as any)?.image ?? undefined,
        headline: p.headline ?? "",
        targetIntake: p.targetIntake ?? "",
        myGoal: p.myGoal ?? "",
        mentorNotice:
          p.mentorNotice ??
          "Important notice from your mentor will appear here.",
      };

      setProfile(merged);
    } catch (err) {
      console.error("Error reloading profile:", err);
      setProfile(buildFallbackProfile());
    }
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
