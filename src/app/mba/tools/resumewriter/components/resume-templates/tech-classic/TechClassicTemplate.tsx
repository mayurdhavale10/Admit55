// src/app/mba/tools/resumewriter/components/resume-templates/tech-classic/TechClassicTemplate.tsx
"use client";

import React from "react";

/* =========================
   Types
========================= */

export type TechClassicHeader = {
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  location?: string;
};

export type TechClassicSkillRow = {
  label: string;
  value: string;
};

export type TechClassicExperience = {
  company: string;
  location?: string;
  role: string;
  dateRange?: string;
  summaryLine?: string;
  bullets: string[];
};

export type TechClassicEducation = {
  institute: string;
  location?: string;
  degreeLine: string;
  dateRange?: string;
};

export type TechClassicAchievement = {
  title: string;
  description?: string;
  icon?: "pin" | "star" | "spark" | "award";
};

export type TechClassicTemplateProps = {
  header: TechClassicHeader;
  summary?: string;

  skills?: {
    heading?: string;
    subHeading?: string; // "Name of Article" (should NOT be bold)
    rows?: TechClassicSkillRow[];
  };

  experiences?: TechClassicExperience[];
  education?: TechClassicEducation[];
  achievements?: TechClassicAchievement[];
};

/* =========================
   Helpers
========================= */

function clean(v: unknown) {
  return (v ?? "").toString().trim();
}

/**
 * Render **bold** markup safely (no HTML).
 * If text has no **, it renders as plain text.
 */
function RichText({ text }: { text: string }) {
  const t = clean(text);
  if (!t) return null;

  const parts = t.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} style={{ fontWeight: 800 }}>
            {p}
          </strong>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
}

/**
 * ✅ "Light" emphasis for Summary:
 * - only highlight a small set of impactful keywords + metrics
 * - never aggressively bold common verbs
 * - if user already provided **bold**, we respect it and do nothing
 */
function emphasizeSummary(input: string) {
  let s = clean(input);
  if (!s) return s;
  if (s.includes("**")) return s;

  const wrap = (re: RegExp) => {
    s = s.replace(re, (m) => `**${m}**`);
  };

  // metrics / units
  wrap(/\bP\d{2}\b/g); // P99
  wrap(/\bRPS\b/gi);
  wrap(/\b\d+(\.\d+)?\s?(ms|s|sec|secs)\b/gi);
  wrap(/\b\d+(\.\d+)?\s?%\b/g);
  wrap(/\$\s?\d+(\.\d+)?\s?(k|m|b)\b/gi);
  wrap(/\b\d+(\.\d+)?\s?(k|m|b)\b/g);

  // selective high-signal keywords (small set)
  wrap(/\bmicroservices?\b/gi);
  wrap(/\bRESTful APIs?\b/gi);
  wrap(/\bscalable\b/gi);
  wrap(/\bhigh[- ]performance\b/gi);
  wrap(/\bdatabase management\b/gi);

  return s;
}

/**
 * ✅ "Strong" emphasis for Experience bullets / achievements:
 * This can be more aggressive because bullets benefit from impact highlighting.
 * If user already provided **bold**, we keep it.
 */
function emphasizeImpact(input: string) {
  let s = clean(input);
  if (!s) return s;
  if (s.includes("**")) return s;

  const wrap = (re: RegExp) => {
    s = s.replace(re, (m) => `**${m}**`);
  };

  // metrics / units
  wrap(/\bP\d{2}\b/g);
  wrap(/\bRPS\b/gi);
  wrap(/\b\d+(\.\d+)?\s?(ms|s|sec|secs)\b/gi);
  wrap(/\b\d+(\.\d+)?\s?%\b/g);
  wrap(/\$\s?\d+(\.\d+)?\s?(k|m|b)\b/gi);
  wrap(/\b\d+(\.\d+)?\s?(k|m|b)\b/g);

  // common impact keywords (kept targeted)
  wrap(/\bmicroservices?\b/gi);
  wrap(/\bIoT\b/g);
  wrap(/\b(latency|uptime|cost|costs|savings?|revenue|P\d{2})\b/gi);
  wrap(/\b(minimiz(?:e|ed|ing)|reduc(?:e|ed|ing)|improv(?:e|ed|ing)|boost(?:ed|ing)?|increas(?:e|ed|ing)|optimized|scaled)\b/gi);

  return s;
}

