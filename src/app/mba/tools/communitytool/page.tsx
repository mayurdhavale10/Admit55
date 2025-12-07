"use client";

import LeftSidebar from "./components/LeftSidebar";
import RightSidebar from "./components/RightSidebar";
import PostFeed from "./components/PostFeed";

export default function CommunityToolPage() {
  return (
    <div className="relative overflow-x-hidden h-screen flex flex-col">
      {/* 🔵 BLUE SLATE BEHIND NAVBAR */}
      <div className="fixed top-0 left-0 right-0 h-[84px] bg-[#002b5b] z-40" />

      {/* MAIN PAGE WRAPPER */}
      <div className="pt-[110px] px-4 md:px-8 flex-1 overflow-hidden">
        {/* PAGE TITLE */}
        <h1 className="text-3xl font-bold text-[#002b5b] mb-6">
          MBA Community
        </h1>

        {/* 3–COLUMN LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr_280px] gap-6 h-[calc(100vh-220px)]">
          {/* LEFT SIDEBAR - SCROLLABLE COLUMN */}
          <div className="hidden md:block overflow-y-auto">
            <LeftSidebar />
          </div>

          {/* CENTER FEED - SCROLLABLE ONLY */}
          <div className="overflow-y-auto overflow-x-hidden">
            <PostFeed />
          </div>

          {/* RIGHT SIDEBAR - SCROLLABLE COLUMN */}
          <div className="hidden md:block overflow-y-auto">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
