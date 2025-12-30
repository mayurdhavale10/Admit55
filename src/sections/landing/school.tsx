'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import {
  TrendingUp,
  Users,
  BadgePercent,
  ChevronRight,
  BookOpen,
  Star,
  Quote,
  X,
} from 'lucide-react';

type School = {
  name: string;
  subtitle: string;
  gmat: number;
  classSize: string;
  acceptRate: string;
  slug: string;
  logo: string;
};

const SCHOOLS: School[] = [
  {
    name: 'ISB',
    subtitle: 'Indian School of Business',
    gmat: 710,
    classSize: '900+',
    acceptRate: '25%',
    slug: 'isb',
    logo: '/school/ISBB.webp',
  },
  {
    name: 'IIM Ahmedabad',
    subtitle: 'IIM A',
    gmat: 700,
    classSize: '400+',
    acceptRate: '10%',
    slug: 'iim-ahmedabad',
    logo: '/school/IIMA.webp',
  },
  {
    name: 'IIM Bangalore',
    subtitle: 'IIM B',
    gmat: 705,
    classSize: '400+',
    acceptRate: '12%',
    slug: 'iim-bangalore',
    logo: '/school/IIMB.webp',
  },
  {
    name: 'IIM Kozhikode',
    subtitle: 'IIM K',
    gmat: 695,
    classSize: '460+',
    acceptRate: '15%',
    slug: 'iim-kozhikode',
    logo: '/school/IIMKozhikode.webp',
  },
  {
    name: 'XLRI',
    subtitle: 'Xavier School of Management',
    gmat: 680,
    classSize: '360+',
    acceptRate: '18%',
    slug: 'xlri',
    logo: '/school/XLRI.webp',
  },
  {
    name: 'INSEAD',
    subtitle: 'Institut Européen d\'Administration',
    gmat: 710,
    classSize: '1000+',
    acceptRate: '25%',
    slug: 'insead',
    logo: '/school/INSEAD.webp',
  },
];

export default function School() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">

        {/* HEADING */}
        <div className="text-center mb-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900">
              Explore Your Dream Programs
            </span>

            <div className="flex items-center gap-3">
              <Image
                src="/logo/admit55_final_logo.webp"
                alt="Admit55 Logo"
                width={54}
                height={54}
                className="object-contain"
              />
              <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">
                Admit55
              </span>
            </div>
          </div>

          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            From ISB to IIMs and beyond — compare key stats, admissions trends, and essay insights
          </p>
        </div>

        {/* SCHOOL CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SCHOOLS.map((s) => (
            <SchoolCard key={s.slug} s={s} />
          ))}
        </div>

        {/* VIEW ALL */}
        <div className="mt-8 flex justify-center">
          <Link
            prefetch={false}
            href="/mba/tools/bschool-match"
            className="inline-flex items-center gap-2 rounded-md bg-[#0B5CAB] px-5 py-3 text-white font-semibold shadow-md hover:bg-[#0a519c]"
          >
            View All B-Schools
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- School Card ---------- */

function SchoolCard({ s }: { s: School }) {
  const logoSize = s.name === 'ISB' || s.name === 'INSEAD' ? 64 : 38;

  // ✅ CONDITIONAL REDIRECT
  const checkFitHref =
    s.name === 'IIM Ahmedabad'
      ? 'https://admit55.vercel.app/BSchools/IIMADubai'
      : '/mba/tools/bschool-match';

  return (
    <div className="group rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm hover:shadow-lg transition overflow-hidden">
      <div className="p-6">

        {/* LOGO + NAME */}
        <div className="flex items-center gap-4">
          <Image
            src={s.logo}
            alt={s.name}
            width={logoSize}
            height={logoSize}
            className="object-contain"
          />

          <div>
            <div className="text-xl font-semibold text-slate-900">{s.name}</div>
            <div className="text-sm text-slate-500">{s.subtitle}</div>
          </div>
        </div>

        {/* METRICS */}
        <div className="mt-5 space-y-3">
          <Metric icon={<TrendingUp className="h-4 w-4" />} label="Avg GMAT" value={s.gmat.toString()} />
          <Metric icon={<Users className="h-4 w-4" />} label="Class Size" value={s.classSize} />
          <Metric icon={<BadgePercent className="h-4 w-4" />} label="Acceptance Rate" value={s.acceptRate} />
        </div>

        {/* CTA */}
        <Link
          prefetch={false}
          href={checkFitHref}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Check My Fit
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: any) {
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
