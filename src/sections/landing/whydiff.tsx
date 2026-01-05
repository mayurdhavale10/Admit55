'use client';

import Image from 'next/image';
import { Brain, Globe, Layers } from 'lucide-react';

export default function WhyDiff() {
  return (
    <section className="w-full bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="flex items-center justify-center gap-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            <Image
              src="/logo/admit55_final_logo.webp"
              alt="Admit55"
              width={44}
              height={44}
              className="object-contain"
            />
            <span>
              Why <span className="text-emerald-600">Admit55</span> is different
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Built with real admissions intelligence — not generic AI guesses
          </p>
        </div>

        {/* Cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Brain className="h-6 w-6 text-emerald-600" />}
            title="Trained on real admits"
            description="Proprietary intelligence built from 10,000+ verified admits — not scraped data, not assumptions."
          />

          <FeatureCard
            icon={<Globe className="h-6 w-6 text-emerald-600" />}
            title="Indian + global MBA context"
            description="Designed specifically for ISB, IIMs, INSEAD, Harvard, and other top global B-schools."
          />

          <FeatureCard
            icon={<Layers className="h-6 w-6 text-emerald-600" />}
            title="Human + AI intelligence"
            description="AI pattern recognition combined with real admissions mentor logic — not AI alone."
          />
        </div>
      </div>
    </section>
  );
}

/* ===============================
   Feature Card
================================ */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
        {icon}
      </div>

      <h3 className="mt-6 text-lg font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
