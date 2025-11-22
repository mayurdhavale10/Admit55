'use client';

import Link from 'next/link';
import { ShieldCheck, GraduationCap, FileText } from 'lucide-react';

type Coach = {
  name: string;
  subtitle: string;   // e.g., school + current role
  role: string;       // Essay Coach / Interview Mentor etc.
  highlight: string;  // e.g., “12+ mentees admitted”
  Icon: React.ComponentType<{ className?: string }>;
};

const COACHES: Coach[] = [
  {
    name: 'Akshay Goel',
    subtitle: "ISB ’21 | Ex-McKinsey",
    role: 'Admissions Strategy',
    highlight: '12+ mentees admitted',
    Icon: GraduationCap,
  },
  {
    name: 'Vaishali',
    subtitle: "IIM Bangalore ’19 | Product Manager",
    role: 'Essay Coach',
    highlight: 'Essay Coach',
    Icon: FileText,
  },
];

export default function WhyAdmit55() {
  return (
    <section className="relative w-full bg-gradient-to-b from-[#0a3a6a] to-[#0b487f] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20">

        {/* Guarantee pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-3 py-1 text-sm font-semibold text-slate-900 shadow">
            <ShieldCheck className="h-4 w-4" />
            100% GUARANTEE
          </div>
        </div>

        {/* Heading + subcopy */}
        <h2 className="mt-5 text-center text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
          Guaranteed Admission or 100% Money Back
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-slate-100/90">
          Work 1:1 with ISB, IIM, and INSEAD alumni who’ve helped hundreds of candidates
          succeed. If you don’t secure admission to your top 5 B-Schools, we’ll refund you —
          no questions asked.
        </p>

        {/* Divider label */}
        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-sm font-semibold tracking-wide text-white/80 select-none">
            Meet Your Coaches
          </span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        {/* Coach cards – centered, only 2 columns max */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {COACHES.map((c, i) => (
            <CoachCard key={i} coach={c} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/book-session"
            prefetch={false}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-red-900/20 ring-1 ring-red-400/40 transition hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Book a Session
          </Link>
        </div>

        {/* Fine print */}
        <p className="mt-3 text-center text-xs text-white/70">
          Limited slots available • Premium coaching packages starting at ₹50,000
        </p>
      </div>
    </section>
  );
}

/* ---------- subcomponents ---------- */

function CoachCard({ coach }: { coach: Coach }) {
  const { name, subtitle, role, highlight, Icon } = coach;
  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 backdrop-blur-sm shadow-lg shadow-black/10 transition hover:-translate-y-0.5">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/40">
          <Icon className="h-7 w-7 text-emerald-300" />
        </div>
        <div>
          <div className="text-lg font-semibold">{name}</div>
          <div className="text-sm text-white/80">{subtitle}</div>
        </div>
      </div>

      <div className="mt-4 h-px w-full bg-white/10" />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-white/90">{role}</span>
        <span className="text-xs font-semibold text-emerald-300">{highlight}</span>
      </div>
    </div>
  );
}
