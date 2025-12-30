import React from 'react';

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

export default function HowSteps() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Heading */}
      <div className="text-center mb-16">
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
      </div>

      {/* Desktop View - Horizontal with connectors */}
      <div className="hidden lg:block relative">
        {/* Connecting Line */}
        <div className="absolute top-32 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-200 via-teal-400 to-slate-300 z-0" 
             style={{ width: 'calc(100% - 120px)', marginLeft: '60px' }} />
        
        <div className="grid grid-cols-5 gap-6 relative z-10">
          {steps.map((step, idx) => (
            <StepCard key={idx} step={step} index={idx} />
          ))}
        </div>
      </div>

      {/* Tablet View - 2 columns with vertical connectors */}
      <div className="hidden sm:block lg:hidden relative">
        <div className="grid grid-cols-2 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              {idx < steps.length - 1 && idx % 2 === 1 && (
                <div className="absolute left-1/2 -bottom-8 w-0.5 h-8 bg-gradient-to-b from-teal-400 to-slate-300 transform -translate-x-1/2" />
              )}
              <StepCard step={step} index={idx} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile View - Single column with vertical connectors */}
      <div className="block sm:hidden relative">
        <div className="space-y-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              {idx < steps.length - 1 && (
                <div className="absolute left-1/2 -bottom-8 w-0.5 h-8 bg-gradient-to-b from-teal-400 to-slate-300 transform -translate-x-1/2 z-0" />
              )}
              <StepCard step={step} index={idx} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, index }: { step: Step; index: number }) {
  const isLive = step.status === 'live';

  const cardContent = (
    <div
      className={`relative rounded-3xl border-2 bg-white p-6 text-center transition-all duration-300 h-full group
        ${isLive 
          ? 'border-teal-400 shadow-lg hover:shadow-2xl hover:border-teal-500 hover:-translate-y-2' 
          : 'border-slate-200 shadow-md hover:shadow-lg'
        }
        ${isLive && step.href ? 'cursor-pointer' : ''}
      `}
    >
      {/* Gradient overlay on hover */}
      {isLive && step.href && (
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
      )}

      {/* Status badge */}
      <div className="absolute top-4 right-4 z-10">
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

      {/* Icon with enhanced styling */}
      <div className="mt-4 mb-4 flex justify-center relative z-10">
        <div className={`relative transition-all duration-300 
          ${isLive && step.href ? 'group-hover:scale-110' : ''}`}>
          {/* Glow effect for live items */}
          {isLive && (
            <div className="absolute inset-0 bg-teal-400/20 blur-2xl rounded-full scale-150 group-hover:bg-teal-400/30 transition-all duration-300" />
          )}
          <img
            src={step.icon}
            alt={step.title}
            className={`w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 object-contain relative z-10
              ${isLive && step.href ? 'drop-shadow-xl group-hover:drop-shadow-2xl' : 'drop-shadow-lg'} 
              transition-all duration-300`}
          />
        </div>
      </div>

      {/* Text content */}
      <div className="relative z-10">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
          {step.title}
        </h3>

        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
          {step.description}
        </p>

        {/* Arrow indicator for clickable items */}
        {isLive && step.href && (
          <div className="mt-4 inline-flex items-center gap-2 text-teal-600 font-medium text-sm group-hover:gap-3 transition-all">
            Get Started
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );

  // Wrap with Link if live and has href
  if (isLive && step.href) {
    return (
      <a href={step.href} className="block h-full">
        {cardContent}
      </a>
    );
  }

  return cardContent;
}