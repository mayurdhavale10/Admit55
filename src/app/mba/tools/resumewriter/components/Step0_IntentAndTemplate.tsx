// src/app/mba/tools/resumewriter/components/Step0_IntentAndTemplate.tsx
"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";

// ✅ modular tile
import TemplateTile from "./TemplateTile";

// ✅ per-template previews
import ConsultingClassicPreview from "./resume-templates/consulting-classic/ConsultingClassicPreview";
import TechClassicPreview from "./resume-templates/tech-classic/TechClassicPreview";
import Classic1Preview from "./resume-templates/consulting-1/Classic1Preview";
import TechVC1Preview from "./resume-templates/tech-vc1/TechVC1Preview";

// ✅ single source of truth for types
import type {
  IntentTemplateValues,
  CareerPath,
  ResumeGoal,
  ExperienceLevel,
} from "../utils/flowTypes";

/* =========================
   PROPS
========================= */

type Step0Props = {
  value: IntentTemplateValues;
  onChange: (value: IntentTemplateValues) => void;
  onNext: () => void;
  isSubmitting?: boolean;
};

/* =========================
   TEMPLATE OPTIONS
========================= */

const TEMPLATE_OPTIONS = [
  {
    id: "consulting_classic",
    label: "Consulting Classic",
    description: "Sharp, impact-first bullets. Perfect for MBB / strategy roles.",
    badge: "Recommended",
  },
  {
    id: "consulting_1",
    label: "Consulting 1",
    description:
      "Akshay-style consulting profile layout: clean header + compact sections + strong highlights.",
  },
  {
    id: "tech_classic",
    label: "Tech Classic",
    description:
      "Backend/SWE style with Summary → Skills → Experience → Education → Achievements.",
  },
  {
    id: "tech_vc1",
    label: "Tech VC1",
    description:
      "VC/Startup-ready tech profile: tight story, sharp summary, clean sections (Rahul-style target).",
    badge: "New",
  },
  {
    id: "finance_tight",
    label: "Finance Tight",
    description: "Dense, transaction-heavy style ideal for IB / markets.",
  },
  {
    id: "general_mba",
    label: "General MBA",
    description: "Balanced layout for multi-path candidates.",
  },
] as const;

type TemplateId = (typeof TEMPLATE_OPTIONS)[number]["id"];

function getRecommendedTemplateId(
  careerPath: CareerPath | null
): TemplateId | null {
  if (!careerPath) return null;

  switch (careerPath) {
    case "consulting":
      return "consulting_classic";

    case "tech_engineering":
      return "tech_vc1";

    case "finance":
      return "finance_tight";

    case "product_management":
    case "operations":
    default:
      return "general_mba";
  }
}

/* =========================
   SAMPLE DATA FOR PREVIEW
========================= */

const sampleConsultingResumeData = {
  header: {
    name: "Vaishali Gupta",
    gender: "Female",
    university: "IIM Ahmedabad",
    email: "email@example.com",
    phone: "+91-1234567890",
    location: "Dubai (Relocating to Mumbai)",
  },
  metaBar: [
    "Cars24 Arabia (UAE)",
    "Alvarez & Marsal (India)",
    "IIM Ahmedabad",
    "Chartered Accountant",
    "Grant Thornton Bharat LLP",
  ],
};

const sampleConsulting1Data = {
  header: {
    name: "AKSHAY GOEL",
    email: "Akshay10.tu@gmail.com",
    linkedin: "LinkedIn",
    phone: "+971 566895746",
  },
  summary:
    "Digital & Analytics expert with management consulting & entrepreneurial background; international work experience of 8+ years; alumnus of Indian School of Business (ISB); currently working as Engagement Manager with Kearney.",
};