function Icon({ kind }: { kind?: TechClassicAchievement["icon"] }) {
  const size = 14;
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style: { display: "inline-block", verticalAlign: "middle" as const },
  };

  if (kind === "pin") {
    return (
      <svg {...common}>
        <path
          d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"
          stroke="#111827"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="10" r="2.5" stroke="#111827" strokeWidth="1.8" />
      </svg>
    );
  }

  if (kind === "star") {
    return (
      <svg {...common}>
        <path
          d="M12 3.5l2.6 5.5 6 .9-4.3 4.2 1 6-5.3-2.9-5.3 2.9 1-6L3.4 10l6-.9L12 3.5z"
          stroke="#111827"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "spark") {
    return (
      <svg {...common}>
        <path
          d="M12 2l1.4 6.2L20 10l-6.6 1.8L12 18l-1.4-6.2L4 10l6.6-1.8L12 2z"
          stroke="#111827"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path
        d="M8 21l4-2 4 2v-7H8v7z"
        stroke="#111827"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 13a5 5 0 100-10 5 5 0 000 10z" stroke="#111827" strokeWidth="1.6" />
    </svg>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          textAlign: "center",
          fontWeight: 800,
          fontSize: 14,
          letterSpacing: 0.2,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ height: 2, background: "#111827" }} />
    </div>
  );
}

/* =========================
   Component
========================= */

