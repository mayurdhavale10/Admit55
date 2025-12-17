"use client";

import React, { useMemo } from "react";
import type { StepComponentProps } from "../registry";

// ✅ Right-side preview that renders ConsultingClassicTemplate
import ConsultingClassicPreview from "../../../components/resume-templates/consulting-classic/ConsultingClassicPreview";

// ✅ Default blue-bar items (same style as your template defaults)
const DEFAULT_HIGHLIGHTS = [
  "Cars24 Arabia (UAE)",
  "Alvarez & Marsal (India)",
  "IIM Ahmedabad",
  "Chartered Accountant",
  "Grant Thornton Bharat LLP",
];

function clampTopAchievements(items?: string[]) {
  const arr = Array.isArray(items) ? items : [];
  // Always show exactly 5 inputs
  return Array.from({ length: 5 }).map((_, i) => arr[i] ?? "");
}

export default function Step1_BasicInfo_ConsultingClassic({
  draft,
  setDraft,
}: StepComponentProps) {
  const basic = draft?.resume?.basicInfo ?? {};

  const achievements = clampTopAchievements(basic.metaBar);

  const updateBasic = (patch: Partial<typeof basic>) => {
    setDraft({
      ...draft,
      resume: {
        ...(draft.resume ?? {}),
        basicInfo: {
          ...(draft.resume?.basicInfo ?? {}),
          ...patch,
        },
      },
    });
  };

  const updateAchievementIndex = (idx: number, value: string) => {
    const next = [...achievements];
    next[idx] = value;
    updateBasic({ metaBar: next });
  };

  // ✅ Map draft -> preview props (ONLY basic + blue bar)
  const previewData = useMemo(() => {
    const fullName = `${basic.firstName ?? ""} ${basic.lastName ?? ""}`.trim();

    const raw = Array.isArray(basic.metaBar) ? basic.metaBar : [];
    const cleaned = raw.map((s) => (s ?? "").trim()).filter(Boolean);

    // ✅ Fallback to defaults if user hasn't entered any achievements
    const metaBarForPreview =
      cleaned.length > 0 ? cleaned.slice(0, 5) : DEFAULT_HIGHLIGHTS;

    return {
      header: {
        name: fullName || "Your Name",
        gender: (basic.gender ?? "").toString(),
        university: (basic.university ?? "").toString(), // ✅ REQUIRED by ResumePreviewData
        email: (basic.email ?? "").toString(),
        phone: (basic.phone ?? "").toString(),
        location: (basic.location ?? "").toString(),
      },
      metaBar: metaBarForPreview,
    };
  }, [
    basic.firstName,
    basic.lastName,
    basic.gender,
    basic.university, // ✅ include in deps
    basic.email,
    basic.phone,
    basic.location,
    basic.metaBar,
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT: Inputs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Step 1 — Basic Info
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Fill these and you’ll see your exact Consulting Classic template
            update on the right.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="First Name"
              value={basic.firstName ?? ""}
              onChange={(e) => updateBasic({ firstName: e.target.value })}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Last Name"
              value={basic.lastName ?? ""}
              onChange={(e) => updateBasic({ lastName: e.target.value })}
            />

            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Gender"
              value={basic.gender ?? ""}
              onChange={(e) => updateBasic({ gender: e.target.value })}
            />

            {/* ✅ NEW: University / Institute */}
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="University / Institute"
              value={basic.university ?? ""}
              onChange={(e) => updateBasic({ university: e.target.value })}
            />

            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Location"
              value={basic.location ?? ""}
              onChange={(e) => updateBasic({ location: e.target.value })}
            />

            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Email"
              value={basic.email ?? ""}
              onChange={(e) => updateBasic({ email: e.target.value })}
            />

            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 md:col-span-2"
              placeholder="Phone"
              value={basic.phone ?? ""}
              onChange={(e) => updateBasic({ phone: e.target.value })}
            />
          </div>

          {/* ✅ RENAMED: Achievements */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Your Top Achievements (up to 5)
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Add your biggest highlights (companies, universities,
                credentials, etc.)
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2">
              {achievements.map((v, idx) => (
                <input
                  key={idx}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder={`Achievement ${idx + 1}`}
                  value={v}
                  onChange={(e) => updateAchievementIndex(idx, e.target.value)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Live Preview (Consulting Classic)
            </div>
          </div>

          <ConsultingClassicPreview data={previewData} />
        </div>
      </div>
    </div>
  );
}
