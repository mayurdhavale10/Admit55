// src/app/mba/tools/resumewriter/components/steps/consulting-classic/stepperConfig.ts
"use client";

import type { ComponentType } from "react";
import type { StepComponentProps } from "../registry";

import Step1_BasicInfo_ConsultingClassic from "./Step1_BasicInfo";
import Step2_Education_ConsultingClassic from "./Step2_Education";
import Step3_WorkExperience_ConsultingClassic from "./Step3_WorkExperience";
import Step4_ScholasticAchievements_ConsultingClassic from "./Step4_ScholasticAchievements";
import Step5_intern_or_article_ConsultingClassic from "./Step5_intern_or_article";
import Step6leadership_and_extracurricular_ConsultingClassic from "./Step6leadership_and_extracurricular";
import Step7_Download_ConsultingClassic from "./Step7_Download"; // ✅ NEW

export type ConsultingClassicStepId =
  | "basic-info"
  | "education"
  | "work-experience"
  | "scholastic-achievements"
  | "intern-or-article"
  | "leadership-extracurricular"
  | "download"; // ✅ NEW

export type TemplateStep = {
  id: ConsultingClassicStepId;
  title: string;
  subtitle?: string;
  component: ComponentType<StepComponentProps>;
};

export const consultingClassicSteps: TemplateStep[] = [
  {
    id: "basic-info",
    title: "Basic Info",
    subtitle: "Name, contact, university, and your top achievements",
    component: Step1_BasicInfo_ConsultingClassic,
  },
  {
    id: "education",
    title: "Education",
    subtitle: "Degrees, institutes, scores, distinctions, and years",
    component: Step2_Education_ConsultingClassic,
  },
  {
    id: "work-experience",
    title: "Work Experience",
    subtitle: "Companies, roles, sub-areas, and impact bullets",
    component: Step3_WorkExperience_ConsultingClassic,
  },
  {
    id: "scholastic-achievements",
    title: "Scholastic Achievements",
    subtitle: "Case competitions, certifications, and academic wins",
    component: Step4_ScholasticAchievements_ConsultingClassic,
  },
  {
    id: "intern-or-article",
    title: "Internship / Articleship",
    subtitle: "Firm/company + duration + date range + role rows with bullets",
    component: Step5_intern_or_article_ConsultingClassic,
  },
  {
    id: "leadership-extracurricular",
    title: "Leadership / POR",
    subtitle: "IIMA Clubs + School POR + Social Service style blocks",
    component: Step6leadership_and_extracurricular_ConsultingClassic,
  },
  // ✅ NEW FINAL STEP
  {
    id: "download",
    title: "Download",
    subtitle: "Preview + export as PDF",
    component: Step7_Download_ConsultingClassic,
  },
];

export const consultingClassicStepCount = consultingClassicSteps.length;

export function getConsultingClassicStepIndex(id: ConsultingClassicStepId) {
  return Math.max(0, consultingClassicSteps.findIndex((s) => s.id === id));
}

export function getConsultingClassicStepById(id: ConsultingClassicStepId) {
  return consultingClassicSteps.find((s) => s.id === id) ?? consultingClassicSteps[0];
}
