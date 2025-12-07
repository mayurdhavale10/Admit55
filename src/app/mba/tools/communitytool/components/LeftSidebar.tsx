"use client";

import React from "react";
import PostComposer from "./PostComposer";

export default function LeftSidebar() {
  // Temporary handler – later we’ll wire this to /api/mba/community/posts
  const handleCreatePost = async (data: {
    title: string;
    body: string;
    imageUrl?: string | null;
  }) => {
    console.log("[Community] New post (stub, not saved yet):", data);
    // Later: call your API and refresh the feed
    alert("Posting soon! Backend for community posts is not wired yet.");
  };

  return (
    <aside className="space-y-6">
      {/* CREATE POST CARD (TOP) */}
      <div className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
        <div className="px-4 pt-4 pb-2 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-[#002b5b]">
            Create a Post
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Share your MBA journey, doubts, wins, or application updates.
          </p>
        </div>

        <div className="p-4">
          <PostComposer onSubmit={handleCreatePost} />
        </div>
      </div>

      {/* QUICK ACTIONS / TOOLS */}
      <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
        <div className="px-4 pt-4 pb-2 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-[#002b5b]">
            Shortcuts & Tools
          </h3>
        </div>
        <div className="p-4 space-y-3 text-xs">
          <button
            type="button"
            className="w-full text-left rounded-lg border border-sky-100 bg-sky-50/70 px-3 py-2 font-medium text-sky-900 hover:bg-sky-100 transition"
          >
            💼 View my MBA Profile Snapshot
          </button>
          <button
            type="button"
            className="w-full text-left rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 font-medium text-emerald-900 hover:bg-emerald-100 transition"
          >
            🎯 Open B-School Match
          </button>
        </div>
      </div>

      {/* COMMUNITY GUIDELINES */}
      <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
        <div className="px-4 pt-4 pb-2 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-[#002b5b]">
            Community Guidelines
          </h3>
        </div>
        <div className="p-4 space-y-2 text-xs text-slate-600">
          <p>✅ Be respectful and constructive.</p>
          <p>✅ Share specific context when asking for help.</p>
          <p>🚫 No spam, promotions, or abusive language.</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Moderation: Admins can remove posts/comments that violate these
            rules.
          </p>
        </div>
      </div>
    </aside>
  );
}
