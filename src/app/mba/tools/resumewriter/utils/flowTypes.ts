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
  // tech-classic steps
  | "tech-header-summary"
  | "tech-skills"
  | "tech-experience"
  | "tech-education"
  | "tech-achievements"
  // consulting-1 steps
  | "c1-header-summary"
  | "c1-work-experience"
  | "c1-education"
  | "c1-entrepreneurial"
  // tech-vc1 steps
  | "vc1-header-summary"
  | "vc1-experience"
  | "vc1-skills"
  | "vc1-education"
  | "vc1-achievements";

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
    /* -------------------------
       Consulting Classic blocks
    -------------------------- */
    articleSectionTitle?: string;
    articleHeaderRight?: string;
    articleBlocks?: any[];
    leadershipTitle?: string;
    leadershipBlocks?: any[];

    /* -------------------------
       Tech Classic payloads
    -------------------------- */
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
    techJobDescription?: string;
    techSkills?: any;
    techExperience?: any[];
    techEducation?: any[];
    techAchievements?: any[];

    /* -------------------------
       Consulting 1 payloads
    -------------------------- */
    consulting1Header?: {
      fullName?: string;
      title?: string;
      phone?: string;
      email?: string;
      location?: string;
      linkedin?: string;
    };
    consulting1Summary?: { text?: string };
    consulting1WorkExperience?: any;
    consulting1Education?: any;
    consulting1Entrepreneurial?: any;
    consulting1Download?: {
      note?: string;
      savedAt?: string;
    };

    /* -------------------------
       Tech VC1 payloads
       (NOTE: keep these in sync with your preview adapter)
    -------------------------- */
    techVC1Header?: any;
    techVC1Summary?: any;

    // ✅ should be an array of experience blocks (Professional Journey)
    techVC1Experience?: any[];

    // ✅ skills block
    techVC1Skills?: any;

    techVC1Education?: any[];
    techVC1Achievements?: any[];

    techVC1Download?: {
      note?: string;
      savedAt?: string;
    };
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
