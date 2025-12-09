import React from "react";

type Step = {
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

/**
 * Stepper
 * -------
 * Visual progress indicator for multi-step forms.
 * Shows current position, completed steps, and upcoming steps.
 */
export default function Stepper({
  steps,
  currentStep,
  onStepClick,
  allowClickNavigation = false,
}: StepperProps) {
  const handleStepClick = (index: number) => {
    if (allowClickNavigation && onStepClick && index <= currentStep) {
      onStepClick(index);
    }
  };

  return (
    <nav aria-label="Progress" className="mb-8">
      {/* Mobile: Simple progress bar */}
      <div className="lg:hidden">
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-500">
            Step {currentStep + 1} of {steps.length}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {steps[currentStep]?.label}
          </p>
        </div>
        <div className="overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-slate-900 transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Desktop: Full stepper */}
      <ol className="hidden lg:flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;
          const isClickable = allowClickNavigation && index <= currentStep;

          return (
            <li
              key={step.id}
              className={`flex items-center ${
                index !== steps.length - 1 ? "flex-1" : ""
              }`}
            >
              {/* Step circle and label */}
              <button
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                className={`flex flex-col items-center group ${
                  isClickable ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {/* Circle */}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      isCompleted
                        ? "border-slate-900 bg-slate-900"
                        : isCurrent
                        ? "border-slate-900 bg-white"
                        : "border-slate-300 bg-white"
                    } ${
                      isClickable
                        ? "group-hover:border-slate-700 group-hover:shadow-sm"
                        : ""
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span
                        className={`text-sm font-semibold ${
                          isCurrent ? "text-slate-900" : "text-slate-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-medium ${
                      isCurrent
                        ? "text-slate-900"
                        : isCompleted
                        ? "text-slate-700"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="mt-0.5 text-[10px] text-slate-500 max-w-[100px]">
                      {step.description}
                    </p>
                  )}
                </div>
              </button>

              {/* Connector line */}
              {index !== steps.length - 1 && (
                <div className="flex-1 mx-4 mt-[-36px]">
                  <div
                    className={`h-0.5 w-full transition-colors ${
                      isCompleted ? "bg-slate-900" : "bg-slate-200"
                    }`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}