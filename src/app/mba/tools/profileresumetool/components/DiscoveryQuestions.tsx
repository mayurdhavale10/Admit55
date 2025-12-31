// src/app/mba/tools/profileresumetool/components/DiscoveryQuestions.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

interface DiscoveryQuestionsProps {
  onComplete: (answers: Record<string, string>) => void;
  onSkip: () => void;
}

export default function DiscoveryQuestions({
  onComplete,
  onSkip,
}: DiscoveryQuestionsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questions = [
    {
      id: "goal_type",
      question: "What's your primary MBA goal?",
      icon: "🎯",
      options: [
        "Career switch (industry/function)",
        "Fast-track promotion in current field",
        "Start my own business",
        "Pivot to consulting/IB",
        "Other",
      ],
    },
    {
      id: "target_schools",
      question: "Which tier of schools are you targeting?",
      icon: "🏫",
      options: [
        "M7 (Harvard, Stanford, Wharton, etc.)",
        "Top 15 (Kellogg, Booth, Columbia, etc.)",
        "Top 25 (Darden, Stern, Ross, etc.)",
        "Indian ISB/IIMs",
        "Not sure yet",
      ],
    },
    {
      id: "timeline",
      question: "When do you plan to apply?",
      icon: "📅",
      options: [
        "Next R1 (Sep-Oct 2025)",
        "Next R2 (Jan 2026)",
        "R1 2026 (Sep-Oct 2026)",
        "Still exploring (2027+)",
      ],
    },
    {
      id: "test_status",
      question: "Current GMAT/GRE status?",
      icon: "📝",
      options: [
        "Not started",
        "Studying now (no score yet)",
        "Scored: 700-730 (GMAT) / 320-330 (GRE)",
        "Scored: 730+ (GMAT) / 330+ (GRE)",
        "Planning to skip (if possible)",
      ],
    },
    {
      id: "work_experience",
      question: "Years of work experience by application time?",
      icon: "💼",
      options: [
        "Less than 3 years",
        "3-5 years (ideal range)",
        "5-7 years",
        "7+ years (experienced applicant)",
      ],
    },
    {
      id: "biggest_concern",
      question: "What's your BIGGEST concern about MBA applications?",
      icon: "⚠️",
      options: [
        "Low test scores / no test yet",
        "Weak brand names (college/companies)",
        "Lack of leadership stories",
        "Not enough extracurriculars",
        "Unclear post-MBA goals",
        "International exposure gaps",
      ],
    },
  ] as const;

  const total = questions.length;
  const currentQuestion = questions[currentStep];
  const progress = Math.round(((currentStep + 1) / total) * 100);

  const handleAnswer = (option: string) => {
    const q = questions[currentStep];
    const newAnswers = { ...answers, [q.id]: option };
    setAnswers(newAnswers);

    if (currentStep < total - 1) {
      setTimeout(() => setCurrentStep((s) => s + 1), 150);
    } else {
      setTimeout(() => onComplete(newAnswers), 150);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo/admit55_final_logo.webp"
              alt="Admit55"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Quick Discovery</h2>
              <p className="text-sm text-slate-600">
                Answer {total} questions for personalized recommendations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 underline"
          >
            Skip for now
          </button>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs font-medium text-slate-600">
              Question {currentStep + 1} of {total}
            </span>
            <span className="text-xs font-medium text-blue-600">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
        {/* Question Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
              {currentQuestion.icon}
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {currentQuestion.question}
            </h3>
          </div>
          <p className="text-sm text-slate-500 ml-15">
            Select the option that best describes your situation
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = answers[currentQuestion.id] === option;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleAnswer(option)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 shadow-md scale-[1.02]"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 hover:scale-[1.01]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-medium ${
                      isSelected ? "text-blue-900" : "text-slate-700"
                    }`}
                  >
                    {option}
                  </span>
                  {isSelected && (
                    <svg
                      className="w-6 h-6 text-blue-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              currentStep === 0
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>Takes ~60 seconds</span>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-all"
          >
            Skip →
          </button>
        </div>
      </div>

      {/* Benefits Footer */}
      <div className="mt-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 border border-emerald-100">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">✨</div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">Why answer these questions?</h4>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>• Get recommendations tailored to your timeline and goals</li>
              <li>• See school matches (reach/target/safe) based on your profile</li>
              <li>• Receive urgent actions if you're applying soon</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
