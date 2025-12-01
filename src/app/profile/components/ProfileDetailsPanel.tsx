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
  const [form, setForm] = useState({
    name: profile.name || "",
    headline: profile.headline || "",
    targetIntake: profile.targetIntake || "",
    myGoal: profile.myGoal || "",
  });

  const [editing, setEditing] = useState(false);

  async function saveChanges() {
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();
      if (json.success) {
        setEditing(false);
        onProfileUpdated();
      }
    } catch (e) {
      console.error("Profile update failed", e);
    }
  }

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
      <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-xl font-semibold text-[#0F172A]">
          Profile Settings
        </h2>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-1.5 text-xs rounded-lg bg-[#0A2540] text-white hover:bg-[#0D3D91]"
          >
            Edit Profile
          </button>
        ) : null}
      </div>

      {!editing ? (
        // VIEW MODE
        <div className="mt-4 space-y-4 text-sm text-[#111827]">
          <p><b>Name:</b> {form.name || "Not set"}</p>
          <p><b>Headline:</b> {form.headline || "Not set"}</p>
          <p><b>Target Intake:</b> {form.targetIntake || "Not set"}</p>
          <p><b>My Goal:</b> {form.myGoal || "Not set"}</p>
        </div>
      ) : (
        // EDIT MODE
        <div className="mt-6 space-y-4 text-sm">
          {[
            { key: "name", label: "Full Name" },
            { key: "headline", label: "Headline" },
            { key: "targetIntake", label: "Target Intake (e.g., 2026)" },
            { key: "myGoal", label: "My Goal" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-[#0F172A] mb-1">
                {field.label}
              </label>
              <input
                type="text"
                value={(form as any)[field.key]}
                onChange={(e) =>
                  setForm({ ...form, [field.key]: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-[#0A0A0A] placeholder:text-[#444] focus:ring-1 focus:ring-[#0D3D91]"
              />
            </div>
          ))}

          <button
            onClick={saveChanges}
            className="mt-1 inline-flex items-center justify-center rounded-lg bg-[#0A2540] text-white px-4 py-2 text-xs hover:bg-[#0D3D91]"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
