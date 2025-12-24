"use client";

import React from "react";

export type TechVC1Header = {
  name: string;
  title?: string;
  addressLabel?: string;
  address?: string;
  phoneLabel?: string;
  phone?: string;
  emailLabel?: string;
  email?: string;
  linkedinLabel?: string;
  linkedin?: string;
  githubLabel?: string;
  github?: string;
  wwwLabel?: string;
  portfolio?: string;
  wwwHint?: string;
};

export type TechVC1ExperienceItem = {
  dateRange?: string;
  role: string;
  company?: string;
  location?: string;
  bullets?: string[];
};

export type TechVC1EducationItem = {
  dateRange?: string;
  degreeLine: string;
  institute?: string;
  meta?: string;
};

export type TechVC1AchievementItem = {
  bullets: string[];
};

export type TechVC1SkillsRow = {
  label: string;
  value: string;
};

export type TechVC1Skills = {
  heading?: string;
  rows: TechVC1SkillsRow[];
};

export type TechVC1TemplateProps = {
  header: TechVC1Header;
  summary?: string;
  experience?: TechVC1ExperienceItem[];
  skills?: TechVC1Skills;
  education?: TechVC1EducationItem[];
  achievements?: TechVC1AchievementItem[];
  page?: 0 | 1 | 2;
  compact?: boolean;
};

function clean(v: unknown) {
  return (v ?? "").toString().trim();
}

