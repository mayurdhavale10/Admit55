'use client';

import { UploadCloud, BarChart3, Target } from 'lucide-react';

/* ---------- types ---------- */
type Step = {
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string }>;
};

/* ---------- content (3 steps) ---------- */
const steps: Step[] = [
  {
    title: 'Upload your resume or answer 7 quick questions',
    subtitle: 'Simple, fast input to get started',
    Icon: UploadCloud,
  },
  {
    title: 'Get your personalized Profile Snapshot dashboard',
    subtitle: 'AI-powered insights tailored to you',
    Icon: BarChart3,
  },
  {
    title: 'Discover key insights and next steps toward your admit',
    subtitle: 'Actionable guidance for your MBA journey',
    Icon: Target,
  },
];

/* ===========================================================
 * HowSteps Component (PART 2)
 * =========================================================== */
export default function HowSteps() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-black">
        How Admit55 Works
      </h3>

      <p className="mt-3 text-base sm:text-lg lg:text-xl text-black max-w-2xl mx-auto">
        Three simple steps to transform your MBA application journey
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        {steps.map((s, idx) => (
          <StepCard key={idx} step={s} index={idx} />
        ))}
      </div>
    </div>
  );
}

/* ===========================================================
 * Step Card Component
 * =========================================================== */
function StepCard({ step, index }: { step: Step; index: number }) {
  return (
    <div className="relative">
      {/* Step number badge */}
      <div className="absolute -top-3 left-6">
        <span className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-teal-600 text-white text-sm font-semibold shadow">
          {(index + 1).toString().padStart(2, '0')}
        </span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-7 h-full">
        <div className="mb-4 h-12 w-12 inline-flex items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
          <step.Icon className="h-6 w-6" />
        </div>

        <h4 className="text-lg font-semibold text-slate-900">{step.title}</h4>
        <p className="text-sm text-slate-600 mt-1">{step.subtitle}</p>
      </div>
    </div>
  );
}
