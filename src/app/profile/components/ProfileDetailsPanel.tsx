"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

interface DetailsPayload {
  bio?: string;
  workSummary?: string;
  gmat?: string;
  gre?: string;
  achievements?: string;
}

export default function ProfileDetailsPanel() {
  const { data: session } = useSession();

  // ----------------------------------------------
  // STATE
  // ----------------------------------------------
  const [loading, setLoading] = useState(true);

  const [bio, setBio] = useState("");
  const [workSummary, setWorkSummary] = useState("");
  const [gmat, setGmat] = useState("");
  const [gre, setGre] = useState("");
  const [achievements, setAchievements] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ----------------------------------------------
  // LOAD EXISTING PROFILE
  // ----------------------------------------------
  const fetchDetails = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const res = await fetch(`/api/admin/users/by-email?email=${session.user.email}`);
      const json = await res.json();

      const u = json?.user;
      if (u) {
        setBio(u.bio || "");
        setWorkSummary(u.workSummary || "");
        setGmat(u.gmat || "");
        setGre(u.gre || "");
        setAchievements(u.achievements || "");
      }
    } catch (err) {
      console.error("Failed to fetch profile details:", err);
    }

    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // ----------------------------------------------
  // SAVE DETAILS
  // ----------------------------------------------
  async function handleSave() {
    if (!session?.user?.email) return;

    setSaving(true);
    setMessage(null);

    const payload: DetailsPayload = {
      bio,
      workSummary,
      gmat,
      gre,
      achievements,
    };

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");

      setMessage("Profile details updated successfully.");
    } catch (err: any) {
      console.error(err);
      setMessage("Failed to update details.");
    }

    setSaving(false);
  }

  // ----------------------------------------------
  // UI
  // ----------------------------------------------
  if (loading) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6">
        Loading details…
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-slate-900">MBA Profile Details</h2>
      <p className="text-xs text-slate-600 mt-1">
        This information helps coaches understand your background before a session.
      </p>

      {/* FORM */}
      <div className="mt-6 grid gap-6 text-sm">

        {/* Bio */}
        <div>
          <label className="block text-slate-700 font-medium mb-1">Personal Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            placeholder="Write a short bio…"
          />
        </div>

        {/* Work Summary */}
        <div>
          <label className="block text-slate-700 font-medium mb-1">Work Experience Summary</label>
          <textarea
            rows={3}
            value={workSummary}
            onChange={(e) => setWorkSummary(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            placeholder="Your current role, years of experience…"
          />
        </div>

        {/* GMAT */}
        <div>
          <label className="block text-slate-700 font-medium mb-1">GMAT Score (optional)</label>
          <input
            type="text"
            value={gmat}
            onChange={(e) => setGmat(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            placeholder="e.g. 720"
          />
        </div>

        {/* GRE */}
        <div>
          <label className="block text-slate-700 font-medium mb-1">GRE Score (optional)</label>
          <input
            type="text"
            value={gre}
            onChange={(e) => setGre(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            placeholder="e.g. 325"
          />
        </div>

        {/* Achievements */}
        <div>
          <label className="block text-slate-700 font-medium mb-1">Key Achievements</label>
          <textarea
            rows={3}
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            placeholder="Awards, promotions, recognitions…"
          />
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-[#0A2540] text-white font-medium hover:bg-[#0D3D91] transition disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Details"}
        </button>
      </div>

      {message && (
        <p className="mt-2 text-xs text-blue-700">{message}</p>
      )}
    </div>
  );
}