function clampOneLine(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeLinkDisplay(raw: string) {
  const s0 = clampOneLine(raw);
  if (!s0) return "";
  let s = s0;
  s = s.replace(/^https?:\/\//i, "");
  s = s.replace(/^www\./i, "");
  s = s.replace(/\/+$/g, "");
  if (s.toLowerCase().startsWith("linkedin.com/")) {
    const m = s.match(/^linkedin\.com\/in\/([^/?#]+)/i);
    if (m?.[1]) {
      const slug = m[1].replace(/-+$/g, "");
      return `linkedin.com/in/${slug}`;
    }
    return "linkedin.com";
  }
  if (s.toLowerCase().startsWith("github.com/")) return s;
  return s;
}

function renderBoldMarkdown(text: string) {
  const s = text ?? "";
  const parts = s.split("**");
  if (parts.length === 1) return s;
  return parts.map((p, i) => {
    const isBold = i % 2 === 1;
    return isBold ? (
      <strong key={i} className="font-semibold text-slate-900">{p}</strong>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    );
  });
}

function IconTile({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
  return (
    <div aria-label={ariaLabel} className="h-11 w-11 shrink-0 rounded-md bg-[#2f3b52] flex items-center justify-center">
      {children}
    </div>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 8h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 12h16" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M20 12l-8 8-10-10V4h6l12 8Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7.5 7.5h.01" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function GraduationIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 8l9-4 9 4-9 4-9-4Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M21 10v6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 12v5c0 .5 2.2 3 5 3s5-2.5 5-3v-5" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function AwardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 15a6 6 0 1 0-6-6 6 6 0 0 0 6 6Z" stroke="white" strokeWidth="1.8" />
      <path d="M9 14.5 7 22l5-2 5 2-2-7.5" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function Page({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  const pad = compact ? "p-8" : "p-10";
  return (
    <div className={["w-full bg-white text-slate-900", "aspect-[210/297]", "overflow-visible", "border border-slate-200", pad].join(" ")}>
      {children}
    </div>
  );
}

function HeaderBlock({ header, compact }: { header: TechVC1Header; compact?: boolean }) {
  const addressLabel = clean(header.addressLabel) || "Address";
  const phoneLabel = clean(header.phoneLabel) || "Phone";
  const emailLabel = clean(header.emailLabel) || "E-mail";
  const linkedinLabel = clean(header.linkedinLabel) || "LinkedIn";
  const githubLabel = clean(header.githubLabel) || "GitHub";
  const wwwLabel = clean(header.wwwLabel) || "WWW";
  const name = clean(header.name) || "Your Name";
  const title = clean(header.title);
  const address = clean(header.address) || "Dehradun, India 248001";
  const phone = clampOneLine(clean(header.phone));
  const email = clampOneLine(clean(header.email));
  const linkedinRaw = clampOneLine(clean(header.linkedin));
  const githubRaw = clampOneLine(clean(header.github));
  const portfolioRaw = clampOneLine(clean(header.portfolio));
  const wwwHint = clean(header.wwwHint) || "Bold Profile";
  const linkedinText = normalizeLinkDisplay(linkedinRaw);
  const githubText = normalizeLinkDisplay(githubRaw);

  const toHref = (v: string) => {
    const s = v.trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    return `https://${s.replace(/^www\./i, "")}`;
  };

  const PlainRow = ({ label, value }: { label: string; value: string }) => (
    <div className="grid grid-cols-[68px_1fr] gap-2 items-center">
      <div className="font-semibold text-slate-900">{label}</div>
      <div className="min-w-0 text-slate-700 truncate" title={value}>{value || "—"}</div>
    </div>
  );

  const LinkRow = ({ label, href, buttonText }: { label: string; href: string; buttonText: string }) => (
    <div className="grid grid-cols-[68px_1fr] gap-2 items-center">
      <div className="font-semibold text-slate-900">{label}</div>
      <div className="min-w-0">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 hover:underline underline-offset-2"
            title={buttonText === "LinkedIn" ? linkedinText || wwwHint : buttonText === "GitHub" ? githubText || wwwHint : wwwHint}>
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {buttonText}
          </a>
        ) : (
          <span className="text-slate-500 text-[11px]">—</span>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="leading-none">
        <div className={["tracking-tight", "text-[#2f3b52]", compact ? "text-[42px]" : "text-[44px]", "font-bold"].join(" ")}>{name}</div>
        <div className={["mt-2", "text-[#5b6b80]", compact ? "text-[17px]" : "text-[17.5px]", "font-medium"].join(" ")}>{title}</div>
      </div>
      <div className={["mt-4 grid grid-cols-2", compact ? "gap-x-8 gap-y-2 text-[12px]" : "gap-x-10 gap-y-2 text-[12.5px]"].join(" ")}>
        <div className="space-y-1.5 min-w-0">
          <PlainRow label={addressLabel} value={address} />
          <PlainRow label={phoneLabel} value={phone} />
          <PlainRow label={emailLabel} value={email} />
        </div>
        <div className="space-y-1.5 min-w-0">
          <LinkRow label={linkedinLabel} href={toHref(linkedinRaw || linkedinText)} buttonText="LinkedIn" />
          <LinkRow label={githubLabel} href={toHref(githubRaw || githubText)} buttonText="GitHub" />
          <div className="grid grid-cols-[68px_1fr] gap-2 items-center">
            <div className="font-semibold text-slate-900">{wwwLabel}</div>
            <div className="min-w-0">
              {portfolioRaw ? (
                <a href={toHref(portfolioRaw)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 hover:underline underline-offset-2"
                  title={normalizeLinkDisplay(portfolioRaw) || wwwHint}>
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Portfolio
                </a>
              ) : (
                <span className="text-slate-500 text-[11px]">—</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBlock({ summary, compact }: { summary?: string; compact?: boolean }) {
  const text = clean(summary);
  if (!text) return null;
  return (
    <p className={["mt-5 text-slate-700 leading-[1.5]", compact ? "text-[12.5px]" : "text-[12.75px]"].join(" ")}>{text}</p>
  );
}

function SectionTitle({ icon, title, compact }: { icon: React.ReactNode; title: string; compact?: boolean }) {
  return (
    <div className="mt-7 flex items-center gap-3">
      {icon}
      <div className={["text-[#2f3b52]", compact ? "text-[18px]" : "text-[18.5px]", "font-bold"].join(" ")}>{title}</div>
    </div>
  );
}

function ExperienceList({ items, compact, startIndex = 0, endIndexExclusive }: { items: TechVC1ExperienceItem[]; compact?: boolean; startIndex?: number; endIndexExclusive?: number }) {
  const slice = items.slice(startIndex, endIndexExclusive ?? items.length);
  return (
    <div className="mt-3 space-y-6">
      {slice.map((it, idx) => (
        <div key={`${it.role}-${idx}`} className="grid grid-cols-[92px_1fr] gap-6">
          <div className={["text-slate-600", compact ? "text-[11px]" : "text-[11.5px]"].join(" ")}>{clean(it.dateRange)}</div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-[15px] leading-tight">{clean(it.role)}</div>
            <div className={["mt-1 text-slate-700", compact ? "text-[11.5px]" : "text-[12px]"].join(" ")}>
              {clean(it.company)}{clean(it.company) && clean(it.location) ? "  " : ""}{clean(it.location)}
            </div>
            {Array.isArray(it.bullets) && it.bullets.length > 0 && (
              <ul className={["mt-2 list-disc pl-5 space-y-1.5 text-slate-700", compact ? "text-[12px]" : "text-[12.5px]"].join(" ")}>
                {it.bullets.map((b, bi) => (
                  <li key={bi} className="leading-[1.45]">{renderBoldMarkdown(b)}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillsBlock({ skills, compact }: { skills?: TechVC1Skills; compact?: boolean }) {
  const rows = skills?.rows ?? [];
  if (!rows.length) return null;
  return (
    <div className="mt-3 space-y-1.5">
      {rows.map((r, idx) => (
        <div key={`${r.label}-${idx}`} className={["grid grid-cols-[220px_1fr] gap-4", compact ? "text-[12px]" : "text-[12.5px]"].join(" ")}>
          <div className="text-slate-800"><span className="font-medium">{clean(r.label)}:</span></div>
          <div className="text-slate-700">{clean(r.value)}</div>
        </div>
      ))}
    </div>
  );
}

function EducationBlock({ items, compact }: { items: TechVC1EducationItem[]; compact?: boolean }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 space-y-3.5">
      {items.map((e, idx) => (
        <div key={`${e.degreeLine}-${idx}`} className="grid grid-cols-[92px_1fr] gap-6">
          <div className={["text-slate-600", compact ? "text-[11px]" : "text-[11.5px]"].join(" ")}>{clean(e.dateRange)}</div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-[14px]">{clean(e.degreeLine)}</div>
            <div className={["mt-1 text-slate-700", compact ? "text-[11.5px]" : "text-[12px]"].join(" ")}>{clean(e.institute)}</div>
            {clean(e.meta) && <div className={["mt-1 text-slate-700", compact ? "text-[11.5px]" : "text-[12px]"].join(" ")}>{clean(e.meta)}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AccoladesBlock({ items, compact }: { items: TechVC1AchievementItem[]; compact?: boolean }) {
  const bullets = items?.flatMap((i) => (Array.isArray(i.bullets) ? i.bullets : [])) ?? [];
  if (!bullets.length) return null;
  return (
    <ul className={["mt-3 list-disc pl-6 space-y-1.5 text-slate-700", compact ? "text-[12px]" : "text-[12.5px]"].join(" ")}>
      {bullets.map((b, idx) => (
        <li key={idx} className="leading-[1.45]">{renderBoldMarkdown(b)}</li>
      ))}
    </ul>
  );
}

export default function TechVC1Template(props: TechVC1TemplateProps) {
  const header: TechVC1Header = props.header ?? ({} as any);
  const experience = Array.isArray(props.experience) ? props.experience : [];
  const education = Array.isArray(props.education) ? props.education : [];
  const achievements = Array.isArray(props.achievements) ? props.achievements : [];

  const page1ExpEnd = Math.min(2, experience.length);

  const renderPage0 = () => (
    <Page compact={props.compact}>
      <HeaderBlock header={header} compact={props.compact} />
      <SummaryBlock summary={props.summary} compact={props.compact} />
      <SectionTitle compact={props.compact} icon={<IconTile ariaLabel="Professional Journey"><BriefcaseIcon /></IconTile>} title="Professional Journey" />
      <ExperienceList compact={props.compact} items={experience} startIndex={0} endIndexExclusive={page1ExpEnd} />
    </Page>
  );

  const renderPage1 = () => (
    <Page compact={props.compact}>
      <div className="pt-1" />
      <ExperienceList compact={props.compact} items={experience} startIndex={page1ExpEnd} />
    </Page>
  );

  const renderPage2 = () => (
    <Page compact={props.compact}>
      <SectionTitle compact={props.compact} icon={<IconTile ariaLabel="Skills"><TagIcon /></IconTile>} title={clean(props.skills?.heading) || "Skills"} />
      <SkillsBlock skills={props.skills} compact={props.compact} />
      <SectionTitle compact={props.compact} icon={<IconTile ariaLabel="Education"><GraduationIcon /></IconTile>} title="Education" />
      <EducationBlock items={education} compact={props.compact} />
      <SectionTitle compact={props.compact} icon={<IconTile ariaLabel="Professional Accolades"><AwardIcon /></IconTile>} title="Professional Accolades" />
      <AccoladesBlock items={achievements} compact={props.compact} />
    </Page>
  );

  if (props.page === 0) return renderPage0();
  if (props.page === 1) return renderPage1();
  if (props.page === 2) return renderPage2();

  return (
    <div className="w-full space-y-6">
      {renderPage0()}
      {renderPage1()}
      {renderPage2()}
    </div>
  );
}