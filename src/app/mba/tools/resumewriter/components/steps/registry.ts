// src/app/mba/tools/resumewriter/components/steps/registry.ts
import React from "react";
import type { ResumeTemplateId } from "../resume-templates";
import type { StepId, ResumeDraft } from "../../utils/flowTypes";

/* =========================
   CONSULTING CLASSIC
========================= */
import Step1_BasicInfo_ConsultingClassic from "./consulting-classic/Step1_BasicInfo";
import Step2_Education_ConsultingClassic from "./consulting-classic/Step2_Education";
import Step3_WorkExperience_ConsultingClassic from "./consulting-classic/Step3_WorkExperience";
import Step4_ScholasticAchievements_ConsultingClassic from "./consulting-classic/Step4_ScholasticAchievements";
import Step5_intern_or_article_ConsultingClassic from "./consulting-classic/Step5_intern_or_article";
import Step6leadership_and_extracurricular_ConsultingClassic from "./consulting-classic/Step6leadership_and_extracurricular";
import Step7_Download_ConsultingClassic from "./consulting-classic/Step7_Download";

/* =========================
   TECH CLASSIC
========================= */
import Step1_HeaderAndSummary_TechClassic from "./tech-classic/Step1_HeaderAndSummary";
import Step2_Skills_TechClassic from "./tech-classic/Step2_Skills";
import Step3_Experience_TechClassic from "./tech-classic/Step3_Experience";
import Step4_Education_TechClassic from "./tech-classic/Step4_Education";
import Step5_KeyAchievements_TechClassic from "./tech-classic/Step5_KeyAchievements";
import Step6_Download_TechClassic from "./tech-classic/Step6_Download";

/* =========================
   CONSULTING 1
========================= */
import Step1_HeaderAndSummary_Consulting1 from "./consulting-1/Step1_HeaderAndSummary";
import Step2_WorkExperience_Consulting1 from "./consulting-1/Step2_WorkExperience";
import Step3_Education_Consulting1 from "./consulting-1/Step3_Education";
import Step4_Entrepreneurial_Consulting1 from "./consulting-1/Step4_Entrepreneurial";
import Step5_Download_Consulting1 from "./consulting-1/Step5_Download";

/* =========================
   TECH VC1
========================= */
import Step1_HeaderAndSummary_TechVC1 from "./tech-vc1/Step1_HeaderAndSummary";

// IMPORTANT: keep filenames as-is, but import them with truthful variable names:
import Step2_ProfessionalJourney_TechVC1 from "./tech-vc1/Step2_Professionalskills"; // file name stays
import Step3_Skills_TechVC1 from "./tech-vc1/Step3_Skills"; // file name stays

import Step4_Education_TechVC1 from "./tech-vc1/Step4_Education";
import Step5_ProfessionalAccolades_TechVC1 from "./tech-vc1/Step5_ProfessionalAccolades";
import Step6_Download_TechVC1 from "./tech-vc1/Step6_Download";

export type StepComponentProps = {
  draft: ResumeDraft;
  setDraft: (next: ResumeDraft) => void;
  onNext: () => void;
  onPrev?: () => void;
};

export type StepComponent = React.FC<StepComponentProps>;

export const STEP_COMPONENTS: Record<
  ResumeTemplateId,
  Partial<Record<StepId, StepComponent>>
> = {
  consulting_classic: {
    "basic-info": Step1_BasicInfo_ConsultingClassic,
    education: Step2_Education_ConsultingClassic,

    // compat
    experience: Step3_WorkExperience_ConsultingClassic,
    "work-experience": Step3_WorkExperience_ConsultingClassic,

    "scholastic-achievements": Step4_ScholasticAchievements_ConsultingClassic,
    "intern-or-article": Step5_intern_or_article_ConsultingClassic,
    "leadership-extracurricular": Step6leadership_and_extracurricular_ConsultingClassic,
    download: Step7_Download_ConsultingClassic,
  },

  tech_classic: {
    "tech-header-summary": Step1_HeaderAndSummary_TechClassic,
    "tech-skills": Step2_Skills_TechClassic,
    "tech-experience": Step3_Experience_TechClassic,
    "tech-education": Step4_Education_TechClassic,
    "tech-achievements": Step5_KeyAchievements_TechClassic,
    download: Step6_Download_TechClassic,
  },

  consulting_1: {
    "c1-header-summary": Step1_HeaderAndSummary_Consulting1,
    "c1-work-experience": Step2_WorkExperience_Consulting1,
    "c1-education": Step3_Education_Consulting1,
    "c1-entrepreneurial": Step4_Entrepreneurial_Consulting1,
    download: Step5_Download_Consulting1,
  },

  // ✅ FIXED: Step IDs now map to the correct step files
  tech_vc1: {
    "vc1-header-summary": Step1_HeaderAndSummary_TechVC1,

    // Step 2 in UI = Professional Journey
    "vc1-experience": Step2_ProfessionalJourney_TechVC1,

    // Step 3 in UI = Skills
    "vc1-skills": Step3_Skills_TechVC1,

    "vc1-education": Step4_Education_TechVC1,
    "vc1-achievements": Step5_ProfessionalAccolades_TechVC1,
    download: Step6_Download_TechVC1,
  },

  finance_tight: {},
  general_mba: {},
  product_modern: {},
};

export function getStepComponent(
  templateId: ResumeTemplateId,
  stepId: StepId
): StepComponent | null {
  return (STEP_COMPONENTS?.[templateId]?.[stepId] ?? null) as StepComponent | null;
}