// ✅ Rahul-style sample for Tech VC1 tile preview
const sampleTechVC1Data = {
  header: {
    name: "RAHUL GUPTA",
    title: "Senior Software Engineer",
    phone: "+91 8126621231",
    email: "guptarahul0319@gmail.com",
    location: "Bengaluru, India",
    linkedin: "linkedin.com/in/rahul-gupta",
    github: "github.com/rahulgupta",
    portfolio: "your-portfolio.com",
  },
  summary:
    "Experienced Java backend developer with 6+ years of expertise in designing and developing scalable, high-performance applications. Proficient in building microservices, implementing RESTful APIs, and database management, with strong problem-solving skills and a collaborative approach to delivering quality software solutions.",
  skills: [
    {
      label: "Languages & Frameworks",
      text: "Java (Core, EE), Spring Boot, Dropwizard, JPA, REST",
    },
    {
      label: "Cloud & DevOps",
      text: "AWS, GCP, Kubernetes, Docker, Jenkins, Serverless, GitHub, Gradle, Maven",
    },
    {
      label: "Databases",
      text: "PostgreSQL, SQL, MongoDB, Cassandra, Redis, Elasticsearch",
    },
  ],
  experiences: [
    {
      company: "WrkSpot",
      location: "Remote",
      role: "Technical Lead",
      dateRange: "06/2023 – Present",
      bullets: [
        "Designed and implemented an online timesheet management system with 10 microservices and IoT integration, enabling better workforce tracking and reducing leakage.",
        "Developed a reusable framework and internal tooling that reduced development time by ~50% across multiple services.",
      ],
    },
    {
      company: "Meesho",
      location: "Bengaluru, India",
      role: "Software Development Engineer 2",
      dateRange: "04/2022 – 05/2023",
      bullets: [
        "Delivered a microservices-based project in 90 days supporting peak traffic; improved API responsiveness and reliability.",
      ],
    },
  ],
  education: [
    {
      institute: "Your University",
      location: "India",
      degreeLine: "B.Tech — Computer Science",
      dateRange: "2016 – 2020",
      bullets: ["CGPA: 8.4/10 (optional)", "Relevant coursework / projects (optional)"],
    },
  ],
  achievements: [
    {
      title: "Employee of the Month",
      dateRange: "Sep 2023",
      bullets: ["Recognized for high-impact delivery and ownership."],
    },
  ],
};

/* =========================
   OPTION CARD
========================= */

type OptionCardProps = {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  badge?: string;
};

const OptionCard: React.FC<OptionCardProps> = ({
  label,
  description,
  selected,
  onClick,
  badge,
}) => {
  const handleClick = () => {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        // @ts-ignore
        navigator.vibrate(20);
      }
    } catch {
      // ignore
    }
    onClick();
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.18 }}
      className={`
        relative flex flex-col items-start gap-2 text-left rounded-2xl px-5 py-4
        backdrop-blur-xl border transition-all
        ${
          selected
            ? `
              border-teal-400/70 bg-white/80 shadow-[0_16px_55px_rgba(15,23,42,0.18)]
              dark:border-teal-400/80 dark:bg-slate-900/90 dark:shadow-[0_26px_80px_rgba(0,0,0,0.9)]
            `
            : `
              border-white/10 bg-white/60 hover:border-teal-300/60 shadow-[0_10px_35px_rgba(15,23,42,0.13)]
              dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-teal-400/70 dark:shadow-[0_22px_70px_rgba(0,0,0,0.85)]
            `
        }
      `}
    >
      <span className="text-base font-semibold text-[#002b5b] dark:text-teal-100">
        {label}
      </span>

      {description && (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {description}
        </span>
      )}

      {badge && (
        <span className="absolute right-4 top-4 rounded-full bg-teal-500/90 px-2.5 py-1 text-xs font-semibold text-slate-950 shadow-[0_6px_18px_rgba(45,212,191,0.55)]">
          {badge}
        </span>
      )}
    </motion.button>
  );
};

/* =========================
   PREVIEW SWITCHER
========================= */

