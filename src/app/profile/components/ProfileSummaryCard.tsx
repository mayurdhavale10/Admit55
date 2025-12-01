// src/app/profile/components/ProfileSummaryCard.tsx
"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";

type ProfileApiResponse = {
  profile?: {
    email: string;
    name?: string | null;
    image?: string | null;
    headline?: string | null;
    targetIntake?: string | null;
  };
  error?: string;
};

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function ProfileSummaryCard() {
  const { data: session, status } = useSession();

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [targetIntake, setTargetIntake] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // LOAD PROFILE FROM BACKEND
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // only fetch if logged in
    if (!session?.user?.email) return;

    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        setProfileError(null);

        const res = await fetch("/api/profile/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | ProfileApiResponse
            | null;
          const msg =
            body?.error || `Failed to load profile (HTTP ${res.status})`;
          setProfileError(msg);
          return;
        }

        const json = (await res.json()) as ProfileApiResponse;
        const p = json.profile;

        const defaultName = p?.name ?? session.user?.name ?? "Future MBA Applicant";
        const defaultHeadline = p?.headline ?? "";
        const defaultTargetIntake = p?.targetIntake ?? "";

        setName(defaultName);
        setHeadline(defaultHeadline);
        setTargetIntake(defaultTargetIntake);
      } catch (err: any) {
        console.error("[ProfileSummaryCard] fetch error", err);
        setProfileError("Could not load profile.");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [session?.user?.email, session?.user?.name]);

  // ---------------------------------------------------------------------------
  // COMPUTED VALUES FOR DISPLAY
  // ---------------------------------------------------------------------------
  const userEmail = session?.user?.email ?? "Sign in to personalise";
  const userImage = (session?.user as any)?.image as string | undefined;

  const readinessLabel = useMemo(() => "Getting started", []);

  const displayName =
    name ||
    session?.user?.name ||
    "Future MBA Applicant";

  // ---------------------------------------------------------------------------
  // SAVE PROFILE (name, headline, targetIntake)
  // ---------------------------------------------------------------------------
  const handleSave = async () => {
    if (!session?.user?.email) {
      setSaveMessage("You need to be signed in to update your profile.");
      return;
    }

    try {
      setSaving(true);
      setSaveMessage(null);

      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          headline: headline.trim() || undefined,
          targetIntake: targetIntake.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg =
          (body && (body.error as string)) ||
          `Failed to save (HTTP ${res.status})`;
        setSaveMessage(msg);
        return;
      }

      setSaveMessage("Profile updated successfully.");
      setIsEditing(false);
    } catch (err: any) {
      console.error("[ProfileSummaryCard] save error", err);
      setSaveMessage("Unexpected error while saving profile.");
    } finally {
      setSaving(false);
      // clear success message after a few seconds
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <section className="grid gap-6">
      <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* LEFT: Avatar + basic info */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-sky-900/60 flex items-center justify-center shrink-0">
              {userImage ? (
                <Image
                  src={userImage}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold">
                  {displayName.charAt(0)}
                </span>
              )}
            </div>

            {/* Text block */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Your Admit55 Profile
              </h1>
              <p className="mt-1 text-sm text-sky-100/85 truncate">
                {displayName} · {userEmail}
              </p>

              {/* Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-emerald-300/60 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100">
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  {readinessLabel}
                </span>

                <span className="inline-flex items-center rounded-full border border-sky-300/60 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-50">
                  MBA journey workspace
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Edit Profile button */}
          <div className="flex sm:flex-col items-center sm:items-end gap-3">
            {status === "authenticated" && (
              <button
                type="button"
                onClick={() => setIsEditing((v) => !v)}
                className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition"
              >
                {isEditing ? "Cancel" : "Edit profile"}
              </button>
            )}
          </div>
        </div>

        {/* Profile stats cards (read-only summary) */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3 text-xs text-slate-100/90">
          {[
            {
              title: "Target intake",
              value: targetIntake || "Not set yet",
              desc: "We will use this to align timelines and deadlines.",
            },
            {
              title: "Primary focus",
              value: "Profile and school strategy",
              desc: "Refined using your snapshot report and coaching.",
            },
            {
              title: "Next recommended step",
              value: "Schedule a strategy session",
              desc: "30–45 minutes with an alum coach to map your path.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white/5 border border-white/10 p-4"
            >
              <p className="font-semibold text-[13px]">{item.title}</p>
              <p className="mt-1 text-sm text-white">{item.value}</p>
              <p className="mt-1 text-[11px] text-slate-100/80">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Inline errors / messages */}
        {profileError && (
          <p className="mt-3 text-xs text-amber-200">
            {profileError}
          </p>
        )}
        {saveMessage && (
          <p className="mt-2 text-xs text-emerald-200">
            {saveMessage}
          </p>
        )}

        {/* EDIT FORM: only when Edit profile is active */}
        {isEditing && (
          <div className="mt-6 rounded-2xl bg-white/8 border border-white/15 p-4 sm:p-5 text-xs text-slate-900">
            <h2 className="text-sm font-semibold text-white mb-3">
              Edit profile
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Full Name */}
              <label className="flex flex-col gap-1 text-[11px] text-slate-100">
                <span className="font-medium">Full Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border border-slate-200/60 bg-white/95 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Your full name"
                />
              </label>

              {/* Target Intake */}
              <label className="flex flex-col gap-1 text-[11px] text-slate-100">
                <span className="font-medium">Target Intake</span>
                <input
                  type="text"
                  value={targetIntake}
                  onChange={(e) => setTargetIntake(e.target.value)}
                  className="rounded-xl border border-slate-200/60 bg-white/95 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="e.g., 2027, 2028"
                />
              </label>

              {/* Headline */}
              <label className="flex flex-col gap-1 text-[11px] text-slate-100 sm:col-span-2">
                <span className="font-medium">Headline</span>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="rounded-xl border border-slate-200/60 bg-white/95 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="e.g., Product Manager, 4+ years in fintech"
                />
              </label>

              {/* Photo change placeholder (optional, not wired yet) */}
              <div className="sm:col-span-2 text-[10px] text-slate-200/90">
                Profile photo upload will be added once storage is wired.
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="rounded-full border border-white/40 bg-transparent px-4 py-1.5 text-[11px] font-medium text-slate-100 hover:bg-white/10 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-white text-[#0A2540] px-4 py-1.5 text-[11px] font-semibold shadow-sm hover:bg-slate-50 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}

        {loadingProfile && (
          <p className="mt-2 text-[11px] text-sky-100/80">
            Loading your profile…
          </p>
        )}
      </div>
    </section>
  );
}
