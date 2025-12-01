"use client";

import { useState } from "react";

export default function ProfileDetailsPanel({
  profile,
  onProfileUpdated,
}: {
  profile: {
    name?: string;
    headline?: string;
    targetIntake?: string;
    myGoal?: string;
  };
  onProfileUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(profile?.name || "");
  const [headline, setHeadline] = useState(profile?.headline || "");
  const [targetIntake, setTargetIntake] = useState(profile?.targetIntake || "");
  const [myGoal, setMyGoal] = useState(profile?.myGoal || "");

  async function saveProfile() {
    try {
      setSaving(true);

      const res = await fetch("/api/profile/update", {
        method: "POST",
        body: JSON.stringify({
          name,
          headline,
          targetIntake,
          myGoal,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert("Failed to save profile.");
        return;
      }

      onProfileUpdated();
      setOpen(false);
    } catch (error) {
      alert("Error saving profile.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white border border-gray-300 shadow-sm p-6 sm:p-8 dark:bg-[#0A0A0A] dark:border-gray-700">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold text-black dark:text-white">
          Profile Details
        </h2>

        <button
          onClick={() => setOpen((v) => !v)}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0A2540] text-white hover:bg-[#0D3D91] transition shadow-sm"
        >
          {open ? "Close" : "Edit Profile"}
        </button>
      </div>

      {/* Expandable */}
      {open && (
        <div className="mt-6 space-y-4 text-sm">

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-black dark:text-white">
              Full Name
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-400 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 dark:bg-[#1A1A1A] dark:border-gray-600 dark:text-white dark:placeholder:text-gray-300"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          {/* Headline */}
          <div>
            <label className="block text-xs font-medium text-black dark:text-white">
              Headline
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-400 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 dark:bg-[#1A1A1A] dark:border-gray-600 dark:text-white dark:placeholder:text-gray-300"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Aspiring MBA Candidate"
            />
          </div>

          {/* Target Intake */}
          <div>
            <label className="block text-xs font-medium text-black dark:text-white">
              Target Intake
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-400 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 dark:bg-[#1A1A1A] dark:border-gray-600 dark:text-white dark:placeholder:text-gray-300"
              value={targetIntake}
              onChange={(e) => setTargetIntake(e.target.value)}
              placeholder="e.g. 2027"
            />
          </div>

          {/* My Goal */}
          <div>
            <label className="block text-xs font-medium text-black dark:text-white">
              My Goal
            </label>
            <textarea
              className="mt-1 w-full rounded-xl border border-gray-400 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 dark:bg-[#1A1A1A] dark:border-gray-600 dark:text-white dark:placeholder:text-gray-300"
              value={myGoal}
              onChange={(e) => setMyGoal(e.target.value)}
              placeholder="e.g. Move to consulting; join MBB; get into INSEAD"
              rows={3}
            />
          </div>

          <button
            disabled={saving}
            onClick={saveProfile}
            className="mt-4 inline-flex items-center rounded-xl bg-[#0A2540] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0D3D91] transition shadow-sm disabled:opacity-70"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
