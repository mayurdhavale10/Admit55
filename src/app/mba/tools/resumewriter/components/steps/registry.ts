// src/app/mba/tools/resumewriter/components/steps/registry.ts
import React from "react";
import type { ResumeTemplateId } from "../resume-templates";
import type { StepId, ResumeDraft } from "../../utils/flowTypes";

import Step1_BasicInfo_ConsultingClassic from "./consulting-classic/Step1_BasicInfo";
import Step2_Education_ConsultingClassic from "./consulting-classic/Step2_Education";
import Step3_WorkExperience_ConsultingClassic from "./consulting-classic/Step3_WorkExperience";
import Step4_ScholasticAchievements_ConsultingClassic from "./consulting-classic/Step4_ScholasticAchievements";
import Step5_intern_or_article_ConsultingClassic from "./consulting-classic/Step5_intern_or_article";
import Step6leadership_and_extracurricular_ConsultingClassic from "./consulting-classic/Step6leadership_and_extracurricular";
import Step7_Download_ConsultingClassic from "./consulting-classic/Step7_Download"; // ✅ NEW

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
    // Step 1 + Step 2
    "basic-info": Step1_BasicInfo_ConsultingClassic,
    education: Step2_Education_ConsultingClassic,

    // Step 3 (compat)
    experience: Step3_WorkExperience_ConsultingClassic,
    "work-experience": Step3_WorkExperience_ConsultingClassic,

    // Step 4
    "scholastic-achievements": Step4_ScholasticAchievements_ConsultingClassic,

    // Step 5
    "intern-or-article": Step5_intern_or_article_ConsultingClassic,

    // Step 6
    "leadership-extracurricular": Step6leadership_and_extracurricular_ConsultingClassic,

    // ✅ Step 7 (final)
    download: Step7_Download_ConsultingClassic,
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
