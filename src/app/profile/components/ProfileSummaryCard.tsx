"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

interface EditPayload {
  name?: string;
  headline?: string;
  targetIntake?: string;
  photo?: string;
}

export default function ProfileSummaryCard() {
  const { data: session } = useSession();

  // ------------------------------
  // STATE
  // ------------------------------
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [targetIntake, setTargetIntake] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ------------------------------
  // LOAD EXISTING PROFILE
  // ------------------------------
  const fetchProfile = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const res = await fetch("/api/admin/users/by-email?email=" + session.user.email);
      const json = await res.json();

      const u = json?.user;
      if (u) {
        setName(u.name || "");
        setHeadline(u.headline || "Future MBA Applicant");
        setTargetIntake(u.targetIntake || "");
        setPhoto(u.image || undefined);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }

    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ------------------------------
  // HANDLE PHOTO UPLOAD (Base64)
  // ------------------------------
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.toString();
      if (base64) setPhoto(base64);
    };
    reader.readAsDataURL(file);
  }

  // ------------------------------
  // SAVE CHANGES
  // ------------------------------
  async function handleSave() {
    if (!session?.user?.email) return;

    setSaving(true);
    setMessage(null);

    const payload: EditPayload = {
      name,
      headline,
      targetIntake,
      photo,
    };

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Save failed");

      setMessage("Profile updated successfully.");
    } catch (err: any) {
      console.error(err);
      setMessage("Failed to update profile");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 text-white">
        Loading profile…
      </div>
    );
  }

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-sm text-white">

      {/* TOP SECTION */}
      <div className="flex items-start gap-5">
        {/* PHOTO */}
        <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
          {photo ? (
            <Image src={photo} alt="Profile photo" fill className="object-cover" />
          ) : (
            <span className="text-3xl font-semibold">
              {(name || session?.user?.name || "U").charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1">
            Your Admit55 Profile
          </h1>

          <p className="text-slate-200/80 text-sm">
            {session?.user?.email}
          </p>
        </div>
      </div>

      {/* FORM FIELDS */}
      <div className="mt-8 grid gap-6 sm:grid-cols-3 text-sm">

        {/* Name */}
        <div className="flex flex-col">
          <label className="text-slate-200/90 mb-1">Full Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-white placeholder:text-slate-300 focus:bg-white/20 focus:border-sky-300 focus:outline-none"
            placeholder="Your name"
          />
        </div>

        {/* Headline */}
        <div className="flex flex-col">
          <label className="text-slate-200/90 mb-1">Headline</label>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-white placeholder:text-slate-300 focus:bg-white/20 focus:border-sky-300 focus:outline-none"
            placeholder="e.g. Future MBA Applicant"
          />
        </div>

        {/* Intake */}
        <div className="flex flex-col">
          <label className="text-slate-200/90 mb-1">Target Intake</label>
          <input
            value={targetIntake}
            onChange={(e) => setTargetIntake(e.target.value)}
            className="rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-white placeholder:text-slate-300 focus:bg-white/20 focus:border-sky-300 focus:outline-none"
            placeholder="e.g. Fall 2026"
          />
        </div>
      </div>

      {/* PHOTO UPLOAD */}
      <div className="mt-6 flex flex-col text-sm">
        <label className="text-slate-200/90 mb-1">Profile Photo</label>
        <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-white" />
      </div>

      {/* SAVE BUTTON */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {message && (
        <p className="mt-3 text-xs text-sky-200">{message}</p>
      )}
    </div>
  );
}
