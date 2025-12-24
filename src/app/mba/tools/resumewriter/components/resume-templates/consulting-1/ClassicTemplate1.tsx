// src/app/mba/tools/resumewriter/components/resume-templates/consulting-1/Consulting1Template.tsx
"use client";

import React from "react";

/* =========================
   Types
========================= */

export type Consulting1Header = {
  name: string;
  email?: string;
  linkedin?: string;
  phone?: string;
};

export type Consulting1WorkProfile = {
  headlineLeft?: string; // e.g., "Management Consultant"
  headlineRight?: string; // e.g., "(8+ years in Strategy and Analytics Consulting)"
  summaryLine?: string; // 1–2 lines under header
  lines?: Array<{
    label: string; // e.g., "Areas of Expertise"
    value: string; // e.g., "Digital Transformation, Data & Analytics..."
  }>;
};

export type Consulting1Engagement = {
  title: string; // e.g., "Anti-Fraud Transformation for Middle East based Financial Institute"
  locationRight?: string; // e.g., "UAE"
  bullets: string[];
};

export type Consulting1RoleBlock = {
  company: string; // e.g., "Kearney"
  location: string; // e.g., "Dubai, UAE"
  role: string; // e.g., "Manager (prev. A.T. Kearney)"
  dateRange: string; // e.g., "Jun’18 - Present"
  sectionTitle?: string; // e.g., "Select Client Engagements"
  engagements?: Consulting1Engagement[];
  // Optional extra blocks inside same company (like "Intrapreneurial Initiatives", "Key Achievements")
  subSections?: Array<{
    title: string;
    bullets: string[];
  }>;
};

export type Consulting1Education = {
  institute: string; // e.g., "Indian School of Business (ISB)"
  location?: string; // optional
  degreeLine: string; // e.g., "MBA | GPA: 3.6/4 | ISB Torch Bearer Award"
  dateRange?: string; // e.g., "Apr’17 – Apr’18"
  bullets?: string[];
};

export type Consulting1Initiative = {
  titleLeft: string; // e.g., "Author | 55 Successful ISB Essays and Their Analysis"
  dateRight?: string; // e.g., "Dec’19 – Dec’20"
  subtitle?: string; // small line under
  bullets?: string[];
};

