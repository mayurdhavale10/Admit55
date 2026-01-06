'use client';

import React from 'react';
import { motion } from 'framer-motion';

/* ---------- types ---------- */
type Step = {
  title: string;
  description: string;
  icon: string;
  status: 'live' | 'coming';
  href?: string;
};

/* ---------- content ---------- */
const steps: Step[] = [
  {
    title: 'Profile Review',
    description:
      'Upload resume or answer guided questions to understand where you truly stand.',
    icon: '/logo/profileicon.webp',
    status: 'live',
    href: '/mba/tools/profileresumetool',
  },
  {
    title: 'B-School Match',
    description:
      'See where your profile fits best across ISB, IIMs, INSEAD, Harvard and global schools.',
    icon: '/logo/Bschool.webp',
    status: 'live',
    href: '/mba/tools/bschool-match',
  },
  {
    title: 'MBA Essay Lab',
    description:
      'Turn your experiences into compelling, school-specific narratives.',
    icon: '/logo/essayicon.webp',
    status: 'coming',
  },
  {
    title: 'Interview Ready',
    description:
      'Practice real interview scenarios with AI-powered feedback.',
    icon: '/logo/interviewicon.webp',
    status: 'coming',
  },
  {
    title: 'Smart Resume',
    description:
      'Craft a resume aligned to your goals: consulting, PM, marketing, sales, general management.',
    icon: '/logo/resumewriteicon.webp',
    status: 'coming',
  },
];

/* ---------- animation presets ---------- */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function HowSteps() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

      {/* Heading */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-3 flex-wrap">
          <span>How</span>
          <img
            src="/logo/admit55_final_logo.webp"
            alt="Admit55 Logo"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
          />
          <span>works, and why it works</span>
        </h2>

        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          Your guided journey to MBA admission success
        </p>
      </motion.div>

      {/* Desktop View */}
      <div className="hidden lg:block relative">
        <div
          className="absolute top-32 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-200 via-teal-400 to-slate-300 z-0"
          style={{ width: 'calc(100% - 120px)', marginLeft: '60px' }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-5 gap-6 relative z-10"
        >
          {steps.map((step, idx) => (
            <motion.div key={idx} variants={fadeUp}>
              <StepCard step={step} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Tablet View */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="hidden sm:block lg:hidden relative"
      >
        <div className="grid grid-cols-2 gap-8">
          {steps.map((step, idx) => (
            <motion.div key={idx} variants={fadeUp} className="relative">
              {idx < steps.length - 1 && idx % 2 === 1 && (
                <div className="absolute left-1/2 -bottom-8 w-0.5 h-8 bg-gradient-to-b from-teal-400 to-slate-300 transform -translate-x-1/2" />
              )}
              <StepCard step={step} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Mobile View */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="block sm:hidden relative"
      >
        <div className="space-y-8">
          {steps.map((step, idx) => (
            <motion.div key={idx} variants={fadeUp} className="relative">
              {idx < steps.length - 1 && (
                <div className="absolute left-1/2 -bottom-8 w-0.5 h-8 bg-gradient-to-b from-teal-400 to-slate-300 transform -translate-x-1/2 z-0" />
              )}
              <StepCard step={step} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function StepCard({ step }: { step: Step }) {
  const isLive = step.status === 'live';

  const card = (
    <div
      className={`relative rounded-3xl border-2 bg-white p-6 text-center transition-all duration-300 h-full group
        ${
          isLive
            ? 'border-teal-400 shadow-lg hover:shadow-2xl hover:border-teal-500 hover:-translate-y-2'
            : 'border-slate-200 shadow-md hover:shadow-lg'
        }
      `}
    >
      {/* Status badge */}
      <div className="absolute top-4 right-4">
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200">
            Coming Soon
          </span>
        )}
      </div>

      {/* Icon */}
      <div className="mt-4 mb-4 flex justify-center">
        <img
          src={step.icon}
          alt={step.title}
          className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 object-contain drop-shadow-xl"
        />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
        {step.title}
      </h3>

      <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
        {step.description}
      </p>

      {isLive && step.href && (
        <div className="mt-4 inline-flex items-center gap-2 text-teal-600 font-medium text-sm">
          Get Started →
        </div>
      )}
    </div>
  );

  if (isLive && step.href) {
    return (
      <a href={step.href} className="block h-full">
        {card}
      </a>
    );
  }

  return card;
}
