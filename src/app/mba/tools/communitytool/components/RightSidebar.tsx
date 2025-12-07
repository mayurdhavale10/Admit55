"use client";

import { User, TrendingUp, MessageSquare, Sparkles } from "lucide-react";

export default function RightSidebar() {
  return (
    <aside className="space-y-6">

      {/* ------------------------------ */}
      {/* COMMUNITY STATS */}
      {/* ------------------------------ */}
      <div
        className="
          p-4 rounded-2xl shadow-sm backdrop-blur-md
          bg-[rgba(200,255,255,0.22)] border border-[rgba(200,255,255,0.35)]
        "
      >
        <h3 className="text-sm font-semibold text-[#0a1b3f] mb-3">
          MBA Community Stats
        </h3>

        <div className="space-y-3 text-[#0a1b3f]">
          <StatItem label="Total Posts" value="1,284" />
          <StatItem label="Active Users" value="346" />
          <StatItem label="Posts Today" value="42" />
        </div>
      </div>

      {/* ------------------------------ */}
      {/* TOP CONTRIBUTORS */}
      {/* ------------------------------ */}
      <div
        className="
          p-4 rounded-2xl shadow-sm backdrop-blur-md
          bg-[rgba(200,255,255,0.22)] border border-[rgba(200,255,255,0.35)]
        "
      >
        <h3 className="text-sm font-semibold text-[#0a1b3f] mb-3">
          Top Contributors
        </h3>

        <div className="space-y-3">
          <Contributor name="Rohan" score={98} />
          <Contributor name="Sneha" score={87} />
          <Contributor name="Karan" score={82} />
        </div>
      </div>

      {/* ------------------------------ */}
      {/* FEATURED TOPICS */}
      {/* ------------------------------ */}
      <div
        className="
          p-4 rounded-2xl shadow-sm backdrop-blur-md
          bg-[rgba(200,255,255,0.22)] border border-[rgba(200,255,255,0.35)]
        "
      >
        <h3 className="text-sm font-semibold text-[#0a1b3f] mb-3">
          Featured Topics
        </h3>

        <div className="space-y-2 text-[#0a1b3f] text-sm">
          <Topic label="ISB 2026 Admissions" />
          <Topic label="GMAT 700+ Strategies" />
          <Topic label="Profile Evaluation Tips" />
          <Topic label="Scholarships & Funding" />
        </div>
      </div>

      {/* ------------------------------ */}
      {/* COMMUNITY RULES */}
      {/* ------------------------------ */}
      <div
        className="
          p-4 rounded-2xl shadow-sm backdrop-blur-md
          bg-[rgba(200,255,255,0.22)] border border-[rgba(200,255,255,0.35)]
        "
      >
        <h3 className="text-sm font-semibold text-[#0a1b3f] mb-3">
          Rules
        </h3>

        <ul className="text-xs text-[#0a1b3f] space-y-2">
          <li>• Be respectful and supportive</li>
          <li>• No spam or marketing links</li>
          <li>• Keep posts MBA-focused</li>
          <li>• No fake profiles or misleading info</li>
        </ul>
      </div>
    </aside>
  );
}

/* -------------------------------- */
/* SMALL COMPONENTS (Re-usable)     */
/* -------------------------------- */

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Contributor({
  name,
  score,
}: {
  name: string;
  score: number;
}) {
  return (
    <div className="flex items-center justify-between text-sm text-[#0a1b3f]">
      <div className="flex items-center gap-2">
        <User size={16} />
        {name}
      </div>
      <span className="font-semibold">{score}</span>
    </div>
  );
}

function Topic({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm hover:font-semibold cursor-pointer transition">
      <Sparkles size={14} /> {label}
    </div>
  );
}
