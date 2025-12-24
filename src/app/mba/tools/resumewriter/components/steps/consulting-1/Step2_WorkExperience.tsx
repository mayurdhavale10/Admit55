// src/app/mba/tools/resumewriter/components/steps/consulting-1/Step2_WorkExperience.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { StepComponentProps } from "../registry";

import Classic1Preview from "../../resume-templates/consulting-1/Classic1Preview";
import type {
  Consulting1RoleBlock,
  Consulting1WorkProfile,
  Consulting1Engagement,
} from "../../resume-templates/consulting-1/ClassicTemplate1";

// ✅ server actions
import { rewriteWorkProfileBlock } from "../../../ai/rewriteWorkProfileBlock";
import { rewriteWorkBullet } from "../../../ai/rewriteWorkBullet";

/* ---------------- utils ---------------- */

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Math.random().toString(16).slice(2)}`;

function asInput(v: unknown) {
  return (v ?? "").toString();
}

function cleanStr(v: unknown) {
  return (v ?? "").toString().trim();
}

function safeErr(e: any) {
  return e?.message || e?.toString?.() || "Unknown error";
}

/* ---------------- local editable types (with ids) ---------------- */

type WorkLine = { id: string; label: string; value: string };

type EditableWorkProfile = {
  headlineLeft: string;
  headlineRight: string;
  summaryLine: string;
  lines: WorkLine[];
};

type EditableEngagement = {
  id: string;
  title: string;
  locationRight: string;
  bullets: { id: string; text: string }[];
};

type EditableSubSection = {
  id: string;
  title: string;
  bullets: { id: string; text: string }[];
};

type EditableRole = {
  id: string;
  company: string;
  location: string;
  role: string;
  dateRange: string;
  sectionTitle: string;
  engagements: EditableEngagement[];
  subSections: EditableSubSection[];
};

type WorkHeadings = {
  heading: string;
  headingRight: string;
};

/* ---------------- component ---------------- */

export default function Step2_WorkExperience_Consulting1({
  draft,
  setDraft,
  onNext,
  onPrev,
}: StepComponentProps) {
  const resume = (draft as any)?.resume ?? {};

  /* ---------------- init: headings ---------------- */

  const initialHeadings = useMemo<WorkHeadings>(() => {
    const saved = resume?.consulting1WorkHeadings ?? {};
    return {
      heading: asInput(saved.heading) || "WORK EXPERIENCE",
      headingRight:
        asInput(saved.headingRight) ||
        "(8+ years in Strategy and Analytics Consulting)",
    };
  }, [resume]);

  const [headings, setHeadings] = useState<WorkHeadings>(initialHeadings);

  /* ---------------- init: workProfile ---------------- */

  const initialWorkProfile = useMemo<EditableWorkProfile>(() => {
    const saved = resume?.consulting1WorkProfile ?? {};

    const savedLines = Array.isArray(saved.lines) ? saved.lines : [];
    const lines: WorkLine[] =
      savedLines.length > 0
        ? savedLines.map((l: any) => ({
            id: asInput(l.id) || uid(),
            label: asInput(l.label),
            value: asInput(l.value),
          }))
        : [
            { id: uid(), label: "Areas of Expertise", value: "" },
            { id: uid(), label: "Sectors", value: "" },
            { id: uid(), label: "Technical Expertise", value: "" },
          ];

    return {
      headlineLeft: asInput(saved.headlineLeft) || "Management Consultant",
      headlineRight: asInput(saved.headlineRight) || "",
      summaryLine:
        asInput(saved.summaryLine) ||
        "with experience in executing large scale business transformations across Middle East, SEA, EU regions",
      lines,
    };
  }, [resume]);

  const [workProfile, setWorkProfile] =
    useState<EditableWorkProfile>(initialWorkProfile);

  /* ---------------- init: roles ---------------- */

  const initialRoles = useMemo<EditableRole[]>(() => {
    const saved = resume?.consulting1Roles;

    if (Array.isArray(saved) && saved.length) {
      return saved.map((r: any) => ({
        id: asInput(r.id) || uid(),
        company: asInput(r.company),
        location: asInput(r.location),
        role: asInput(r.role),
        dateRange: asInput(r.dateRange),
        sectionTitle: asInput(r.sectionTitle) || "Select Client Engagements",
        engagements: Array.isArray(r.engagements)
          ? r.engagements.map((e: any) => ({
              id: asInput(e.id) || uid(),
              title: asInput(e.title),
              locationRight: asInput(e.locationRight),
              bullets: Array.isArray(e.bullets)
                ? e.bullets.map((b: any) => ({
                    id: asInput(b.id) || uid(),
                    text: asInput(b.text ?? b),
                  }))
                : [],
            }))
          : [],
        subSections: Array.isArray(r.subSections)
          ? r.subSections.map((s: any) => ({
              id: asInput(s.id) || uid(),
              title: asInput(s.title),
              bullets: Array.isArray(s.bullets)
                ? s.bullets.map((b: any) => ({
                    id: asInput(b.id) || uid(),
                    text: asInput(b.text ?? b),
                  }))
                : [],
            }))
          : [],
      }));
    }

    // starter role
    return [
      {
        id: uid(),
        company: "Kearney",
        location: "Dubai, UAE",
        role: "Manager (prev. A.T. Kearney)",
        dateRange: "Jun’18 – Present",
        sectionTitle: "Select Client Engagements",
        engagements: [
          {
            id: uid(),
            title:
              "Capability Planning and Investment Strategy for Middle East based Govt. client",
            locationRight: "UAE",
            bullets: [
              {
                id: uid(),
                text:
                  "Led team of 5 to develop Capability Planning & design 10-year investment plan across people, fixed assets components",
              },
              {
                id: uid(),
                text:
                  "Designed Org. Transformation data-driven platform to track current & target capabilities of organization and identify gap areas",
              },
            ],
          },
        ],
        subSections: [],
      },
    ];
  }, [resume]);

  const [roles, setRoles] = useState<EditableRole[]>(initialRoles);
  const lastFocusRef = useRef<HTMLInputElement | null>(null);

  /* ---------------- rewrite UI state ---------------- */

  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiOk, setAiOk] = useState<string | null>(null);

  const clearAiMsgs = () => {
    setAiError(null);
    setAiOk(null);
  };

  /* ---------------- persist (single source of truth) ---------------- */

  const persistAll = (next?: {
    headings?: WorkHeadings;
    workProfile?: EditableWorkProfile;
    roles?: EditableRole[];
  }) => {
    const nextHeadings = next?.headings ?? headings;
    const nextWorkProfile = next?.workProfile ?? workProfile;
    const nextRoles = next?.roles ?? roles;

    setHeadings(nextHeadings);
    setWorkProfile(nextWorkProfile);
    setRoles(nextRoles);

    (setDraft as any)({
      ...(draft as any),
      resume: {
        ...resume,
        consulting1WorkHeadings: nextHeadings,
        consulting1WorkProfile: nextWorkProfile,
        consulting1Roles: nextRoles,
      },
    });
  };

  /* ---------------- handlers: headings ---------------- */

  const updateHeading = (patch: Partial<WorkHeadings>) => {
    persistAll({ headings: { ...headings, ...patch } });
  };

  /* ---------------- handlers: workProfile ---------------- */

  const updateWorkProfile = (patch: Partial<EditableWorkProfile>) => {
    persistAll({ workProfile: { ...workProfile, ...patch } });
  };

  const addWorkLine = () => {
    const next = [...workProfile.lines, { id: uid(), label: "", value: "" }];
    persistAll({ workProfile: { ...workProfile, lines: next } });
  };

  const updateWorkLine = (id: string, patch: Partial<WorkLine>) => {
    const next = workProfile.lines.map((l) =>
      l.id === id ? { ...l, ...patch } : l
    );
    persistAll({ workProfile: { ...workProfile, lines: next } });
  };

  const removeWorkLine = (id: string) => {
    const next = workProfile.lines.filter((l) => l.id !== id);
    persistAll({ workProfile: { ...workProfile, lines: next } });
  };

  /* ---------------- handlers: roles ---------------- */

  const addRole = () => {
    persistAll({
      roles: [
        ...roles,
        {
          id: uid(),
          company: "",
          location: "",
          role: "",
          dateRange: "",
          sectionTitle: "Select Client Engagements",
          engagements: [],
          subSections: [],
        },
      ],
    });
  };

  const removeRole = (roleId: string) => {
    persistAll({ roles: roles.filter((r) => r.id !== roleId) });
  };

  const updateRole = (roleId: string, patch: Partial<EditableRole>) => {
    persistAll({
      roles: roles.map((r) => (r.id === roleId ? { ...r, ...patch } : r)),
    });
  };

  /* ---------------- engagements ---------------- */

  const addEngagement = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    updateRole(roleId, {
      engagements: [
        ...role.engagements,
        { id: uid(), title: "", locationRight: "", bullets: [] },
      ],
    });
  };

  const updateEngagement = (
    roleId: string,
    engId: string,
    patch: Partial<EditableEngagement>
  ) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    updateRole(roleId, {
      engagements: role.engagements.map((e) =>
        e.id === engId ? { ...e, ...patch } : e
      ),
    });
  };

  const removeEngagement = (roleId: string, engId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    updateRole(roleId, {
      engagements: role.engagements.filter((e) => e.id !== engId),
    });
  };

  /* ---------------- bullets ---------------- */

  const addBullet = (roleId: string, engId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    const eng = role.engagements.find((e) => e.id === engId);
    if (!eng) return;

    updateEngagement(roleId, engId, {
      bullets: [...eng.bullets, { id: uid(), text: "" }],
    });
  };

  const updateBullet = (
    roleId: string,
    engId: string,
    bulletId: string,
    text: string
  ) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    const eng = role.engagements.find((e) => e.id === engId);
    if (!eng) return;

    updateEngagement(roleId, engId, {
      bullets: eng.bullets.map((b) => (b.id === bulletId ? { ...b, text } : b)),
    });
  };

  const removeBullet = (roleId: string, engId: string, bulletId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    const eng = role.engagements.find((e) => e.id === engId);
    if (!eng) return;

    updateEngagement(roleId, engId, {
      bullets: eng.bullets.filter((b) => b.id !== bulletId),
    });
  };

  /* ---------------- subSections ---------------- */

  const addSubSection = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    updateRole(roleId, {
      subSections: [
        ...role.subSections,
        { id: uid(), title: "Key Achievements:", bullets: [] },
      ],
    });
  };

  const updateSubSection = (
    roleId: string,
    subId: string,
    patch: Partial<EditableSubSection>
  ) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    updateRole(roleId, {
      subSections: role.subSections.map((s) =>
        s.id === subId ? { ...s, ...patch } : s
      ),
    });
  };

  const removeSubSection = (roleId: string, subId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    updateRole(roleId, {
      subSections: role.subSections.filter((s) => s.id !== subId),
    });
  };

  const addSubBullet = (roleId: string, subId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    const sec = role.subSections.find((s) => s.id === subId);
    if (!sec) return;
    updateSubSection(roleId, subId, {
      bullets: [...sec.bullets, { id: uid(), text: "" }],
    });
  };

  const updateSubBullet = (
    roleId: string,
    subId: string,
    bulletId: string,
    text: string
  ) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    const sec = role.subSections.find((s) => s.id === subId);
    if (!sec) return;

    updateSubSection(roleId, subId, {
      bullets: sec.bullets.map((b) => (b.id === bulletId ? { ...b, text } : b)),
    });
  };

  const removeSubBullet = (roleId: string, subId: string, bulletId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    const sec = role.subSections.find((s) => s.id === subId);
    if (!sec) return;

    updateSubSection(roleId, subId, {
      bullets: sec.bullets.filter((b) => b.id !== bulletId),
    });
  };

  /* ---------------- focus when adding roles ---------------- */

  useEffect(() => {
    lastFocusRef.current?.focus();
  }, [roles.length]);

  /* =========================================================
     ✅ AI: Work Profile Rewrite (summary + all values)
  ========================================================= */

  const handleRewriteWorkProfileAll = async () => {
    clearAiMsgs();
    setAiBusy(true);
    try {
      const res: any = await rewriteWorkProfileBlock({
        summaryLine: workProfile.summaryLine,
        lines: workProfile.lines.map((l) => ({ label: l.label, value: l.value })),
        track: (resume?.track as string) || "consulting",
        targetRole: resume?.targetRole || "",
        targetCompanyOrTeam: resume?.targetCompanyOrTeam || "",
        jobDescription: resume?.jobDescription || "", // ✅ ok here (your action supports JD)
      });

      if (!res?.ok && res?.error) setAiError(res.error);

      const rewritten = res?.rewritten;
      if (rewritten) {
        const nextSummary = asInput(rewritten.summaryLine);

        const outLines = Array.isArray(rewritten.lines) ? rewritten.lines : [];
        const nextLines = workProfile.lines.map((l) => {
          const match = outLines.find(
            (x: any) => cleanStr(x?.label) === cleanStr(l.label)
          );
          return { ...l, value: asInput(match?.value ?? l.value) };
        });

        persistAll({
          workProfile: {
            ...workProfile,
            summaryLine: nextSummary,
            lines: nextLines,
          },
        });

        setAiOk("Rewrote the entire Work Profile block.");
      } else {
        setAiError("AI returned empty output.");
      }
    } catch (e) {
      setAiError(safeErr(e));
    } finally {
      setAiBusy(false);
    }
  };

  const handleRewriteWorkProfileSummaryOnly = async () => {
    clearAiMsgs();
    setAiBusy(true);
    try {
      const res: any = await rewriteWorkProfileBlock({
        summaryLine: workProfile.summaryLine,
        lines: [],
        track: (resume?.track as string) || "consulting",
        targetRole: resume?.targetRole || "",
        targetCompanyOrTeam: resume?.targetCompanyOrTeam || "",
        jobDescription: resume?.jobDescription || "",
      });

      if (!res?.ok && res?.error) setAiError(res.error);

      const nextSummary = asInput(res?.rewritten?.summaryLine ?? "");
      if (nextSummary) {
        persistAll({
          workProfile: { ...workProfile, summaryLine: nextSummary },
        });
        setAiOk("Rewrote summary line.");
      } else {
        setAiError("AI returned empty output.");
      }
    } catch (e) {
      setAiError(safeErr(e));
    } finally {
      setAiBusy(false);
    }
  };

  const handleRewriteWorkProfileSingleLine = async (lineId: string) => {
    clearAiMsgs();
    setAiBusy(true);
    try {
      const line = workProfile.lines.find((l) => l.id === lineId);
      if (!line) return;

      const res: any = await rewriteWorkProfileBlock({
        summaryLine: "",
        lines: [{ label: line.label, value: line.value }],
        track: (resume?.track as string) || "consulting",
        targetRole: resume?.targetRole || "",
        targetCompanyOrTeam: resume?.targetCompanyOrTeam || "",
        jobDescription: resume?.jobDescription || "",
      });

      if (!res?.ok && res?.error) setAiError(res.error);

      const out = res?.rewritten?.lines?.[0];
      const nextVal = asInput(out?.value ?? "");
      if (nextVal) {
        updateWorkLine(lineId, { value: nextVal });
        setAiOk(`Rewrote: ${line.label}`);
      } else {
        setAiError("AI returned empty output.");
      }
    } catch (e) {
      setAiError(safeErr(e));
    } finally {
      setAiBusy(false);
    }
  };

  /* =========================================================
     ✅ AI: bullet rewrite (engagement + achievements)
     IMPORTANT: rewriteWorkBulletInput DOES NOT accept jobDescription in your project,
     so we DO NOT pass it (fixes TS2353).
  ========================================================= */

  const handleRewriteBullet = async (
    roleId: string,
    engId: string,
    bulletId: string
  ) => {
    clearAiMsgs();
    setAiBusy(true);
    try {
      const role = roles.find((r) => r.id === roleId);
      const eng = role?.engagements.find((e) => e.id === engId);
      const bullet = eng?.bullets.find((b) => b.id === bulletId);
      if (!bullet) return;

      const res: any = await rewriteWorkBullet({
        raw: bullet.text,
        track: (resume?.track as string) || "consulting",
        targetRole: resume?.targetRole || "",
        targetCompanyOrTeam: resume?.targetCompanyOrTeam || "",
        // ❌ jobDescription removed to match your RewriteWorkBulletInput
      });

      if (!res?.ok && res?.error) setAiError(res.error);

      const rewritten = asInput(res?.rewritten ?? "");
      if (rewritten) {
        updateBullet(roleId, engId, bulletId, rewritten);
        setAiOk("Rewrote bullet.");
      } else {
        setAiError("AI returned empty output.");
      }
    } catch (e) {
      setAiError(safeErr(e));
    } finally {
      setAiBusy(false);
    }
  };

  const handleRewriteAchievementBullet = async (
    roleId: string,
    subId: string,
    bulletId: string
  ) => {
    clearAiMsgs();
    setAiBusy(true);
    try {
      const role = roles.find((r) => r.id === roleId);
      const sec = role?.subSections.find((s) => s.id === subId);
      const bullet = sec?.bullets.find((b) => b.id === bulletId);
      if (!bullet) return;

      // ✅ Use the same bullet rewriter for achievements (fits your UX)
      const res: any = await rewriteWorkBullet({
        raw: bullet.text,
        track: (resume?.track as string) || "consulting",
        targetRole: resume?.targetRole || "",
        targetCompanyOrTeam: resume?.targetCompanyOrTeam || "",
      });

      if (!res?.ok && res?.error) setAiError(res.error);

      const rewritten = asInput(res?.rewritten ?? "");
      if (rewritten) {
        updateSubBullet(roleId, subId, bulletId, rewritten);
        setAiOk("Rewrote achievement bullet.");
      } else {
        setAiError("AI returned empty output.");
      }
    } catch (e) {
      setAiError(safeErr(e));
    } finally {
      setAiBusy(false);
    }
  };

  /* ---------------- preview mapping (MATCHES TEMPLATE PROPS) ---------------- */

  const header = resume?.consulting1Header ?? {};
  const summary = resume?.consulting1Summary ?? {};

  const previewData = useMemo(() => {
    const mappedWorkProfile: Consulting1WorkProfile = {
      headlineLeft: cleanStr(workProfile.headlineLeft),
      headlineRight: cleanStr(workProfile.headlineRight),
      summaryLine: cleanStr(workProfile.summaryLine),
      lines: workProfile.lines
        .map((l) => ({
          label: cleanStr(l.label),
          value: cleanStr(l.value),
        }))
        .filter((l) => l.label || l.value),
    };

    const mappedRoles: Consulting1RoleBlock[] = roles
      .map((r) => ({
        company: cleanStr(r.company),
        location: cleanStr(r.location),
        role: cleanStr(r.role),
        dateRange: cleanStr(r.dateRange),
        sectionTitle: cleanStr(r.sectionTitle) || "Select Client Engagements",
        engagements: r.engagements
          .map(
            (e): Consulting1Engagement => ({
              title: cleanStr(e.title),
              locationRight: cleanStr(e.locationRight),
              bullets: e.bullets.map((b) => cleanStr(b.text)).filter(Boolean),
            })
          )
          .filter((e) => e.title || e.bullets.length > 0),
        subSections: r.subSections
          .map((s) => ({
            title: cleanStr(s.title),
            bullets: s.bullets.map((b) => cleanStr(b.text)).filter(Boolean),
          }))
          .filter((s) => s.title || s.bullets.length > 0),
      }))
      .filter((r) => r.company || r.role || (r.engagements?.length ?? 0) > 0);

    return {
      header: {
        name: cleanStr(header.fullName) || "YOUR NAME",
        email: cleanStr(header.email),
        linkedin: cleanStr(header.linkedin),
        phone: cleanStr(header.phone),
      },
      summary: cleanStr(summary.text),

      workExperienceHeading: cleanStr(headings.heading) || "WORK EXPERIENCE",
      workExperienceHeadingRight: cleanStr(headings.headingRight),

      workProfile: mappedWorkProfile,
      roles: mappedRoles,
    };
  }, [header, summary, headings, workProfile, roles]);

  const canContinue =
    !!cleanStr(workProfile.summaryLine) ||
    roles.some(
      (r) => cleanStr(r.company) || r.engagements.some((e) => cleanStr(e.title))
    );

  /* ---------------- render ---------------- */

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT */}
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                Step 2 — Work Experience
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Edit Work Profile + Roles/Engagements. Rewrite using AI per-line or all-at-once.
              </p>
            </div>

            <button
              type="button"
              onClick={addRole}
              className="rounded-xl bg-[#002b5b] px-4 py-2 text-sm font-semibold text-white"
            >
              + Add role
            </button>
          </div>

          {/* AI status */}
          {(aiError || aiOk) && (
            <div
              className={[
                "rounded-xl border px-4 py-3 text-sm",
                aiError
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold">{aiError ? "AI Error" : "AI Update"}</div>
                  <div className="mt-1 break-words">{aiError ? aiError : aiOk}</div>
                </div>
                <button
                  type="button"
                  onClick={clearAiMsgs}
                  className="text-xs font-semibold underline opacity-80 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Headings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950 space-y-3">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Section Heading Bar
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="Left heading (e.g., WORK EXPERIENCE)"
                value={headings.heading}
                onChange={(e) => updateHeading({ heading: e.target.value })}
              />
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="Right heading (e.g., (8+ years in ...))"
                value={headings.headingRight}
                onChange={(e) => updateHeading({ headingRight: e.target.value })}
              />
            </div>
          </div>

          {/* Work Profile */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Work Profile Block (under WORK EXPERIENCE)
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Summary line + Label—Value lines. User can rewrite all at once or individually.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={handleRewriteWorkProfileAll}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-teal-400 dark:text-slate-950"
                >
                  {aiBusy ? "Rewriting..." : "Rewrite all lines"}
                </button>
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={handleRewriteWorkProfileSummaryOnly}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Rewrite summary
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder='Headline Left (e.g., "Management Consultant")'
                value={workProfile.headlineLeft}
                onChange={(e) => updateWorkProfile({ headlineLeft: e.target.value })}
              />
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="Headline Right (optional)"
                value={workProfile.headlineRight}
                onChange={(e) => updateWorkProfile({ headlineRight: e.target.value })}
              />
            </div>

            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Summary line"
              value={workProfile.summaryLine}
              onChange={(e) => updateWorkProfile({ summaryLine: e.target.value })}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Lines (Label — Value)
                </div>
                <button
                  type="button"
                  onClick={addWorkLine}
                  className="text-xs font-semibold text-[#0b5cff] hover:underline"
                >
                  + Add line
                </button>
              </div>

              {workProfile.lines.map((l) => (
                <div
                  key={l.id}
                  className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr_auto_auto]"
                >
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Label"
                    value={l.label}
                    onChange={(e) => updateWorkLine(l.id, { label: e.target.value })}
                  />
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Value"
                    value={l.value}
                    onChange={(e) => updateWorkLine(l.id, { value: e.target.value })}
                  />

                  <button
                    type="button"
                    disabled={aiBusy}
                    onClick={() => handleRewriteWorkProfileSingleLine(l.id)}
                    className="rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-800 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                  >
                    Rewrite
                  </button>

                  <button
                    type="button"
                    onClick={() => removeWorkLine(l.id)}
                    className="rounded-lg border border-slate-200 px-3 text-xs text-red-600 dark:border-slate-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Roles */}
          {roles.map((role, rIdx) => (
            <div
              key={role.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                    Role #{rIdx + 1}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => removeRole(role.id)}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Remove role
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  ref={rIdx === roles.length - 1 ? lastFocusRef : null}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Company"
                  value={role.company}
                  onChange={(e) => updateRole(role.id, { company: e.target.value })}
                />
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Location"
                  value={role.location}
                  onChange={(e) => updateRole(role.id, { location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Role"
                  value={role.role}
                  onChange={(e) => updateRole(role.id, { role: e.target.value })}
                />
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Date range"
                  value={role.dateRange}
                  onChange={(e) => updateRole(role.id, { dateRange: e.target.value })}
                />
              </div>

              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                placeholder="Section title"
                value={role.sectionTitle}
                onChange={(e) => updateRole(role.id, { sectionTitle: e.target.value })}
              />

              {/* Engagements */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Engagements
                  </h4>
                  <button
                    type="button"
                    onClick={() => addEngagement(role.id)}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-teal-400 dark:text-slate-950"
                  >
                    + Add engagement
                  </button>
                </div>

                {role.engagements.map((eng) => (
                  <div
                    key={eng.id}
                    className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Engagement
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEngagement(role.id, eng.id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove engagement
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        placeholder="Engagement title"
                        value={eng.title}
                        onChange={(e) =>
                          updateEngagement(role.id, eng.id, { title: e.target.value })
                        }
                      />
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                        placeholder="Location (right)"
                        value={eng.locationRight}
                        onChange={(e) =>
                          updateEngagement(role.id, eng.id, {
                            locationRight: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Bullets
                        </div>
                        <button
                          type="button"
                          onClick={() => addBullet(role.id, eng.id)}
                          className="text-xs font-semibold text-[#0b5cff] hover:underline"
                        >
                          + Add bullet
                        </button>
                      </div>

                      {eng.bullets.map((b) => (
                        <div key={b.id} className="flex gap-2">
                          <input
                            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                            placeholder="Bullet (impact + metric)"
                            value={b.text}
                            onChange={(e) =>
                              updateBullet(role.id, eng.id, b.id, e.target.value)
                            }
                          />

                          <button
                            type="button"
                            disabled={aiBusy}
                            onClick={() => handleRewriteBullet(role.id, eng.id, b.id)}
                            className="rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-800 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                          >
                            Rewrite
                          </button>

                          <button
                            type="button"
                            onClick={() => removeBullet(role.id, eng.id, b.id)}
                            className="rounded-lg border border-slate-200 px-3 text-xs text-red-600 dark:border-slate-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sub Sections */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Extra Blocks (Key Achievements, etc.)
                  </h4>
                  <button
                    type="button"
                    onClick={() => addSubSection(role.id)}
                    className="text-xs font-semibold text-[#0b5cff] hover:underline"
                  >
                    + Add block
                  </button>
                </div>

                {role.subSections.map((sec) => (
                  <div
                    key={sec.id}
                    className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Block
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSubSection(role.id, sec.id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove block
                      </button>
                    </div>

                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Title (e.g., Key Achievements:)"
                      value={sec.title}
                      onChange={(e) =>
                        updateSubSection(role.id, sec.id, { title: e.target.value })
                      }
                    />

                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Bullets
                      </div>
                      <button
                        type="button"
                        onClick={() => addSubBullet(role.id, sec.id)}
                        className="text-xs font-semibold text-[#0b5cff] hover:underline"
                      >
                        + Add bullet
                      </button>
                    </div>

                    {sec.bullets.map((b) => (
                      <div key={b.id} className="flex gap-2">
                        <input
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                          placeholder="Bullet text"
                          value={b.text}
                          onChange={(e) =>
                            updateSubBullet(role.id, sec.id, b.id, e.target.value)
                          }
                        />

                        <button
                          type="button"
                          disabled={aiBusy}
                          onClick={() =>
                            handleRewriteAchievementBullet(role.id, sec.id, b.id)
                          }
                          className="rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-800 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                        >
                          Rewrite
                        </button>

                        <button
                          type="button"
                          onClick={() => removeSubBullet(role.id, sec.id, b.id)}
                          className="rounded-lg border border-slate-200 px-3 text-xs text-red-600 dark:border-slate-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* nav */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onPrev}
              className="px-4 py-2 rounded-md border text-sm border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Back
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!canContinue}
              className="rounded-xl bg-[#002b5b] px-6 py-2 text-white disabled:bg-slate-400"
            >
              Continue
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Live Preview (Consulting 1)
            </div>
          </div>

          <Classic1Preview data={previewData as any} />
        </div>
      </div>
    </div>
  );
}
