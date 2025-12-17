"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import Stepper, { type Step } from "../components/Stepper";
import Step0_IntentAndTemplate from "../components/Step0_IntentAndTemplate";

import { getFlow, normalizeTemplateId } from "../utils/getFlow";
import { useResumeDraft } from "../hooks/useResumeDraft";
import { getStepComponent } from "../components/steps/registry";

export default function ResumeWriterBuilderPage() {
  const { draft, setDraft, currentStepIndex, setCurrentStepIndex } =
    useResumeDraft();

  // Resolve template flow dynamically based on template selection + intent flags
  const flow = useMemo(() => {
    return getFlow(draft?.intent?.templateId ?? null, {
      intent: draft?.intent,
    });
  }, [draft?.intent]);

  // Stepper expects Step[] (id/label/description)
  const stepperSteps: Step[] = useMemo(() => {
    return flow.steps.map((s) => ({
      id: s.id,
      label: s.label,
      description: s.description,
    }));
  }, [flow.steps]);

  const clampedStepIndex = Math.min(
    Math.max(currentStepIndex, 0),
    Math.max(stepperSteps.length - 1, 0)
  );

  const currentStepId =
    stepperSteps[clampedStepIndex]?.id ?? "intent-template";

  const normalizedTemplateId = normalizeTemplateId(
    draft?.intent?.templateId ?? null
  );

  const StepComponent = useMemo(() => {
    return getStepComponent(normalizedTemplateId, currentStepId as any);
  }, [normalizedTemplateId, currentStepId]);

  const handleNext = () => {
    setCurrentStepIndex(
      Math.min(clampedStepIndex + 1, stepperSteps.length - 1)
    );
  };

  const handlePrev = () => {
    setCurrentStepIndex(Math.max(clampedStepIndex - 1, 0));
  };

  // For Step0: store intent into canonical draft state
  const updateIntent = (intentValue: any) => {
    setDraft({
      ...draft,
      intent: intentValue,
    });
  };

  return (
    <div
      className="
        relative min-h-screen pt-[110px] px-4 pb-12 md:px-8
        bg-gradient-to-br from-slate-50 to-slate-100
        text-slate-900
        dark:bg-gradient-to-br dark:from-slate-800 dark:to-blue-900 dark:text-slate-50
        transition-colors duration-300
      "
    >
      {/* NAVBAR BACKDROP (nav already in RootLayout) */}
      <div
        className="
          pointer-events-none fixed left-0 right-0 top-0 h-[84px] z-40
          bg-[#002b5b]/80 backdrop-blur-md
          dark:bg-slate-950/90
        "
      />

      {/* HERO SECTION */}
      <div className="text-center mb-10 flex flex-col items-center gap-2 -mt-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55 }}
          whileHover={{ scale: 1.08 }}
          className="transition-all duration-300"
        >
          <Image
            src="/logo/resumewriteicon.webp"
            alt="Resume icon"
            width={180}
            height={180}
            className="
              w-[150px] h-[150px] md:w-[180px] md:h-[180px] object-contain
              drop-shadow-[0_14px_40px_rgba(15,23,42,0.35)]
              dark:drop-shadow-[0_22px_70px_rgba(0,0,0,0.95)]
            "
            priority
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="
            font-extrabold text-3xl md:text-5xl leading-tight tracking-tight mt-[-6px]
            text-[#002b5b]
            dark:text-slate-50
          "
        >
          ENGINEER YOUR RESUME
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="
            font-semibold text-xl md:text-3xl tracking-tight mt-[-4px]
            text-[#002b5b]
            dark:text-teal-200
          "
        >
          IN {stepperSteps.length} STEPS
        </motion.h2>
      </div>

      {/* STEPPER */}
      <div className="w-full max-w-7xl mx-auto">
        <Stepper steps={stepperSteps} currentStep={clampedStepIndex} />
      </div>

      {/* STEP CONTENT */}
      <div className="mt-10">
        {/* Step0 */}
        {currentStepId === "intent-template" && (
          <Step0_IntentAndTemplate
            value={draft?.intent ?? {}}
            onChange={updateIntent}
            onNext={handleNext}
          />
        )}

        {/* All other steps: render template-specific component via registry */}
        {currentStepId !== "intent-template" && (
          <>
            {StepComponent ? (
              <StepComponent
                draft={draft as any}
                setDraft={setDraft as any}
                onNext={handleNext}
                onPrev={handlePrev}
              />
            ) : (
              <div className="text-center py-20 max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-[#002b5b] dark:text-teal-200">
                  {stepperSteps[clampedStepIndex]?.label ?? "Step"}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Not wired yet for template{" "}
                  <span className="font-mono">{normalizedTemplateId}</span> — step{" "}
                  <span className="font-mono">{currentStepId}</span>
                </p>
              </div>
            )}
          </>
        )}

        {/* Bottom navigation */}
        <div className="flex items-center justify-between mt-8 max-w-4xl mx-auto px-4">
          <button
            onClick={handlePrev}
            disabled={clampedStepIndex === 0}
            className="
              px-4 py-2 rounded-md border text-sm
              border-slate-200 text-slate-700
              disabled:opacity-40 disabled:cursor-not-allowed
              dark:border-slate-700 dark:text-slate-200
            "
          >
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={clampedStepIndex >= stepperSteps.length - 1}
            className="
              px-5 py-2.5 rounded-md text-sm font-semibold text-white transition
              bg-[#002b5b] hover:bg-[#003b7a] shadow-[0_10px_30px_rgba(15,23,42,0.30)]
              disabled:opacity-50 disabled:cursor-not-allowed
              dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-slate-950
              dark:shadow-[0_16px_45px_rgba(45,212,191,0.65)]
            "
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
