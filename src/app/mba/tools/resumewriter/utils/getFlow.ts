// src/app/mba/tools/resumewriter/utils/getFlow.ts

import type { ResumeTemplateId } from "../components/resume-templates";
import { resolveSteps } from "./flowTypes";
import type { FlowContext, StepDef, TemplateFlow } from "./flowTypes";

/**
 * ✅ Local flow definitions
 * This list MUST include your new steps, otherwise "Next" won't ever reach them.
 */
const STEP_DEFS: Record<string, StepDef> = {
  "intent-template": {
    id: "intent-template",
    label: "Intent & Template",
    description: "Choose your template and goal",
  },
  "basic-info": {
    id: "basic-info",
    label: "Basic Info",
    description: "Name & contact",
  },
  education: {
    id: "education",
    label: "Education",
    description: "Degrees & schools",
  },
  experience: {
    id: "experience",
    label: "Experience",
    description: "Work history",
  },
  "work-experience": {
    id: "work-experience",
    label: "Work Experience",
    description: "Work history",
  },
  "scholastic-achievements": {
    id: "scholastic-achievements",
    label: "Scholastic Achievements",
    description: "Case competitions, certifications, wins",
  },

  // ✅ Step 5
  "intern-or-article": {
    id: "intern-or-article",
    label: "Articleship / Internship",
    description: "Firm/Org, duration, dates, roles & bullets",
  },

  // ✅ Step 6
  "leadership-extracurricular": {
    id: "leadership-extracurricular",
    label: "Leadership & Extracurricular",
    description: "PORs, clubs, initiatives, social service",
  },

  // ✅ Step 7 (FINAL)
  download: {
    id: "download",
    label: "Download",
    description: "Preview + export as PDF",
  },

  /* =========================
     ✅ TECH CLASSIC STEPS
  ========================= */

  "tech-header-summary": {
    id: "tech-header-summary",
    label: "Header & Summary",
    description: "Title, links, and a strong technical summary",
  },
  "tech-skills": {
    id: "tech-skills",
    label: "Skills",
    description: "Languages, frameworks, cloud/devops, databases, tools",
  },
  "tech-experience": {
    id: "tech-experience",
    label: "Experience",
    description: "Companies, roles, dates, impact bullets",
  },
  "tech-education": {
    id: "tech-education",
    label: "Education",
    description: "Degrees, institutes, scores, years",
  },
  "tech-achievements": {
    id: "tech-achievements",
    label: "Key Achievements",
    description: "Awards, recognitions, notable wins",
  },
};

const TEMPLATE_FLOWS_LOCAL: Record<ResumeTemplateId, TemplateFlow> = {
  consulting_classic: {
    templateId: "consulting_classic",
    steps: [
      STEP_DEFS["intent-template"],
      STEP_DEFS["basic-info"],
      STEP_DEFS["education"],

      // keep for compatibility
      STEP_DEFS["experience"],

      STEP_DEFS["scholastic-achievements"],

      STEP_DEFS["intern-or-article"],
      STEP_DEFS["leadership-extracurricular"],

      STEP_DEFS["download"],
    ],
  },

  finance_tight: {
    templateId: "finance_tight",
    steps: [
      STEP_DEFS["intent-template"],
      STEP_DEFS["basic-info"],
      STEP_DEFS["education"],
      STEP_DEFS["experience"],
      STEP_DEFS["scholastic-achievements"],
      STEP_DEFS["intern-or-article"],
      STEP_DEFS["leadership-extracurricular"],
      STEP_DEFS["download"],
    ],
  },

  general_mba: {
    templateId: "general_mba",
    steps: [
      STEP_DEFS["intent-template"],
      STEP_DEFS["basic-info"],
      STEP_DEFS["education"],
      STEP_DEFS["experience"],
      STEP_DEFS["scholastic-achievements"],
      STEP_DEFS["intern-or-article"],
      STEP_DEFS["leadership-extracurricular"],
      STEP_DEFS["download"],
    ],
  },

  product_modern: {
    templateId: "product_modern",
    steps: [
      STEP_DEFS["intent-template"],
      STEP_DEFS["basic-info"],
      STEP_DEFS["education"],
      STEP_DEFS["experience"],
      STEP_DEFS["scholastic-achievements"],
      STEP_DEFS["intern-or-article"],
      STEP_DEFS["leadership-extracurricular"],
      STEP_DEFS["download"],
    ],
  },

  // ✅ NEW: Tech Classic flow → ends with download
  tech_classic: {
    templateId: "tech_classic",
    steps: [
      STEP_DEFS["intent-template"],

      STEP_DEFS["tech-header-summary"],
      STEP_DEFS["tech-skills"],
      STEP_DEFS["tech-experience"],
      STEP_DEFS["tech-education"],
      STEP_DEFS["tech-achievements"],

      STEP_DEFS["download"],
    ],
  },
};

/**
 * Safely resolve a template id (fallback to consulting_classic).
 */
export function normalizeTemplateId(
  templateId: string | null | undefined
): ResumeTemplateId {
  const id = (templateId || "") as ResumeTemplateId;
  if (id && id in TEMPLATE_FLOWS_LOCAL) return id;
  return "consulting_classic";
}

/** Always show Step0 in the UI stepper */
const STEP0_INTENT_TEMPLATE: StepDef = STEP_DEFS["intent-template"];

function ensureStep0(steps: StepDef[]): StepDef[] {
  const hasStep0 = steps.some((s) => s.id === "intent-template");
  if (hasStep0) return steps;
  return [STEP0_INTENT_TEMPLATE, ...steps];
}

/**
 * Get flow definition for a template id (not filtered).
 */
export function getTemplateFlow(
  templateId: string | null | undefined
): TemplateFlow {
  const normalized = normalizeTemplateId(templateId);
  return TEMPLATE_FLOWS_LOCAL[normalized];
}

/**
 * Get the effective steps for the chosen template, filtered by conditions (when()).
 */
export function getFlowSteps(
  templateId: string | null | undefined,
  ctx?: Partial<FlowContext>
): StepDef[] {
  const normalized = normalizeTemplateId(templateId);
  const flow = TEMPLATE_FLOWS_LOCAL[normalized];

  const context: FlowContext = {
    templateId: normalized,
    intent: ctx?.intent,
  };

  const resolved = resolveSteps(flow, context);
  return ensureStep0(resolved);
}

/**
 * Convenience: returns both the normalized templateId and the resolved steps.
 */
export function getFlow(
  templateId: string | null | undefined,
  ctx?: Partial<FlowContext>
): { templateId: ResumeTemplateId; flow: TemplateFlow; steps: StepDef[] } {
  const normalized = normalizeTemplateId(templateId);
  const flow = TEMPLATE_FLOWS_LOCAL[normalized];

  const context: FlowContext = {
    templateId: normalized,
    intent: ctx?.intent,
  };

  const resolved = resolveSteps(flow, context);
  const steps = ensureStep0(resolved);

  return { templateId: normalized, flow, steps };
}
