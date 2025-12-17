// src/app/mba/tools/resumewriter/hooks/useResumeDraft.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { ResumeData } from "../utils/resumeTypes";
import type { IntentTemplateValues, ResumeDraft, StepId } from "../utils/flowTypes";

/**
 * Canonical builder state (single source of truth).
 * Steps write into this draft. Then:
 * - draft.resume -> drives live preview
 * - draft.intent -> drives flow/template decisions + later LLM prompts
 */

const EMPTY_INTENT: IntentTemplateValues = {
  careerPath: null,
  goal: null,
  experienceLevel: null,
  templateId: null,
  careerPathOther: "",
  goalOther: "",
  targetJobDescription: "",
  // optional toggles (safe defaults)
  hasInternships: true,
  hasProjects: true,
  hasLeadership: true,
  hasGlobalExposure: true,
};

// NOTE: ResumeData fields are optional in your resumeTypes.ts,
// so we can keep a minimal empty object and progressively fill it.
const EMPTY_RESUME: ResumeData = {
  basicInfo: {},
  education: [],
  experiences: [],
  internships: [],
  projects: [],
  leadership: [],
  skills: [],
  tools: [],
  certifications: [],
  languages: [],
  achievements: [],
  globalExposure: [],
};

const EMPTY_DRAFT: ResumeDraft = {
  intent: EMPTY_INTENT,
  resume: EMPTY_RESUME,
};

type ResumeDraftStore = {
  // state
  draft: ResumeDraft;
  currentStepIndex: number;
  currentStepId: StepId;

  // actions
  setCurrentStepIndex: (index: number) => void;
  setCurrentStepId: (stepId: StepId) => void;

  setDraft: (draft: ResumeDraft) => void;
  patchDraft: (patch: Partial<ResumeDraft>) => void;

  patchIntent: (patch: Partial<IntentTemplateValues>) => void;
  patchResume: (patch: Partial<ResumeData>) => void;

  reset: () => void;
};

export const useResumeDraft = create<ResumeDraftStore>()(
  persist(
    (set, get) => ({
      draft: EMPTY_DRAFT,
      currentStepIndex: 0,
      currentStepId: "intent-template",

      setCurrentStepIndex: (index) =>
        set({
          currentStepIndex: Math.max(0, index),
        }),

      setCurrentStepId: (stepId) => set({ currentStepId: stepId }),

      setDraft: (draft) => set({ draft }),

      patchDraft: (patch) =>
        set({
          draft: { ...get().draft, ...patch },
        }),

      patchIntent: (patch) =>
        set({
          draft: {
            ...get().draft,
            intent: { ...get().draft.intent, ...patch },
          },
        }),

      patchResume: (patch) =>
        set({
          draft: {
            ...get().draft,
            resume: { ...get().draft.resume, ...patch },
          },
        }),

      reset: () =>
        set({
          draft: EMPTY_DRAFT,
          currentStepIndex: 0,
          currentStepId: "intent-template",
        }),
    }),
    {
      name: "admit55-resumewriter-draft",
      storage: createJSONStorage(() => localStorage),

      // Persist only what matters
      partialize: (state) => ({
        draft: state.draft,
        currentStepIndex: state.currentStepIndex,
        currentStepId: state.currentStepId,
      }),
    }
  )
);
