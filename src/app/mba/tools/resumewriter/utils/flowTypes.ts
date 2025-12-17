// src/app/mba/tools/resumewriter/utils/flowTypes.ts
"use client";

import type { ResumeTemplateId } from "../components/resume-templates";
import type { ResumeData } from "./resumeTypes";

export type StepId =
  | "intent-template"
  | "basic-info"
  | "education"
  | "experience"
  | "work-experience"
  | "scholastic-achievements"
  | "intern-or-article"
  | "leadership-extracurricular"
  | "download"; // ✅ NEW final step

export type ResumeIntent = {
  templateId?: ResumeTemplateId | null;
  [key: string]: any;
};

export type ResumeDraft = {
  intent?: ResumeIntent;
  resume?: Partial<ResumeData> & {
    // Optional extra fields written by newer steps (safe to keep here)
    articleSectionTitle?: string;
    articleHeaderRight?: string;
    articleBlocks?: any[];
    leadershipTitle?: string;
    leadershipBlocks?: any[];

    // ✅ final step doesn't need storage, but keeping room is fine
    // download?: never;
  };
};

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
