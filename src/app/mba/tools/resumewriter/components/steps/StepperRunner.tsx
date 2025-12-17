// src/app/mba/tools/resumewriter/components/steps/StepperRunner.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { StepComponentProps } from "./registry";

import { consultingClassicSteps } from "./consulting-classic/stepperConfig";
import ConsultingClassicPreview from "../resume-templates/consulting-classic/ConsultingClassicPreview";

const DEFAULT_HIGHLIGHTS = [
  "Cars24 Arabia (UAE)",
  "Alvarez & Marsal (India)",
  "IIM Ahmedabad",
  "Chartered Accountant",
  "Grant Thornton Bharat LLP",
];

function cleanStr(v: any) {
  return (v ?? "").toString();
}

type Props = {
  draft: StepComponentProps["draft"];
  setDraft: StepComponentProps["setDraft"];
};

export default function StepperRunner({ draft, setDraft }: Props) {
  const steps = consultingClassicSteps;
  const [activeIndex, setActiveIndex] = useState(0);

  const isFirst = activeIndex === 0;
  const isLast = activeIndex === steps.length - 1;

  const goNext = () => setActiveIndex((i) => Math.min(i + 1, steps.length - 1));
  const goBack = () => setActiveIndex((i) => Math.max(i - 1, 0));

  const CurrentStep = steps[activeIndex]?.component;

  /**
   * ✅ IMPORTANT:
   * This preview must be built from the SAME saved fields your steps write into:
   * - Step1 => draft.resume.basicInfo
   * - Step2 => draft.resume.educationRows
   * - Step3 => draft.resume.experiences
   * - Step4 => draft.resume.scholasticBlocks
   * - Step5 => draft.resume.articleSectionTitle / articleHeaderRight / articleBlocks
   */
  const previewData = useMemo(() => {
    const basic = draft?.resume?.basicInfo ?? {};

    const fullName = `${basic.firstName ?? ""} ${basic.lastName ?? ""}`.trim();

    const rawMeta = Array.isArray(basic.metaBar) ? basic.metaBar : [];
    const cleanedMeta = rawMeta.map((s) => (s ?? "").trim()).filter(Boolean);
    const metaBarForPreview =
      cleanedMeta.length > 0 ? cleanedMeta.slice(0, 5) : DEFAULT_HIGHLIGHTS;

    // ✅ Step2 stores template rows here
    const educationRows = Array.isArray((draft as any)?.resume?.educationRows)
      ? ((draft as any).resume.educationRows as any[])
      : undefined;

    // ✅ Step3 stores work blocks here
    const experiences = Array.isArray((draft as any)?.resume?.experiences)
      ? ((draft as any).resume.experiences as any[])
      : undefined;

    // ✅ Step4 stores scholastic blocks here
    const scholasticBlocks = Array.isArray((draft as any)?.resume?.scholasticBlocks)
      ? ((draft as any).resume.scholasticBlocks as any[])
      : undefined;

    // ✅ Step5 stores article/intern section here
    const articleSectionTitle = (draft as any)?.resume?.articleSectionTitle;
    const articleHeaderRight = (draft as any)?.resume?.articleHeaderRight;

    const articleBlocks = Array.isArray((draft as any)?.resume?.articleBlocks)
      ? ((draft as any).resume.articleBlocks as any[])
      : undefined;

    return {
      header: {
        name: fullName || "Your Name",
        gender: cleanStr(basic.gender),
        university: cleanStr(basic.university),
        email: cleanStr(basic.email),
        phone: cleanStr(basic.phone),
        location: cleanStr(basic.location),
      },
      metaBar: metaBarForPreview,
      educationRows,
      experiences,

      // ✅ include Step4 + Step5 so preview updates live
      scholasticBlocks,
      articleSectionTitle,
      articleHeaderRight,
      articleBlocks,
    };
  }, [draft]);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Top Step Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {steps.map((s, idx) => {
          const active = idx === activeIndex;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={[
                "rounded-full border px-4 py-2 text-sm",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              {idx + 1}. {s.title}
            </button>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
        {/* LEFT: Step Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Step {activeIndex + 1} — {steps[activeIndex]?.title}
            </h2>
            {steps[activeIndex]?.subtitle ? (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {steps[activeIndex].subtitle}
              </p>
            ) : null}
          </div>

          {/* ✅ Render current step component */}
          {CurrentStep ? (
            <CurrentStep
              draft={draft}
              setDraft={setDraft}
              onNext={goNext}
              onPrev={goBack} // ✅ IMPORTANT (your steps use onPrev)
            />
          ) : (
            <div className="text-sm text-red-600">Step component not found.</div>
          )}

          {/* Bottom Nav Buttons */}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={isFirst}
              className={[
                "rounded-lg border px-4 py-2 text-sm",
                isFirst
                  ? "cursor-not-allowed border-slate-200 text-slate-400"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Back
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={isLast}
              className={[
                "rounded-lg px-4 py-2 text-sm font-semibold",
                isLast
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-slate-900 text-white hover:bg-slate-800",
              ].join(" ")}
            >
              Next
            </button>
          </div>
        </div>

        {/* RIGHT: Single Global Preview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Live Preview (Consulting Classic)
            </div>
          </div>

          <ConsultingClassicPreview data={previewData as any} />
        </div>
      </div>
    </div>
  );
}
