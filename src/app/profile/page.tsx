// src/app/profile/page.tsx

import ProfileSummaryCard from "./components/ProfileSummaryCard";
import ProfileBookingCard from "./components/ProfileBookingCard";
import ProfileDetailsPanel from "./components/ProfileDetailsPanel";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOP HERO — gradient background + profile summary */}
      <div className="bg-gradient-to-b from-[#0A2540] to-[#0D3D91] text-white">
        <div className="pt-[96px] pb-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <ProfileSummaryCard />
        </div>
      </div>

      {/* BOOK A SESSION — white background, glassy card inside */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProfileBookingCard />
        </div>
      </section>

      {/* LOWER SECTION — MBA profile snapshot / future saved artifacts */}
      <div className="pb-12 pt-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
        <ProfileDetailsPanel />
      </div>
    </div>
  );
}
