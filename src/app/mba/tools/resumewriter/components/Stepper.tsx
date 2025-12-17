"use client";

import React from "react";
import { motion } from "framer-motion";

export type Step = {
  id: string;
  label: string;
  description?: string;
};

type StepperProps = {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowClickNavigation?: boolean;
};

export default function Stepper({
  steps,
  currentStep,
  onStepClick,
  allowClickNavigation = false,
}: StepperProps) {
  const clampedCurrent = Math.min(Math.max(currentStep, 0), steps.length - 1);

  const handleStepClick = (index: number) => {
    if (
      allowClickNavigation &&
      onStepClick &&
      index <= clampedCurrent &&
      index !== 0
    ) {
      onStepClick(index);
    }
  };

  return (
    <nav
      aria-label="Progress"
      className="
        mb-16 hidden lg:block 
        text-slate-900 dark:text-slate-100
      "
    >
      <div className="relative flex items-center justify-between w-full">

        {steps.map((step, index) => {
          const isCompleted = index < clampedCurrent;
          const isCurrent = index === clampedCurrent;
          const isClickable =
            allowClickNavigation && index <= clampedCurrent && index !== 0;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative"
            >
              {/* CONNECTING LINE */}
              {index < steps.length - 1 && (
                <motion.div
                  className="absolute top-[36px] left-[85px] h-[4px] rounded-full"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{
                    width: "calc(100% + 40px)",
                    opacity: isCompleted ? 1 : 0.35,
                  }}
                  transition={{ duration: 0.6 }}
                  style={{
                    background: isCompleted
                      ? "linear-gradient(to right, rgba(45,212,191,0.95), rgba(56,189,248,0.95))"
                      : "rgba(148,163,184,0.45)", // slate-400-ish, works on dark + light
                    boxShadow: isCompleted
                      ? "0px 0px 14px rgba(56,189,248,0.75)"
                      : "none",
                    backdropFilter: "blur(6px)",
                  }}
                />
              )}

              {/* STEP CIRCLE */}
              <motion.button
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                whileHover={isClickable ? { scale: 1.12 } : {}}
                whileTap={isClickable ? { scale: 0.94 } : {}}
                className="relative select-none"
              >
                <motion.div
                  className={`
                    flex items-center justify-center
                    h-[72px] w-[72px]
                    rounded-full border backdrop-blur-2xl
                    transition-all relative
                    ${
                      isCompleted
                        ? `
                          border-teal-300/70 
                          bg-gradient-to-br from-teal-300/80 to-teal-500/90 
                          text-white 
                          shadow-[0_10px_30px_rgba(15,23,42,0.55)]
                          dark:from-teal-400/90 dark:to-emerald-500/90 
                          dark:shadow-[0_14px_40px_rgba(15,23,42,0.85)]
                        `
                        : isCurrent
                        ? `
                          border-white/40 
                          bg-white/60 text-teal-900 
                          shadow-[0_8px_24px_rgba(15,23,42,0.35)]
                          dark:border-teal-400/60 
                          dark:bg-slate-900/90 dark:text-teal-200 
                          dark:shadow-[0_12px_36px_rgba(0,0,0,0.9)]
                        `
                        : `
                          border-white/25 
                          bg-white/25 text-slate-500 
                          shadow-[0_4px_16px_rgba(15,23,42,0.28)]
                          dark:border-slate-600 
                          dark:bg-slate-900/70 dark:text-slate-400 
                          dark:shadow-[0_8px_24px_rgba(0,0,0,0.85)]
                        `
                    }
                  `}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* subtle inner glow */}
                  <div
                    className={`
                      absolute inset-0 rounded-full blur-xl
                      ${
                        isCurrent || isCompleted
                          ? "bg-teal-200/30 dark:bg-teal-400/25"
                          : "bg-white/15 dark:bg-slate-800/40"
                      }
                    `}
                  />

                  {/* Number / Check */}
                  {isCompleted ? (
                    <motion.svg
                      className="h-7 w-7 relative z-10"
                      fill="none"
                      stroke="white"
                      viewBox="0 0 24 24"
                      initial={{ scale: 0.6 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.25 }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  ) : (
                    <span className="text-2xl font-bold relative z-10">
                      {index}
                    </span>
                  )}
                </motion.div>
              </motion.button>

              {/* LABEL */}
              <p
                className={`
                  mt-4 text-sm font-semibold
                  ${
                    isCurrent
                      ? "text-teal-700 dark:text-teal-300"
                      : isCompleted
                      ? "text-slate-700 dark:text-slate-200"
                      : "text-slate-500 dark:text-slate-400"
                  }
                `}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
