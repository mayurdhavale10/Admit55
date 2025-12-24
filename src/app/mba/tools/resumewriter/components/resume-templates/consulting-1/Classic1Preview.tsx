// src/app/mba/tools/resumewriter/components/resume-templates/consulting-1/Classic1Preview.tsx
"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// ✅ KEEP YOUR IMPORT STYLE
import Consulting1Template, {
  type Consulting1TemplateProps,
} from "./ClassicTemplate1";

/**
 * Preview wrapper:
 * - Provides a SAMPLE resume when user has no real data yet
 * - Merges data safely (empty strings don't override sample)
 * - Auto-scales to fit the preview panel (A4 width)
 * - Auto-measures height so the preview container doesn't cut content
 */

export type Consulting1PreviewProps = {
  data?: Consulting1TemplateProps;
};

const PAGE_W = 794; // A4 width approx at 96dpi
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function clean(v: unknown) {
  return (v ?? "").toString().trim();
}

function pickNonEmpty(primary: unknown, fallback: unknown) {
  const p = clean(primary);
  return p ? p : clean(fallback);
}

function isArr<T = unknown>(v: unknown): v is T[] {
  return Array.isArray(v);
}

export default function Classic1Preview({ data }: Consulting1PreviewProps) {
  const sample = useMemo<Consulting1TemplateProps>(() => {
    return {
      header: {
        name: "Akshay Goel",
        email: "akshay10.tu@gmail.com",
        linkedin: "LinkedIn",
        phone: "+971 566895746",
      },

      summary:
        "Digital & Analytics expert with **management consulting & entrepreneurial** background; international work experience of **8+ years**; alumnus of **Indian School of Business (ISB)**; currently working as Engagement Manager with Kearney",

      workExperienceHeading: "WORK EXPERIENCE",
      workExperienceHeadingRight: "(8+ years in Strategy and Analytics Consulting)",

      workProfile: {
        headlineLeft: "Management Consultant",
        summaryLine:
          "with experience in executing large scale business transformations across Middle East, SEA, EU regions",
        lines: [
          {
            label: "Areas of Expertise",
            value:
              "Digital Transformation, Data & Analytics Strategy, ESG transformation, Strategic Sourcing, Procurement",
          },
          {
            label: "Sectors",
            value:
              "SaaS Technology, Agribusiness, Oil & Gas, FMCG, E-commerce, Logistics 3PL, Financial Institutions, Startups",
          },
          {
            label: "Technical Expertise",
            value: "MS Ppt, Excel, SQL, Power BI, Coupa, SAS, VBA, R, MS Azure, Tableau",
          },
        ],
      },

      roles: [
        {
          company: "Kearney",
          location: "Dubai, UAE",
          role: "Manager (prev. A.T. Kearney)",
          dateRange: "Jun’18 – Present",
          sectionTitle: "Select Client Engagementments",
          engagements: [
            {
              title:
                "Capability Planning and Investment Strategy for Middle East based Govt. client",
              locationRight: "UAE",
              bullets: [
                "Led team of 5 to develop Capability Planning & design 10-year investment plan across people, fixed assets components",
                "Designed Org. Transformation data-driven platform to track current & target capabilities of organization and identify gap areas",
              ],
            },
            {
              title: "Anti-Fraud Transformation for Middle East based Financial Institute",
              locationRight: "UAE",
              bullets: [
                "Developed Anti-Fraud strategy by designing nation-wide awareness marketing campaigns & developing transaction level controls",
                "Led team of 4 to develop text analytics platform to identify fraud scenarios using Twitter data (Social Listening), complaints data",
              ],
            },
            {
              title:
                "Procurement Transformation and ESG supplier strategy for a Global Metals Client",
              locationRight: "UAE",
              bullets: [
                "Created AI driven Procurement tool – led team to 3 consultants to develop image scanning engine & SKU standardization tool",
                "Developed Supplier Sustainability Program to transform supplier award process by integrating KPIs across ESG, Pricing, SLA",
              ],
            },
            {
              title: "Marine Freight Sourcing Transformation for Global Agri-Business client",
              locationRight: "Singapore",
              bullets: [
                "Built spend cube, launched RFQ using Coupa Procurement Tool, conducted negotiations with >20 vendors; led to $9M savings",
                "Developed a comprehensive governance structure to evaluate supplier performance & compliance to rates, SLAs",
              ],
            },
          ],
          subSections: [
            {
              title: "Key Achievements:",
              bullets: [
                "Fast track promotion in 1.5 years (10/50 new hires); campus hiring lead; AI/ML firm-wide trainer (part of global expert panel)",
                "Authored articles for leading business magazines including Forbes, Entrepreneur on topics like building firm-wide data strategy",
              ],
            },
          ],
        },
      ],

      educationHeading: "EDUCATION",
      education: [
        {
          institute: "Indian School of Business (ISB)",
          degreeLine: "MBA | GPA: 3.6/4 | ISB Torch Bearer Award",
          dateRange: "Apr’17 – Apr’18",
          bullets: [
            "APAC Winner – Amazon; Campus Winner – EXL Challenge; National Winner – Consilium; National Finalist – Paytm",
          ],
        },
      ],

      initiativesHeading: "ENTREPRENEURIAL INITIATIVES",
      initiatives: [
        {
          titleLeft: "Author | 55 Successful ISB Essays and Their Analysis",
          dateRight: "Dec’19 – Dec’20",
          subtitle:
            "Authored a **best-selling** book for MBA aspirants; published on Amazon (sold ~1K+ copies within 1 year of launch, 4.5 rating)",
        },
      ],
    };
  }, []);

  /**
   * Safely decide whether to show sample or real data
   * + safely merge without crashing if arrays are wrong shapes.
   */
  const payload = useMemo<Consulting1TemplateProps>(() => {
    const d = data;
    if (!d) return sample;

    // ✅ normalize all arrays (prevents `.some is not a function`)
    const wpLines = isArr<{ label?: unknown; value?: unknown }>(d.workProfile?.lines)
      ? d.workProfile!.lines!
      : [];

    const roles = isArr<any>(d.roles) ? d.roles : [];
    const education = isArr<any>(d.education) ? d.education : [];
    const initiatives = isArr<any>(d.initiatives) ? d.initiatives : [];

    const headerHas =
      !!clean(d.header?.name) || !!clean(d.header?.email) || !!clean(d.header?.phone);

    const summaryHas = !!clean(d.summary);

    const workProfileHas =
      !!clean(d.workProfile?.headlineLeft) ||
      !!clean(d.workProfile?.headlineRight) ||
      !!clean(d.workProfile?.summaryLine) ||
      wpLines.some((x: { label?: unknown; value?: unknown }) => clean(x?.label) || clean(x?.value)); // ✅ typed x

    const rolesHas = roles.some((r: any) => {
      const engagements = isArr<any>(r?.engagements) ? r.engagements : [];
      const subs = isArr<any>(r?.subSections) ? r.subSections : [];

      const hasEng = engagements.some((e: any) => {
        const bullets = isArr<any>(e?.bullets) ? e.bullets : [];
        return clean(e?.title) || bullets.some((b: any) => clean(b));
      });

      const hasSub = subs.some((s: any) => {
        const bullets = isArr<any>(s?.bullets) ? s.bullets : [];
        return clean(s?.title) || bullets.some((b: any) => clean(b));
      });

      return clean(r?.company) || clean(r?.role) || clean(r?.dateRange) || hasEng || hasSub;
    });

    const educationHas = education.some((e: any) => {
      const bullets = isArr<any>(e?.bullets) ? e.bullets : [];
      return (
        clean(e?.institute) ||
        clean(e?.degreeLine) ||
        clean(e?.dateRange) ||
        bullets.some((b: any) => clean(b))
      );
    });

    const initiativesHas = initiatives.some((it: any) => {
      const bullets = isArr<any>(it?.bullets) ? it.bullets : [];
      return (
        clean(it?.titleLeft) ||
        clean(it?.subtitle) ||
        clean(it?.dateRight) ||
        bullets.some((b: any) => clean(b))
      );
    });

    const hasReal = headerHas || summaryHas || workProfileHas || rolesHas || educationHas || initiativesHas;
    if (!hasReal) return sample;

    // ---- Merge header field-by-field ----
    const mergedHeader = {
      name: pickNonEmpty(d.header?.name, sample.header.name),
      email: pickNonEmpty(d.header?.email, sample.header.email),
      linkedin: pickNonEmpty(d.header?.linkedin, sample.header.linkedin),
      phone: pickNonEmpty(d.header?.phone, sample.header.phone),
    };

    // ---- Work profile merge ----
    const incomingWpHasLines = wpLines.some(
      (x: { label?: unknown; value?: unknown }) => clean(x?.label) || clean(x?.value) // ✅ typed x
    );

    const mergedWorkProfile = {
      ...(sample.workProfile ?? {}),
      ...(d.workProfile ?? {}),
      headlineLeft: pickNonEmpty(d.workProfile?.headlineLeft, sample.workProfile?.headlineLeft),
      headlineRight: pickNonEmpty(d.workProfile?.headlineRight, sample.workProfile?.headlineRight),
      summaryLine: pickNonEmpty(d.workProfile?.summaryLine, sample.workProfile?.summaryLine),
      lines: incomingWpHasLines ? (d.workProfile?.lines as any) : (sample.workProfile?.lines as any),
    };

    const merged: Consulting1TemplateProps = {
      ...sample,
      ...d,
      header: mergedHeader,
      summary: clean(d.summary) ? d.summary : sample.summary,

      workExperienceHeading: pickNonEmpty(d.workExperienceHeading, sample.workExperienceHeading),
      workExperienceHeadingRight: pickNonEmpty(
        d.workExperienceHeadingRight,
        sample.workExperienceHeadingRight
      ),

      workProfile: mergedWorkProfile as any,

      // arrays: only use incoming if it has content, else sample
      roles: rolesHas ? (roles.length ? (roles as any) : (sample.roles as any)) : (sample.roles as any),
      education: educationHas
        ? (education.length ? (education as any) : (sample.education as any))
        : (sample.education as any),
      initiatives: initiativesHas
        ? (initiatives.length ? (initiatives as any) : (sample.initiatives as any))
        : (sample.initiatives as any),

      educationHeading: pickNonEmpty(d.educationHeading, sample.educationHeading),
      initiativesHeading: pickNonEmpty(d.initiativesHeading, sample.initiativesHeading),
    };

    return merged;
  }, [data, sample]);

  /* =========================
     Scaling + height measurement
  ========================= */

  const frameRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(0.72);
  const [scaledH, setScaledH] = useState<number>(700);

  // scale based on container width
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const computeScale = () => {
      const w = el.clientWidth;
      const s = clamp((w / PAGE_W) * 0.98, 0.2, 1);
      setScale(s);
    };

    computeScale();
    const ro = new ResizeObserver(() => computeScale());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // compute height based on actual rendered content
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const measure = () => setScaledH(sheet.scrollHeight * scale);

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(sheet);
    return () => ro.disconnect();
  }, [scale, payload]);

  return (
    <div className="w-full">
      <div
        ref={frameRef}
        className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden"
        style={{ height: Math.ceil(scaledH) + 24 }}
      >
        <div className="w-full flex justify-center items-start p-2">
          <div className="origin-top" style={{ transform: `scale(${scale})`, width: PAGE_W }}>
            <div ref={sheetRef}>
              <Consulting1Template {...payload} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