function TemplatePreview({ templateId }: { templateId: string }) {
  if (templateId === "consulting_classic") {
    return (
      <ConsultingClassicPreview
        data={{
          header: sampleConsultingResumeData.header,
          metaBar: sampleConsultingResumeData.metaBar,
        }}
      />
    );
  }

  if (templateId === "consulting_1") {
    return <Classic1Preview data={sampleConsulting1Data as any} />;
  }

  if (templateId === "tech_classic") {
    return <TechClassicPreview />;
  }

  if (templateId === "tech_vc1") {
    // ✅ Show Rahul-style sample (not blank)
    return <TechVC1Preview data={sampleTechVC1Data as any} />;
  }

  // placeholder (finance_tight / general_mba until previews exist)
  return (
    <div className="w-full aspect-[210/297] overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="px-8 pt-8">
        <div className="mb-6">
          <div className="h-3.5 w-2/3 rounded-full bg-teal-200/80 dark:bg-teal-400/80" />
          <div className="mt-3 h-2 w-1/4 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="space-y-3">
          <div className="h-2.5 w-5/6 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-2.5 w-4/6 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-2.5 w-3/4 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="mt-8 space-y-2">
          <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-2.5 w-11/12 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-2.5 w-5/6 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-2.5 w-3/4 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

/* =========================
   OPTIONS (typed)
========================= */

const CAREER_OPTIONS: Array<{
  id: CareerPath;
  label: string;
  description: string;
}> = [
  { id: "consulting", label: "Consulting", description: "MBB, Tier-2, strategy roles." },
  {
    id: "product_management",
    label: "Product Management",
    description: "PM, APM, product strategy.",
  },
  { id: "tech_engineering", label: "Tech / Engineering", description: "Software, data, infra." },
  { id: "finance", label: "Finance / IB / PE", description: "IB, PE, VC, markets." },
  {
    id: "operations",
    label: "Operations / General Mgmt",
    description: "Ops, supply chain, leadership.",
  },
  { id: "other", label: "Other", description: "Specify your path." },
];

const GOAL_OPTIONS: Array<{
  id: ResumeGoal;
  label: string;
  description: string;
}> = [
  { id: "new_role", label: "Get a new role", description: "External applications." },
  { id: "promotion", label: "Promotion", description: "Internal growth." },
  { id: "mba_admit", label: "MBA / Grad Admit", description: "School applications." },
  { id: "internship", label: "Internship", description: "Summer & off-cycle roles." },
  { id: "career_switch", label: "Career switch", description: "New field / role." },
  { id: "other", label: "Other", description: "Specify your aim." },
];

const EXPERIENCE_OPTIONS: Array<{ id: ExperienceLevel; label: string }> = [
  { id: "0_2", label: "0–2 years" },
  { id: "3_5", label: "3–5 years" },
  { id: "6_10", label: "6–10 years" },
  { id: "10_plus", label: "10+ years" },
];

/* =========================
   MAIN COMPONENT
========================= */

const Step0_IntentAndTemplate: React.FC<Step0Props> = ({
  value,
  onChange,
  onNext,
  isSubmitting,
}) => {
  const update = <K extends keyof IntentTemplateValues>(
    key: K,
    val: IntentTemplateValues[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  const recommendedTemplateId = getRecommendedTemplateId(value.careerPath);
  const recommendedTemplate = TEMPLATE_OPTIONS.find(
    (t) => t.id === recommendedTemplateId
  );

  useEffect(() => {
    if (!value.templateId && recommendedTemplateId) {
      update("templateId", recommendedTemplateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendedTemplateId]);

  const canContinue =
    !!value.careerPath &&
    !!value.goal &&
    !!value.experienceLevel &&
    !!value.templateId;

  const SECTIONS_AD = [
    {
      title: "A. Career path you're targeting",
      subtitle: "Choose the track that matches your target roles.",
      content: (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {CAREER_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.id}
                label={opt.label}
                description={opt.description}
                selected={value.careerPath === opt.id}
                onClick={() => update("careerPath", opt.id)}
              />
            ))}
          </div>

          {value.careerPath === "other" && (
            <input
              type="text"
              className="mt-4 w-full rounded-xl border border-white/10 bg-white/80 backdrop-blur-xl px-4 py-3 text-sm outline-none text-[#002b5b] placeholder:text-slate-400 focus:ring-2 ring-teal-400/30
                         dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-50 dark:placeholder:text-slate-500 dark:ring-teal-400/40"
              placeholder="Describe your path…"
              value={value.careerPathOther || ""}
              onChange={(e) => update("careerPathOther", e.target.value)}
            />
          )}
        </>
      ),
    },
    {
      title: "B. Goal of this resume",
      subtitle: "Control how assertive and focused the bullet structure becomes.",
      content: (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {GOAL_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.id}
                label={opt.label}
                description={opt.description}
                selected={value.goal === opt.id}
                onClick={() => update("goal", opt.id)}
              />
            ))}
          </div>

          {value.goal === "other" && (
            <input
              type="text"
              className="mt-4 w-full rounded-xl border border-white/10 bg-white/80 backdrop-blur-xl px-4 py-3 text-sm outline-none text-[#002b5b] placeholder:text-slate-400 focus:ring-2 ring-teal-400/30
                         dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-50 dark:placeholder:text-slate-500 dark:ring-teal-400/40"
              placeholder="Describe your goal…"
              value={value.goalOther || ""}
              onChange={(e) => update("goalOther", e.target.value)}
            />
          )}
        </>
      ),
    },
    {
      title: "C. Experience level",
      subtitle: "We tune tone, bullet depth, seniority signals.",
      content: (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {EXPERIENCE_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              label={opt.label}
              selected={value.experienceLevel === opt.id}
              onClick={() => update("experienceLevel", opt.id)}
            />
          ))}
        </div>
      ),
    },
    {
      title: "D. Optional — paste job description",
      subtitle: "We’ll tailor keywords, impact verbs, and story framing based on this.",
      content: (
        <>
          <textarea
            rows={6}
            className="w-full rounded-xl border border-white/10 bg-white/80 backdrop-blur-xl px-4 py-3 text-sm text-[#002b5b] outline-none focus:ring-2 ring-teal-400/30 placeholder:text-slate-400
                       dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-50 dark:placeholder:text-slate-500 dark:ring-teal-400/40"
            placeholder="Paste the job description here…"
            value={value.targetJobDescription || ""}
            onChange={(e) => update("targetJobDescription", e.target.value)}
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Tip: pick the one JD you care most about right now. You can add more in the JD step later.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="w-full pb-16 bg-transparent text-slate-900 dark:text-slate-50">
      {/* HEADER */}
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8 mb-14 space-y-3">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex px-5 py-1.5 rounded-full bg-teal-500/10 text-teal-300 text-xs md:text-sm font-semibold tracking-widest"
        >
          Step 0 of 10 · Foundation
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-extrabold text-[#002b5b] dark:text-slate-50"
        >
          Intent &amp; Template
        </motion.h2>

        <p className="text-base text-slate-600 dark:text-slate-300 max-w-3xl">
          Tell us what you&apos;re aiming for — we&apos;ll tune tone, structure and templates automatically.
        </p>
      </div>

      {/* A–D SECTIONS */}
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8 space-y-14">
        {SECTIONS_AD.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.04 }}
            className="relative p-8 rounded-3xl border border-white/10 bg-white/60 backdrop-blur-2xl shadow-[0_18px_60px_rgba(15,23,42,0.16)]
                       dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-[0_26px_90px_rgba(0,0,0,0.9)]"
          >
            <h3 className="text-xl md:text-2xl font-semibold text-[#002b5b] dark:text-slate-50 mb-1">
              {section.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              {section.subtitle}
            </p>
            {section.content}
          </motion.div>
        ))}
      </div>

      {/* E. TEMPLATE GALLERY */}
      <section className="mt-16 w-full overflow-hidden px-4 md:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#002b5b] dark:text-slate-50">
            E. Template suggestion &amp; choice
          </h3>

          {recommendedTemplate && (
            <p className="mt-3 text-sm md:text-base text-slate-500 dark:text-slate-400">
              Based on your answers so far, we recommend{" "}
              <span className="font-semibold text-teal-700 dark:text-teal-300">
                {recommendedTemplate.label}
              </span>
              .
            </p>
          )}
        </div>

        <div className="mt-10 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 max-w-6xl mx-auto">
          {TEMPLATE_OPTIONS.map((tpl) => {
            const isRecommended = tpl.id === recommendedTemplateId;
            const isSelected = value.templateId === tpl.id;

            const badge = isRecommended
              ? "Recommended"
              : isSelected
              ? "Selected"
              : (tpl as any).badge;

            return (
              <TemplateTile
                key={tpl.id}
                label={tpl.label}
                description={tpl.description}
                selected={isSelected}
                badge={badge}
                onClick={() => update("templateId", tpl.id as any)}
              >
                <TemplatePreview templateId={tpl.id} />
              </TemplateTile>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 mt-8">
          <p className="text-sm text-slate-700 dark:text-slate-400">
            Next:{" "}
            <span className="font-semibold text-slate-900 dark:text-teal-200">
              Step 1 — Basic Info
            </span>
          </p>

          <button
            type="button"
            onClick={onNext}
            disabled={!canContinue || isSubmitting}
            className={`
              inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition
              ${
                canContinue
                  ? "bg-[#002b5b] hover:bg-[#003b7a] shadow-[0_16px_40px_rgba(15,23,42,0.35)] dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-slate-950 dark:shadow-[0_18px_45px_rgba(45,212,191,0.65)]"
                  : "bg-slate-400 cursor-not-allowed shadow-none dark:bg-slate-600 dark:text-slate-200"
              }
            `}
          >
            {isSubmitting ? "Loading..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step0_IntentAndTemplate;