export type Consulting1TemplateProps = {
  header: Consulting1Header;

  summary?: string; // line right below header
  workProfile?: Consulting1WorkProfile;

  workExperienceHeading?: string; // default: "WORK EXPERIENCE"
  workExperienceHeadingRight?: string; // default: "(8+ years in Strategy and Analytics Consulting)"
  roles?: Consulting1RoleBlock[];

  educationHeading?: string; // default: "EDUCATION"
  education?: Consulting1Education[];

  initiativesHeading?: string; // default: "ENTREPRENEURIAL INITIATIVES"
  initiatives?: Consulting1Initiative[];
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
function RichText({ text }: { text?: string }) {
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

function DotSep({ items }: { items: Array<string | undefined> }) {
  const parts = items.map(clean).filter(Boolean);
  if (!parts.length) return null;
  return <>{parts.join("     ")}</>;
}

function SectionBar({ title }: { title: string }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          background: "#d9e6f5",
          border: "1px solid #111827",
          padding: "3px 8px",
          fontWeight: 900,
          letterSpacing: 0.3,
          fontSize: 13,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function SubSectionLabel({ title }: { title: string }) {
  const t = clean(title);
  if (!t) return null;
  return (
    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900 }}>
      {t}
    </div>
  );
}

function BulletList({ items }: { items?: string[] }) {
  const arr = (items ?? []).map(clean).filter(Boolean);
  if (!arr.length) return null;

  return (
    <ul
      style={{
        marginTop: 4,
        marginBottom: 0,
        paddingLeft: 18,
        listStyleType: "disc",
        listStylePosition: "outside",
      }}
    >
      {arr.map((b, i) => (
        <li key={i} style={{ fontSize: 11.2, lineHeight: 1.32, marginBottom: 3 }}>
          <RichText text={b} />
        </li>
      ))}
    </ul>
  );
}

function ThinRowBar({
  left,
  middle,
  right,
}: {
  left: string;
  middle?: string;
  right?: string;
}) {
  return (
    <div
      style={{
        marginTop: 8,
        background: "#e9f1fb",
        border: "1px solid #111827",
        padding: "3px 8px",
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        alignItems: "baseline",
      }}
    >
      <div style={{ fontSize: 12.2, fontWeight: 900, minWidth: 0 }}>
        <RichText text={left} />
        {clean(middle) ? (
          <span style={{ fontWeight: 700 }}>
            {" "}
            | <RichText text={middle} />
          </span>
        ) : null}
        {clean(right) ? (
          <span style={{ fontWeight: 700 }}> | <RichText text={right} /></span>
        ) : null}
      </div>
    </div>
  );
}

/* =========================
   Component
========================= */

export default function Consulting1Template(props: Consulting1TemplateProps) {
  const header = props.header ?? { name: "" };

  const name = clean(header.name);
  const email = clean(header.email);
  const linkedin = clean(header.linkedin);
  const phone = clean(header.phone);

  const summary = clean(props.summary);

  const workProfile = props.workProfile;
  const wpHeadlineLeft = clean(workProfile?.headlineLeft);
  const wpHeadlineRight = clean(workProfile?.headlineRight);
  const wpSummaryLine = clean(workProfile?.summaryLine);
  const wpLines = (workProfile?.lines ?? []).filter(
    (l) => clean(l?.label) || clean(l?.value)
  );

  const workHeading = clean(props.workExperienceHeading) || "WORK EXPERIENCE";
  const workHeadingRight =
    clean(props.workExperienceHeadingRight) || "";

  const roles = Array.isArray(props.roles) ? props.roles : [];

  const eduHeading = clean(props.educationHeading) || "EDUCATION";
  const education = Array.isArray(props.education) ? props.education : [];

  const initHeading =
    clean(props.initiativesHeading) || "ENTREPRENEURIAL INITIATIVES";
  const initiatives = Array.isArray(props.initiatives) ? props.initiatives : [];

  return (
    <div
      style={{
        width: "210mm",
        minHeight: "297mm",
        height: "auto",
        overflow: "visible",
        background: "#ffffff",
        color: "#111827",
        fontFamily: "Times New Roman, Georgia, serif", // closer to the screenshot vibe
        padding: "12mm 12mm 12mm 12mm",
        boxSizing: "border-box",
      }}
    >
      {/* ================= HEADER ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase" }}>
          {name || "YOUR NAME"}
        </div>

        <div style={{ fontSize: 12, textAlign: "center", minWidth: 0 }}>
          <RichText text={email} />
        </div>

        <div style={{ fontSize: 12, textAlign: "right" }}>
          <RichText text={phone} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          marginTop: 2,
          alignItems: "baseline",
        }}
      >
        <div style={{ fontSize: 12, color: "#0b5cff" }}>
          <RichText text={linkedin} />
        </div>
        <div style={{ fontSize: 12, textAlign: "right" }} />
      </div>

      {summary && (
        <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.25 }}>
          <span style={{ fontWeight: 900 }}>Summary:</span>{" "}
          <RichText text={summary} />
        </div>
      )}

      {/* ============== WORK EXPERIENCE SECTION ============== */}
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "baseline",
            background: "#d9e6f5",
            border: "1px solid #111827",
            padding: "4px 8px",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 13, textTransform: "uppercase" }}>
            {workHeading}
          </div>
          {workHeadingRight ? (
            <div style={{ fontWeight: 800, fontSize: 12 }}>
              <RichText text={workHeadingRight} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Profile lines under WORK EXPERIENCE (like screenshot: areas/sectors/tools) */}
      {(wpHeadlineLeft || wpHeadlineRight || wpSummaryLine || wpLines.length > 0) && (
        <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.25 }}>
          {(wpHeadlineLeft || wpHeadlineRight) && (
            <div>
              <span style={{ fontWeight: 900 }}>
                <RichText text={wpHeadlineLeft} />
              </span>{" "}
              {wpHeadlineRight ? (
                <span style={{ fontWeight: 700 }}>
                  <RichText text={` ${wpHeadlineRight}`} />
                </span>
              ) : null}
            </div>
          )}

          {wpSummaryLine && (
            <div style={{ marginTop: 2 }}>
              <RichText text={wpSummaryLine} />
            </div>
          )}

          {wpLines.map((l, i) => (
            <div key={i} style={{ marginTop: 2 }}>
              <span style={{ fontWeight: 900 }}>
                <RichText text={`${clean(l.label)} —`} />
              </span>{" "}
              <RichText text={clean(l.value)} />
            </div>
          ))}
        </div>
      )}

      {/* ================= ROLES / COMPANIES ================= */}
      <div style={{ marginTop: 10 }}>
        {roles.map((r, idx) => {
          const company = clean(r.company);
          const location = clean(r.location);
          const role = clean(r.role);
          const dateRange = clean(r.dateRange);
          const sectionTitle = clean(r.sectionTitle);

          const engagements = (r.engagements ?? []).filter(
            (e) => clean(e.title) || (e.bullets ?? []).some((b) => clean(b))
          );

          const subSections = (r.subSections ?? []).filter(
            (s) => clean(s.title) || (s.bullets ?? []).some((b) => clean(b))
          );

          return (
            <div key={`${company}-${idx}`} style={{ marginBottom: 10 }}>
              {/* Company row bar like: "Kearney, Dubai, UAE | Manager (prev...)     Jun’18 - Present" */}
              <div
                style={{
                  marginTop: 10,
                  background: "#e9f1fb",
                  border: "1px solid #111827",
                  padding: "3px 8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 12.2, fontWeight: 900, minWidth: 0 }}>
                  <RichText text={company} />
                  {location ? (
                    <span style={{ fontWeight: 700 }}>
                      {", "}
                      <RichText text={location} />
                    </span>
                  ) : null}
                  {role ? (
                    <span style={{ fontWeight: 900 }}>
                      {" "}
                      | <RichText text={role} />
                    </span>
                  ) : null}
                </div>

                {dateRange ? (
                  <div style={{ fontSize: 11.8, fontStyle: "italic", whiteSpace: "nowrap" }}>
                    <RichText text={dateRange} />
                  </div>
                ) : null}
              </div>

              {/* Select Client Engagementments */}
              {sectionTitle && (
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900 }}>
                  <RichText text={sectionTitle} />
                </div>
              )}

              {/* Engagements list */}
              {engagements.map((e, ei) => {
                const title = clean(e.title);
                const locRight = clean(e.locationRight);
                return (
                  <div key={`${title}-${ei}`} style={{ marginTop: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "baseline",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 900 }}>
                        <RichText text={title} />
                      </div>
                      {locRight ? (
                        <div style={{ fontSize: 11.5, fontStyle: "italic", whiteSpace: "nowrap" }}>
                          <RichText text={locRight} />
                        </div>
                      ) : null}
                    </div>

                    <BulletList items={e.bullets} />
                  </div>
                );
              })}

              {/* Optional extra sub-sections */}
              {subSections.map((s, si) => (
                <div key={`${s.title}-${si}`} style={{ marginTop: 6 }}>
                  <SubSectionLabel title={s.title} />
                  <BulletList items={s.bullets} />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ================= EDUCATION ================= */}
      <SectionBar title={eduHeading} />

      <div style={{ marginTop: 8 }}>
        {education.map((ed, i) => {
          const inst = clean(ed.institute);
          const deg = clean(ed.degreeLine);
          const loc = clean(ed.location);
          const dr = clean(ed.dateRange);
          const bullets = (ed.bullets ?? []).map(clean).filter(Boolean);

          return (
            <div key={`${inst}-${i}`} style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "baseline",
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 900, minWidth: 0 }}>
                  <RichText text={inst} />
                  {loc ? <span style={{ fontWeight: 700 }}>{` | ${loc}`}</span> : null}
                  {deg ? <span style={{ fontWeight: 700 }}>{` | ${deg}`}</span> : null}
                </div>

                {dr ? (
                  <div style={{ fontStyle: "italic", whiteSpace: "nowrap" }}>
                    <RichText text={dr} />
                  </div>
                ) : null}
              </div>

              {bullets.length ? (
                <div style={{ marginTop: 2 }}>
                  <BulletList items={bullets} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* ================= ENTREPRENEURIAL INITIATIVES ================= */}
      {initiatives.length ? <SectionBar title={initHeading} /> : null}

      <div style={{ marginTop: initiatives.length ? 8 : 0 }}>
        {initiatives.map((it, i) => {
          const left = clean(it.titleLeft);
          const date = clean(it.dateRight);
          const sub = clean(it.subtitle);
          const bullets = (it.bullets ?? []).map(clean).filter(Boolean);

          return (
            <div key={`${left}-${i}`} style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "baseline",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 900, minWidth: 0 }}>
                  <RichText text={left} />
                </div>

                {date ? (
                  <div style={{ fontSize: 11.5, fontStyle: "italic", whiteSpace: "nowrap" }}>
                    <RichText text={date} />
                  </div>
                ) : null}
              </div>

              {sub ? (
                <div style={{ marginTop: 2, fontSize: 11.3, lineHeight: 1.25 }}>
                  <RichText text={sub} />
                </div>
              ) : null}

              {bullets.length ? <BulletList items={bullets} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