export default function TechClassicTemplate(props: TechClassicTemplateProps) {
  const header = props.header ?? { name: "" };

  const name = clean(header.name);
  const title = clean(header.title);
  const phone = clean(header.phone);
  const email = clean(header.email);
  const linkedin = clean(header.linkedin);
  const github = clean(header.github);
  const portfolio = clean(header.portfolio);
  const location = clean(header.location);

  const contactParts = [phone, email, linkedin, github, portfolio, location].filter(Boolean);

  const summary = clean(props.summary);

  const skills = props.skills;
  const skillHeading = clean(skills?.heading) || "Skills";
  const skillSub = clean(skills?.subHeading); // should be normal (NOT bold)
  const skillRows = Array.isArray(skills?.rows) ? skills!.rows! : [];

  const experiences = Array.isArray(props.experiences) ? props.experiences : [];
  const education = Array.isArray(props.education) ? props.education : [];
  const achievements = Array.isArray(props.achievements) ? props.achievements : [];

  return (
    <div
      style={{
        width: "210mm",
        minHeight: "297mm",
        height: "auto",
        overflow: "visible",

        background: "#ffffff",
        color: "#111827",
        fontFamily: "Arial, Helvetica, sans-serif",

        padding: "14mm 14mm 14mm 14mm",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 0.6 }}>
          {name ? name.toUpperCase() : "YOUR NAME"}
        </div>

        {title && (
          <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700 }}>
            {/* title is already bold by style; only respect ** if user gave it */}
            <RichText text={title} />
          </div>
        )}

        {contactParts.length > 0 && (
          <div
            style={{
              marginTop: 8,
              fontSize: 11.5,
              lineHeight: 1.25,
              maxWidth: "175mm",
              marginLeft: "auto",
              marginRight: "auto",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            {contactParts.join(" • ")}
          </div>
        )}
      </div>

      {/* SUMMARY */}
      <SectionTitle title="Summary" />
      <div style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.35 }}>
        {/* ✅ light emphasis only here */}
        <RichText text={emphasizeSummary(summary)} />
      </div>

      {/* SKILLS */}
      <SectionTitle title={skillHeading} />

      {/* ✅ subHeading ("Name of Article") should NOT be bold */}
      {skillSub && (
        <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 400 }}>
          <RichText text={skillSub} />
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        {skillRows.map((row, idx) => (
          <div
            key={`${row.label}-${idx}`}
            style={{
              display: "flex",
              gap: 6,
              fontSize: 11.5,
              lineHeight: 1.35,
              marginBottom: 4,
              minWidth: 0,
            }}
          >
            {/* label should be bold (like screenshot) */}
            <div style={{ fontWeight: 800, whiteSpace: "nowrap" }}>
              <RichText text={clean(row.label)} />:
            </div>

            {/* ✅ value should NOT auto-bold randomly */}
            <div style={{ flex: 1, minWidth: 0, wordBreak: "break-word", overflowWrap: "anywhere" }}>
              <RichText text={clean(row.value)} />
            </div>
          </div>
        ))}
      </div>

      {/* EXPERIENCE */}
      <SectionTitle title="Experience" />
      <div style={{ marginTop: 10 }}>
        {experiences.map((exp, idx) => (
          <div key={`${exp.company}-${idx}`} style={{ marginBottom: 14 }}>
            {/* Company + Location (company = boldest) */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                fontSize: 13.5,
                fontWeight: 900,
                minWidth: 0,
              }}
            >
              <div style={{ minWidth: 0, wordBreak: "break-word" }}>
                <RichText text={clean(exp.company)} />
              </div>
              <div
                style={{
                  fontWeight: 500,
                  textAlign: "right",
                  minWidth: 0,
                  maxWidth: "45%",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  fontSize: 12,
                }}
              >
                <RichText text={clean(exp.location)} />
              </div>
            </div>

            {/* Role + Date (role less bold) */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                marginTop: 2,
                fontSize: 12.5,
                fontWeight: 700,
                minWidth: 0,
              }}
            >
              <div style={{ minWidth: 0, wordBreak: "break-word" }}>
                <RichText text={clean(exp.role)} />
              </div>
              <div
                style={{
                  fontWeight: 500,
                  textAlign: "right",
                  minWidth: 0,
                  maxWidth: "45%",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  fontSize: 12,
                }}
              >
                <RichText text={clean(exp.dateRange)} />
              </div>
            </div>

            {/* Summary line (least bold) */}
            {clean(exp.summaryLine) && (
              <div style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.3, fontWeight: 400 }}>
                <RichText text={clean(exp.summaryLine)} />
              </div>
            )}

            {/* Bullets (impact emphasis here) */}
            <ul
              style={{
                marginTop: 6,
                marginBottom: 0,
                paddingLeft: 18,
                listStyleType: "disc",
                listStylePosition: "outside",
              }}
            >
              {(exp.bullets ?? [])
                .map((b) => clean(b))
                .filter(Boolean)
                .map((b, bi) => (
                  <li key={`${idx}-b-${bi}`} style={{ fontSize: 11.5, lineHeight: 1.35, marginBottom: 3 }}>
                    <RichText text={emphasizeImpact(b)} />
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {/* EDUCATION */}
      <SectionTitle title="Education" />
      <div style={{ marginTop: 10 }}>
        {education.map((ed, idx) => (
          <div key={`${ed.institute}-${idx}`} style={{ marginBottom: 10 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                fontSize: 13,
                fontWeight: 900,
                minWidth: 0,
              }}
            >
              <div style={{ minWidth: 0, wordBreak: "break-word" }}>
                <RichText text={clean(ed.institute)} />
              </div>
              <div
                style={{
                  fontWeight: 500,
                  textAlign: "right",
                  minWidth: 0,
                  maxWidth: "45%",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  fontSize: 12,
                }}
              >
                <RichText text={clean(ed.location)} />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                marginTop: 2,
                fontSize: 12,
                minWidth: 0,
              }}
            >
              <div style={{ minWidth: 0, wordBreak: "break-word" }}>
                <RichText text={clean(ed.degreeLine)} />
              </div>
              <div
                style={{
                  textAlign: "right",
                  minWidth: 0,
                  maxWidth: "45%",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                <RichText text={clean(ed.dateRange)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* KEY ACHIEVEMENTS */}
      <SectionTitle title="Key Achievements" />
      <div style={{ marginTop: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {achievements.map((a, idx) => (
            <div key={`${a.title}-${idx}`} style={{ display: "flex", gap: 8, minWidth: 0 }}>
              <div style={{ marginTop: 1, flexShrink: 0 }}>
                <Icon kind={a.icon} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 900, lineHeight: 1.2 }}>
                  <RichText text={emphasizeImpact(clean(a.title))} />
                </div>
                {clean(a.description) && (
                  <div style={{ marginTop: 2, fontSize: 10.8, lineHeight: 1.25 }}>
                    <RichText text={emphasizeImpact(clean(a.description))} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
