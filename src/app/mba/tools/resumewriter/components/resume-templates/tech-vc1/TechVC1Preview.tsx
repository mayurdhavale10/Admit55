// src/app/mba/tools/resumewriter/components/resume-templates/tech-vc1/TechVC1Preview.tsx
"use client";

import React, { useMemo, useState } from "react";
import TechVC1Template, {
  type TechVC1TemplateProps,
  type TechVC1Header,
  type TechVC1ExperienceItem,
  type TechVC1Skills,
  type TechVC1EducationItem,
  type TechVC1AchievementItem,
} from "./TechVC1Template";

/* =========================
   SAFE HELPERS
========================= */

function cleanStr(v: unknown) {
  return (v ?? "").toString().trim();
}

function safeArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function pickFirst(...vals: Array<unknown>) {
  for (const v of vals) {
    const s = cleanStr(v);
    if (s) return s;
  }
  return "";
}

/* =========================
   ADAPTERS (draft -> template)
========================= */

function adaptToTemplateProps(data: any): TechVC1TemplateProps {
  // A) Already in template shape
  if (data?.header || data?.experience || data?.skills || data?.education) {
    const direct = data as Partial<TechVC1TemplateProps>;
    return {
      header: (direct.header ?? { name: "Your Name" }) as TechVC1Header,
      summary: cleanStr((direct as any).summary),
      experience: safeArray<TechVC1ExperienceItem>((direct as any).experience),
      skills: (direct as any).skills as TechVC1Skills | undefined,
      education: safeArray<TechVC1EducationItem>((direct as any).education),
      achievements: safeArray<TechVC1AchievementItem>((direct as any).achievements),
      page: (direct as any).page,
      compact: true,
    };
  }

  // B) Step draft shape
  const resume = data?.resume ?? {};

  const headerRaw =
    resume.techVC1Header ??
    resume.vc1Header ??
    resume.techHeader ??
    {};

  const summaryRaw =
    resume.techVC1Summary ??
    resume.vc1Summary ??
    resume.techSummary ??
    {};

  const expRaw =
    resume.techVC1Experience ??
    resume.vc1Experience ??
    resume.techExperience ??
    resume.experiences ??
    resume.experience ??
    [];

  const skillsRaw =
    resume.techVC1Skills ??
    resume.vc1Skills ??
    resume.techSkills ??
    undefined;

  const eduRaw =
    resume.techVC1Education ??
    resume.vc1Education ??
    resume.techEducation ??
    resume.education ??
    [];

  const achRaw =
    resume.techVC1Achievements ??
    resume.vc1Achievements ??
    resume.techAchievements ??
    resume.achievements ??
    [];

  const header: TechVC1Header = {
    name: pickFirst(headerRaw.name, headerRaw.fullName, headerRaw.headerName, "Your Name"),
    title: pickFirst(headerRaw.title, headerRaw.roleTitle, "Software Engineer"),

    addressLabel: pickFirst(headerRaw.addressLabel, "Address"),
    address: pickFirst(headerRaw.address, headerRaw.location, ""),

    phoneLabel: pickFirst(headerRaw.phoneLabel, "Phone"),
    phone: pickFirst(headerRaw.phone, ""),

    emailLabel: pickFirst(headerRaw.emailLabel, "E-mail"),
    email: pickFirst(headerRaw.email, ""),

    linkedinLabel: pickFirst(headerRaw.linkedinLabel, "LinkedIn"),
    linkedin: pickFirst(headerRaw.linkedin, headerRaw.links?.linkedin, ""),

    githubLabel: pickFirst(headerRaw.githubLabel, "GitHub"),
    github: pickFirst(headerRaw.github, headerRaw.links?.github, ""),

    wwwLabel: pickFirst(headerRaw.wwwLabel, "WWW"),
    portfolio: pickFirst(headerRaw.portfolio, headerRaw.links?.portfolio, ""),
    wwwHint: pickFirst(headerRaw.wwwHint, headerRaw.websiteHint, "Bold Profile"),
  };

  const summary = cleanStr(summaryRaw.text ?? summaryRaw);

  const experience: TechVC1ExperienceItem[] = safeArray(expRaw).map((e: any) => ({
    dateRange: cleanStr(e.dateRange ?? e.dates ?? e.fromTo),
    role: cleanStr(e.role ?? e.title ?? e.position ?? "Role"),
    company: cleanStr(e.company),
    location: cleanStr(e.location),
    bullets: safeArray<string>(e.bullets ?? e.points ?? []).map((b) => (b ?? "").toString()),
  }));

  let skills: TechVC1Skills | undefined = undefined;
  if (skillsRaw) {
    if (Array.isArray(skillsRaw.rows)) {
      skills = {
        heading: cleanStr(skillsRaw.heading) || "Skills",
        rows: skillsRaw.rows.map((r: any) => ({
          label: cleanStr(r.label),
          value: cleanStr(r.value),
        })),
      };
    } else if (Array.isArray(skillsRaw.categories)) {
      skills = {
        heading: cleanStr(skillsRaw.heading) || "Skills",
        rows: skillsRaw.categories
          .map((c: any) => ({
            label: cleanStr(c.name ?? c.label),
            value: cleanStr(Array.isArray(c.items) ? c.items.join(", ") : c.value ?? ""),
          }))
          .filter((r: any) => cleanStr(r.label) || cleanStr(r.value)),
      };
    }
  }

  const education: TechVC1EducationItem[] = safeArray(eduRaw).map((ed: any) => ({
    dateRange: cleanStr(ed.dateRange ?? ed.dates ?? ed.fromTo),
    degreeLine: cleanStr(ed.degreeLine ?? ed.degree ?? "Degree"),
    institute: cleanStr(ed.institute ?? ed.school),
    meta: cleanStr(ed.meta ?? ed.gpaLine),
  }));

  const achievements: TechVC1AchievementItem[] = safeArray(achRaw).map((a: any) => {
    if (Array.isArray(a?.bullets)) return { bullets: a.bullets.map((x: any) => (x ?? "").toString()) };
    if (Array.isArray(a)) return { bullets: a.map((x: any) => (x ?? "").toString()) };
    return { bullets: [String(a ?? "")].filter(Boolean) };
  });

  return { header, summary, experience, skills, education, achievements, compact: true };
}

