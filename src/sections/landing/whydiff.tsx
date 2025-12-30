'use client';

import Image from 'next/image';
import { Brain, Globe, Layers } from 'lucide-react';

export default function WhyDiff() {
  return (
    <section className="relative w-full py-28">
      {/* Premium glass background */}
      <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-br from-emerald-50/70 via-sky-50/60 to-violet-50/70 backdrop-blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="flex items-center justify-center gap-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            <Image
              src="/logo/admit55_final_logo.webp"
              alt="Admit55"
              width={56}
              height={56}
              className="object-contain"
            />
            <span>
              Why <span className="text-emerald-600">Admit55</span> is different
            </span>
          </h2>

          <div className="mt-5 mx-auto h-1.5 w-28 rounded-full bg-gradient-to-r from-emerald-400 via-sky-500 to-violet-500" />
        </div>

        {/* Cards */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          <GlassCard
            icon={<Brain className="h-7 w-7 text-emerald-600" />}
            iconBg="from-emerald-200 to-emerald-100"
            title="Trained on real admits"
            description="Proprietary intelligence built from 10,000+ real admits — not scraped data, not guesswork."
          />

          <GlassCard
            icon={<Globe className="h-7 w-7 text-sky-600" />}
            iconBg="from-sky-200 to-sky-100"
            title="Indian + Global MBA contexts"
            description="Designed for ISB, IIMs, INSEAD, Harvard, and top B-schools across geographies."
          />

          <GlassCard
            icon={<Layers className="h-7 w-7 text-violet-600" />}
            iconBg="from-violet-200 to-violet-100"
            title="Multi-AI intelligence"
            description="Multiple LLM agents combine AI pattern recognition with seasoned human admissions logic."
          />
        </div>
      </div>
    </section>
  );
}

/* ===============================
   Glass Card Component
================================ */
function GlassCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        group
        relative
        rounded-[2rem]
        border border-white/50
        bg-white/55
        backdrop-blur-2xl
        p-10
        shadow-xl shadow-slate-300/40
        transition-all
        duration-300
        hover:-translate-y-1.5
        hover:shadow-2xl
      "
    >
      {/* Icon */}
      <div
        className={`
          flex h-16 w-16 items-center justify-center
          rounded-2xl
          bg-gradient-to-br ${iconBg}
          shadow-md
        `}
      >
        {icon}
      </div>

      {/* Content */}
      <h3 className="mt-8 text-xl font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-4 text-base text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
