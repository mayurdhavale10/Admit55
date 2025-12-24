// src/app/mba/tools/resumewriter/components/steps/tech-vc1/Step4_Education.tsx
"use client";

import React, { useMemo } from "react";
import TechVC1Preview from "../../resume-templates/tech-vc1/TechVC1Preview";

type TechVC1EducationItem = {
  id?: string;
  dateRange?: string;
  degreeLine: string;
  institute?: string;
  meta?: string;
};

type Props = {
  draft: any;
  setDraft: (next: any) => void;
  onNext?: () => void;
  onPrev?: () => void;
};

function cleanStr(v: unknown) {
  return (v ?? "").toString().trim();
}
function safeArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function ensureResumeRoot(draft: any) {
  return { ...(draft ?? {}), resume: { ...(draft?.resume ?? {}) } };
}

const DEFAULT_EDU: TechVC1EducationItem[] = [
  {
    id: "edu-1",
    dateRange: "2014-07 - 2018-05",
    degreeLine: "Bachelor of Technology: Computer Science Engineering",
    institute: "DIT University - Dehradun",
    meta: "GPA: 7.4/10",
  },
];

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Math.random().toString(16).slice(2)}`;
}

function GraduationIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 8l9-4 9 4-9 4-9-4Z"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M21 10v6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M7 12v5c0 .5 2.2 3 5 3s5-2.5 5-3v-5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-11 w-11 shrink-0 rounded-md bg-[#2f3b52] flex items-center justify-center">
      {children}
    </div>
  );
}

export default function Step4_Education({ draft, setDraft, onNext, onPrev }: Props) {
  const education: TechVC1EducationItem[] = useMemo(() => {
    const r = draft?.resume ?? {};
    const raw = r.techVC1Education ?? r.vc1Education ?? r.education ?? r.educations ?? [];
    const arr = safeArray<any>(raw).map((e) => ({
      id: cleanStr(e?.id) || uid(),
      dateRange: cleanStr(e?.dateRange ?? e?.dates ?? ""),
      degreeLine: cleanStr(e?.degreeLine ?? e?.degree ?? e?.program ?? ""),
      institute: cleanStr(e?.institute ?? e?.school ?? e?.university ?? ""),
      meta: cleanStr(e?.meta ?? e?.gpa ?? e?.notes ?? ""),
    }));
    return arr.length ? arr : DEFAULT_EDU;
  }, [draft]);

  function setEducation(next: TechVC1EducationItem[]) {
    const nextDraft = ensureResumeRoot(draft);
    nextDraft.resume.techVC1Education = next;
    setDraft(nextDraft);
  }

  function updateItem(i: number, patch: Partial<TechVC1EducationItem>) {
    const next = [...education];
    next[i] = { ...next[i], ...patch };
    setEducation(next);
  }

  function addItem() {
    setEducation([
      ...education,
      {
        id: `edu-${Date.now()}`,
        dateRange: "YYYY-MM - YYYY-MM",
        degreeLine: "Degree / Program",
        institute: "Institute / University",
        meta: "GPA / Honors (optional)",
      },
    ]);
  }

  function removeItem(i: number) {
    setEducation(education.filter((_, idx) => idx !== i));
  }

  function moveItem(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= education.length) return;
    const next = [...education];
    [next[i], next[j]] = [next[j], next[i]];
    setEducation(next);
  }

  const previewData = useMemo(() => {
    const r = draft?.resume ?? {};
    const h = r.techVC1Header ?? {};
    const s = r.techVC1Summary ?? {};
    const summaryText =
      cleanStr(s?.text) || cleanStr(r.summary) || cleanStr(r.techSummary?.text) || "";

    const header = {
      name: cleanStr(h?.name) || cleanStr(h?.fullName) || "Your Name",
      title: cleanStr(h?.title) || "Software Engineer",
      addressLabel: "Address",
      address: cleanStr(h?.address) || "Dehradun, India 248001",
      phoneLabel: "Phone",
      phone: cleanStr(h?.phone),
      emailLabel: "E-mail",
      email: cleanStr(h?.email),
      linkedinLabel: "LinkedIn",
      linkedin: cleanStr(h?.linkedin) || cleanStr(h?.links?.linkedin),
      githubLabel: "GitHub",
      github: cleanStr(h?.github) || cleanStr(h?.links?.github),
      wwwLabel: "WWW",
      portfolio: cleanStr(h?.portfolio) || cleanStr(h?.links?.portfolio),
      wwwHint: "Bold Profile",
    };

    const experience = safeArray(
      r.techVC1Experience ?? r.vc1Experience ?? r.techExperience ?? r.experience ?? r.experiences
    ).map((e: any) => ({
      dateRange: cleanStr(e?.dateRange ?? e?.dates ?? ""),
      role: cleanStr(e?.role ?? e?.title ?? e?.position ?? "Role"),
      company: cleanStr(e?.company ?? ""),
      location: cleanStr(e?.location ?? ""),
      bullets: safeArray<string>(e?.bullets ?? e?.points ?? []).map((b) => (b ?? "").toString()),
    }));

    const skills = r.techVC1Skills ?? r.vc1Skills ?? r.skills ?? undefined;
    const achievements = r.techVC1Achievements ?? r.achievements ?? [];

    return {
      header,
      summary: summaryText,
      experience,
      skills,
      education,
      achievements,
      page: 2, // show the Skills/Education/Accolades page in preview
    };
  }, [draft, education]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
      {/* Left */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconTile>
              <GraduationIcon />
            </IconTile>
            <div>
              <div className="text-[#2f3b52] text-[20px] font-bold">Education</div>
              <div className="mt-1 text-slate-600 text-[13px]">
                Add your degrees exactly like the template (date range + degree line + institute + meta).
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="rounded-xl bg-[#2f3b52] px-4 py-2 text-[13px] font-semibold text-white hover:opacity-95"
          >
            + Add education
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {education.map((it, idx) => (
            <div
              key={it.id ?? idx}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-[16px] leading-tight">
                      {cleanStr(it.degreeLine) || "Degree / Program"}
                    </div>
                    <div className="mt-1 text-slate-600 text-[12.5px]">
                      {cleanStr(it.institute) || "Institute / University"}
                    </div>
                    {cleanStr(it.meta) && (
                      <div className="mt-1 text-slate-600 text-[12px]">{cleanStr(it.meta)}</div>
                    )}
                  </div>
                  <div className="text-slate-600 text-[12px] whitespace-nowrap">
                    {cleanStr(it.dateRange) || "YYYY-MM - YYYY-MM"}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, -1)}
                    disabled={idx === 0}
                    className="px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 disabled:opacity-50"
                  >
                    ↑ Move up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 1)}
                    disabled={idx === education.length - 1}
                    className="px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 disabled:opacity-50"
                  >
                    ↓ Move down
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="px-3 py-1.5 text-[12px] rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <label className="block">
                  <div className="text-[12px] font-semibold text-slate-800">Date range</div>
                  <input
                    type="text"
                    value={it.dateRange ?? ""}
                    onChange={(e) => updateItem(idx, { dateRange: e.target.value })}
                    placeholder="2014-07 - 2018-05"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block">
                  <div className="text-[12px] font-semibold text-slate-800">Degree line</div>
                  <input
                    type="text"
                    value={it.degreeLine ?? ""}
                    onChange={(e) => updateItem(idx, { degreeLine: e.target.value })}
                    placeholder="Bachelor of Technology: Computer Science Engineering"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block">
                  <div className="text-[12px] font-semibold text-slate-800">Institute</div>
                  <input
                    type="text"
                    value={it.institute ?? ""}
                    onChange={(e) => updateItem(idx, { institute: e.target.value })}
                    placeholder="DIT University - Dehradun"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block">
                  <div className="text-[12px] font-semibold text-slate-800">Meta (optional)</div>
                  <input
                    type="text"
                    value={it.meta ?? ""}
                    onChange={(e) => updateItem(idx, { meta: e.target.value })}
                    placeholder="GPA: 7.4/10"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </label>
              </div>
            </div>
          ))}

          {(onPrev || onNext) && (
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={onPrev}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onNext}
                className="rounded-xl bg-[#2f3b52] px-5 py-2 text-[13px] font-semibold text-white hover:opacity-95"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right preview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="text-sm font-semibold text-slate-900">Live Preview (Tech VC 1)</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-2">
          <TechVC1Preview data={previewData as any} />
        </div>
      </div>
    </div>
  );
}
