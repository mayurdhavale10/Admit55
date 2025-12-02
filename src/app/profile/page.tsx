// src/app/profile/page.tsx
import ProfileSummaryCard from "./components/ProfileSummaryCard";
import ProfileDetailsPanel from "./components/ProfileDetailsPanel";
import ProfileBookingCard from "./components/ProfileBookingCard";

async function loadProfile() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/profile/me`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json.profile ?? null;
  } catch (err) {
    console.error("Failed to load profile:", err);
    return null;
  }
}

async function loadBookings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/profile/bookings`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json.bookings ?? [];
  } catch (err) {
    console.error("Failed to load bookings:", err);
    return [];
  }
}

export default async function ProfilePage() {
  const profile = await loadProfile();
  const bookings = await loadBookings();

  // Build fallback if no profile returned
  const mergedProfile = {
    name: profile?.name ?? "Future MBA Applicant",
    email: profile?.email ?? "",
    headline: profile?.headline ?? "",
    targetIntake: profile?.targetIntake ?? "",
    myGoal: profile?.myGoal ?? "",
    mentorNotice:
      profile?.mentorNotice ??
      "Important notice from your mentor will appear here.",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="w-full bg-gradient-to-b from-[#0A2540] to-[#1747D6] text-white pb-8">
        <div className="pt-[96px] px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <ProfileSummaryCard profile={mergedProfile} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        
        {/* DETAILS PANEL */}
        <section className="mt-8">
          <ProfileDetailsPanel profile={mergedProfile} />
        </section>

        {/* BOOKING SECTION */}
        <section className="mt-10">
          <ProfileBookingCard
            bookings={bookings}
            profileEmail={mergedProfile.email}
          />
        </section>
      </div>
    </div>
  );
}
