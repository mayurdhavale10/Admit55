// src/app/mba/tools/resumewriter/utils/flowTypes.ts
"use client";

import type { ResumeTemplateId } from "../components/resume-templates";
import type { ResumeData } from "./resumeTypes";

/* =========================
   STEP IDs
========================= */

export type StepId =
  | "intent-template"
  // consulting/general/finance existing
  | "basic-info"
  | "education"
  | "experience"
  | "work-experience"
  | "scholastic-achievements"
  | "intern-or-article"
  | "leadership-extracurricular"
  | "download"
  // ✅ tech-classic steps
  | "tech-header-summary"
  | "tech-skills"
  | "tech-experience"
  | "tech-education"
  | "tech-achievements";

/* =========================
   STEP 0 TYPES (used by Step0_IntentAndTemplate.tsx)
========================= */

export type CareerPath =
  | "consulting"
  | "product_management"
  | "tech_engineering"
  | "finance"
  | "operations"
  | "other";

export type ResumeGoal =
  | "new_role"
  | "promotion"
  | "mba_admit"
  | "internship"
  | "career_switch"
  | "other";

export type ExperienceLevel = "0_2" | "3_5" | "6_10" | "10_plus";

export type IntentTemplateValues = {
  careerPath: CareerPath | null;
  careerPathOther?: string;

  goal: ResumeGoal | null;
  goalOther?: string;

  experienceLevel: ExperienceLevel | null;

  templateId: ResumeTemplateId | null;

  targetJobDescription?: string;
};

/* =========================
   DRAFT / INTENT
========================= */

export type ResumeIntent = {
  templateId?: ResumeTemplateId | null;
  [key: string]: any;
};

export type ResumeDraft = {
  intent?: ResumeIntent;
  resume?: Partial<ResumeData> & {
    // Existing optional blocks (consulting classic)
    articleSectionTitle?: string;
    articleHeaderRight?: string;
    articleBlocks?: any[];
    leadershipTitle?: string;
    leadershipBlocks?: any[];

    // ✅ Tech Classic step payloads (kept optional + non-breaking)
    techHeader?: {
      fullName?: string;
      title?: string;
      phone?: string;
      email?: string;
      location?: string;
      links?: {
        linkedin?: string;
        github?: string;
        portfolio?: string;
      };
    };
    techSummary?: { text?: string };
    techSkills?: any;
    techExperience?: any[];
    techEducation?: any[];
    techAchievements?: any[];
  };
};

/* =========================
   FLOW
========================= */

export type FlowContext = {
  templateId: ResumeTemplateId | null;
  intent?: ResumeIntent;
};

export type StepDef = {
  id: StepId;
  label: string;
  description?: string;
  when?: (ctx: FlowContext) => boolean;
};

export type TemplateFlow = {
  templateId: ResumeTemplateId;
  steps: StepDef[];
};

export function resolveSteps(flow: TemplateFlow, ctx: FlowContext): StepDef[] {
  const steps = Array.isArray(flow?.steps) ? flow.steps : [];
  return steps.filter((s) => (s.when ? !!s.when(ctx) : true));
}