/* =========================
   PREVIEW
========================= */

export default function TechVC1Preview({
  data,
  showPager = true,
}: {
  data: any;
  showPager?: boolean;
}) {
  const templateProps = useMemo<TechVC1TemplateProps>(() => adaptToTemplateProps(data), [data]);

  const pageCount = 3;
  const [pageIndex, setPageIndex] = useState(0);

  const goPrev = () => setPageIndex((p) => Math.max(0, p - 1));
  const goNext = () => setPageIndex((p) => Math.min(pageCount - 1, p + 1));

  return (
    <div className="w-full">
      <div className="relative w-full">
        {showPager && pageCount > 1 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
            <div
              role="button"
              tabIndex={0}
              aria-disabled={pageIndex === 0}
              aria-label="Previous page"
              title="Previous page"
              onClick={pageIndex === 0 ? undefined : goPrev}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (pageIndex !== 0) goPrev();
                }
              }}
              className={[
                "h-10 w-10 rounded-full bg-white/95 border border-slate-200 shadow flex items-center justify-center",
                "select-none",
                pageIndex === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-white cursor-pointer",
              ].join(" ")}
            >
              ‹
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-disabled={pageIndex === pageCount - 1}
              aria-label="Next page"
              title="Next page"
              onClick={pageIndex === pageCount - 1 ? undefined : goNext}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (pageIndex !== pageCount - 1) goNext();
                }
              }}
              className={[
                "h-10 w-10 rounded-full bg-white/95 border border-slate-200 shadow flex items-center justify-center",
                "select-none",
                pageIndex === pageCount - 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-white cursor-pointer",
              ].join(" ")}
            >
              ›
            </div>
          </div>
        )}

        <div className="w-full overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
          <TechVC1Template {...templateProps} page={pageIndex as 0 | 1 | 2} compact />
        </div>

        {showPager && (
          <div className="mt-3 flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                aria-label={`Go to page ${i + 1}`}
                onClick={() => setPageIndex(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setPageIndex(i);
                  }
                }}
                className={[
                  "h-2.5 w-2.5 rounded-full",
                  i === pageIndex ? "bg-[#0b5cff]" : "bg-slate-300",
                  "cursor-pointer",
                ].join(" ")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
