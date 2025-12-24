// src/app/mba/tools/resumewriter/components/steps/tech-vc1/Step3_Skills.tsx
"use client";

import React, { useMemo } from "react";
import TechVC1Preview from "../../resume-templates/tech-vc1/TechVC1Preview";

type TechVC1SkillsRow = { label: string; value: string };
type TechVC1Skills = { heading?: string; rows: TechVC1SkillsRow[] };

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

function TagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 12l-8 8-10-10V4h6l12 8Z"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 7.5h.01"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
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

const DEFAULT_SKILL_ROWS: TechVC1SkillsRow[] = [
  { label: "Programming Language", value: "CORE JAVA/J2EE" },
  { label: "Framework & Library", value: "Spring, SpringBoot, JPA, Hibernate, Quarkus" },
  { label: "Databases", value: "Redis, MySQL, Postgres SQL, Elasticsearch, MongoDB, Keyspaces, Cassandra" },
  { label: "Cloud Services", value: "AWS, GCP(GCS)" },
  { label: "Messaging System", value: "Kafka, SQS, SNS, RabbitMQ, MQTT" },
  { label: "Code quality", value: "SonarQube, PMD, Checkstyle, Unit Test, Integration Test" },
  { label: "Code Version Control", value: "GitHub, Bitbucket, JIRA, GitLabs, Maven, Gradle" },
  { label: "Containerization", value: "Docker, Kubernetes, AWS Lambda, Serverless" },
  { label: "Operating Systems", value: "Linux, Windows, MacOS" },
  { label: "Protocols", value: "REST, GRPC" },
  { label: "Infrastructure", value: "Terraform" },
  { label: "CI/CD", value: "Jenkins, Travis, AWS Codepipeline" },
  { label: "Soft Skills", value: "People Management, Team Mentoring, Code Review, Project Management" },
];

function isEmptySkillsRow(r: TechVC1SkillsRow) {
  return !cleanStr(r.label) && !cleanStr(r.value);
}

export default function Step3_Skills({ draft, setDraft, onNext, onPrev }: Props) {
  // ✅ Always start with sample rows if user hasn't customized yet.
  const skills: TechVC1Skills = useMemo(() => {
    const r = draft?.resume ?? {};
    const raw = r.techVC1Skills ?? r.vc1Skills ?? r.skills ?? {};

    const rows = safeArray(raw?.rows ?? raw?.items ?? []).map((x: any) => ({
      label: cleanStr(x?.label ?? x?.name ?? ""),
      value: cleanStr(x?.value ?? x?.text ?? ""),
    }));

    return {
      heading: cleanStr(raw?.heading ?? "Skills"),
      rows: rows.length ? rows : DEFAULT_SKILL_ROWS,
    };
  }, [draft]);

  function setSkills(next: TechVC1Skills) {
    const nextDraft = ensureResumeRoot(draft);
    nextDraft.resume.techVC1Skills = next;
    setDraft(nextDraft);
  }

  function updateHeading(v: string) {
    setSkills({ ...skills, heading: v });
  }

  function updateRow(i: number, patch: Partial<TechVC1SkillsRow>) {
    const nextRows = [...(skills.rows ?? [])];
    nextRows[i] = { ...nextRows[i], ...patch };
    setSkills({ ...skills, rows: nextRows });
  }

  function addRow() {
    setSkills({
      ...skills,
      rows: [...(skills.rows ?? []), { label: "", value: "" }],
    });
  }

  function removeRow(i: number) {
    const nextRows = (skills.rows ?? []).filter((_, idx) => idx !== i);
    // ✅ allow deleting everything; template will just render nothing if rows empty
    setSkills({ ...skills, rows: nextRows });
  }

  function moveRow(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= (skills.rows ?? []).length) return;
    const nextRows = [...(skills.rows ?? [])];
    [nextRows[i], nextRows[j]] = [nextRows[j], nextRows[i]];
    setSkills({ ...skills, rows: nextRows });
  }

  function resetToSampleRows() {
    setSkills({ heading: skills.heading || "Skills", rows: DEFAULT_SKILL_ROWS });
  }

  function clearAllRows() {
    setSkills({ ...skills, rows: [] });
  }

  function addSampleRowsIfEmpty() {
    if ((skills.rows ?? []).length === 0) resetToSampleRows();
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

    return {
      header,
      summary: summaryText,
      experience,
      skills,
      page: 2, // Skills page
    };
  }, [draft, skills]);

  const rows = skills.rows ?? [];
  const hasAnyRow = rows.length > 0;
  const allEmpty = hasAnyRow && rows.every(isEmptySkillsRow);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
      {/* Left editor */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <IconTile>
            <TagIcon />
          </IconTile>
          <div className="text-[#2f3b52] text-[20px] font-bold">Skills</div>
        </div>

        <p className="mt-2 text-slate-600 text-[13px] leading-relaxed">
          Sample rows are shown by default. You can edit them, delete any row, or add new rows.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <div className="text-[12px] font-semibold text-slate-800">Section heading</div>
            <input
              value={skills.heading ?? "Skills"}
              onChange={(e) => updateHeading(e.target.value)}
              placeholder="Skills"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-slate-200"
            />
          </label>

          {/* actions */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addRow}
              className="rounded-xl bg-[#2f3b52] px-3 py-2 text-[12px] font-semibold text-white hover:opacity-95"
            >
              + Add row
            </button>

            <button
              type="button"
              onClick={resetToSampleRows}
              className="rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
              title="Restore the default sample rows"
            >
              Restore sample rows
            </button>

            <button
              type="button"
              onClick={clearAllRows}
              className="rounded-xl border border-rose-200 px-3 py-2 text-[12px] font-semibold text-rose-700 hover:bg-rose-50"
              title="Remove all skills rows"
            >
              Clear all
            </button>
          </div>

          {!hasAnyRow && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12.5px] text-amber-900">
              No rows yet.{" "}
              <button
                type="button"
                onClick={addSampleRowsIfEmpty}
                className="font-semibold underline underline-offset-2"
              >
                Click here to add sample rows
              </button>
              .
            </div>
          )}

          {allEmpty && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[12.5px] text-slate-700">
              Tip: Fill each row as <b>Label</b> → <b>comma-separated values</b>.
            </div>
          )}

          {/* rows */}
          <div className="space-y-4">
            {rows.map((row, idx) => (
              <div
                key={`${row.label}-${idx}`}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr]">
                  <label className="block">
                    <div className="text-[12px] font-semibold text-slate-800">Label</div>
                    <input
                      value={row.label ?? ""}
                      onChange={(e) => updateRow(idx, { label: e.target.value })}
                      placeholder="Databases"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </label>

                  <label className="block">
                    <div className="text-[12px] font-semibold text-slate-800">Values</div>
                    <input
                      value={row.value ?? ""}
                      onChange={(e) => updateRow(idx, { value: e.target.value })}
                      placeholder="Redis, MySQL, Postgres SQL, MongoDB"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-slate-200"
                    />
                    <div className="mt-1 text-[12px] text-slate-500">
                      Keep it concise (comma-separated).
                    </div>
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveRow(idx, -1)}
                    disabled={idx === 0}
                    className="px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 disabled:opacity-50"
                  >
                    ↑ Move up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRow(idx, 1)}
                    disabled={idx === rows.length - 1}
                    className="px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 disabled:opacity-50"
                  >
                    ↓ Move down
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="px-3 py-1.5 text-[12px] rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* nav */}
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
