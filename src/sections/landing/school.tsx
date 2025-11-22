'use client';

import Link from 'next/link';
import {
  TrendingUp,
  Users,
  BadgePercent,
  ChevronRight,
  BookOpen,
  Star,
  Quote,
} from 'lucide-react';

type School = {
  name: string;
  subtitle: string;
  gmat: number;
  classSize: string;
  acceptRate: string;
  slug: string;
};

const SCHOOLS: School[] = [
  { name: 'ISB', subtitle: 'Indian School of Business', gmat: 710, classSize: '900+', acceptRate: '25%', slug: 'isb' },
  { name: 'IIM Ahmedabad', subtitle: 'IIM A', gmat: 700, classSize: '400+', acceptRate: '10%', slug: 'iim-ahmedabad' },
  { name: 'IIM Bangalore', subtitle: 'IIM B', gmat: 705, classSize: '400+', acceptRate: '12%', slug: 'iim-bangalore' },
  { name: 'IIM Calcutta', subtitle: 'IIM C', gmat: 695, classSize: '460+', acceptRate: '15%', slug: 'iim-calcutta' },
  { name: 'XLRI', subtitle: 'Xavier School of Management', gmat: 680, classSize: '360+', acceptRate: '18%', slug: 'xlri' },
  { name: 'INSEAD', subtitle: 'Institut Européen d’Administration', gmat: 710, classSize: '1000+', acceptRate: '25%', slug: 'insead' },
];

export default function School() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        {/* Heading */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Explore Your Dream Programs
          </h2>
          <p className="mt-2 text-slate-600">
            From ISB to IIMs and beyond — compare key stats, admissions trends, and essay insights
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SCHOOLS.map((s) => (
            <SchoolCard key={s.slug} s={s} />
          ))}
        </div>

        {/* View All */}
        <div className="mt-8 flex justify-center">
          <Link
            prefetch={false}
            href="/dream-b-schools"
            className="inline-flex items-center gap-2 rounded-md bg-[#0B5CAB] px-5 py-3 text-white font-semibold shadow-md hover:bg-[#0a519c] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0B5CAB]"
          >
            View All B-Schools
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Built by experts band */}
      <div className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Text block */}
            <div className="lg:col-span-6">
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Built by admissions experts.{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
                  Powered by AI.
                </span>
              </h3>
              <p className="mt-3 text-slate-600">
                Admit55 was founded by top admissions mentors and AI professionals who’ve personally
                guided 1,000+ candidates to their dream B-schools. The journey started with the
                bestselling book <span className="italic">55 Successful ISB Essays</span> — now
                reimagined for the AI era.
              </p>

              <div className="mt-6 rounded-xl bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 p-4 flex gap-3">
                <Quote className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm">
                  <span className="italic">
                    “We’ve seen what works. Now we’re making it accessible to everyone.”
                  </span>
                  <br />
                  <span className="text-emerald-800/80">— Founders, Admit55</span>
                </p>
              </div>
            </div>

            {/* Book card */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-gradient-to-br from-[#0a3a6a] to-[#0b487f] p-1 shadow-xl">
                <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-8 text-white">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                      <BookOpen className="h-10 w-10" />
                    </div>
                    <h4 className="text-xl sm:text-2xl font-semibold">
                      55 Successful ISB Essays
                    </h4>
                    <p className="mt-2 text-sm text-white/80 flex items-center gap-2">
                      4,000+ copies sold
                      <span className="h-1 w-1 rounded-full bg-white/40 inline-block" />
                      <Star className="h-4 w-4 text-amber-300" />
                      4.8 on Amazon
                    </p>

                    <Link
                      href="https://www.amazon.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-5 py-2.5 text-sm font-semibold shadow hover:bg-white/95"
                    >
                      View on Amazon
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- subcomponents ---------------- */

function SchoolCard({ s }: { s: School }) {
  return (
    <div className="group rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm hover:shadow-lg transition overflow-hidden">
      <div className="p-6">
        <div className="text-xl font-semibold text-slate-900">{s.name}</div>
        <div className="text-sm text-slate-500">{s.subtitle}</div>

        <div className="mt-5 space-y-3">
          <Metric
            icon={<TrendingUp className="h-4 w-4" />}
            label="Avg GMAT"
            value={s.gmat.toString()}
          />
          <Metric
            icon={<Users className="h-4 w-4" />}
            label="Class Size"
            value={s.classSize}
          />
          <Metric
            icon={<BadgePercent className="h-4 w-4" />}
            label="Acceptance Rate"
            value={s.acceptRate}
          />
        </div>

        <Link
          prefetch={false}
          href={`/dream-b-schools?school=${encodeURIComponent(s.slug)}`}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
        >
          Check My Fit
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-600">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
          {icon}
        </span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
