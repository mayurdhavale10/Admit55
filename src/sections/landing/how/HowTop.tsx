'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';

/* ---------- routes ---------- */
const PROFILE_ROUTE = '/mba/tools/profileresumetool';
const BSCHOOL_ROUTE = '/dream-b-schools';

/* ---------- types ---------- */
type ToolCard = {
  title: string;
  subtitle: string;
  src: string;
  href?: string;
  comingSoon?: boolean;
  tone: 'blue' | 'green' | 'purple' | 'orange';
};

/* ---------- content ---------- */
const toolCards: ToolCard[] = [
  {
    title: 'Profile Snapshot',
    subtitle: 'Diagnose your MBA readiness instantly.',
    src: '/logo/profileicon.webp',
    href: PROFILE_ROUTE,
    tone: 'blue',
  },
  {
    title: 'B-School Match',
    subtitle: 'Discover schools that fit your goals.',
    src: '/logo/Bschool.webp',
    href: BSCHOOL_ROUTE,
    tone: 'green',
  },
  {
    title: 'Essay Lab',
    subtitle: 'Coming Soon',
    src: '/logo/essayicon.webp',
    comingSoon: true,
    tone: 'purple',
  },
  {
    title: 'Interview Ready',
    subtitle: 'Coming Soon',
    src: '/logo/interviewicon.webp',
    comingSoon: true,
    tone: 'orange',
  },
];

export default function HowTop() {
  const [activeTab, setActiveTab] = useState<'tools' | 'experts'>('tools');
  const [isMobile, setIsMobile] = useState(false);

  /* ---------- detect mobile ---------- */
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 640);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 text-center">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-black">
        Your MBA Journey, Guided by AI and Experience
      </h2>

      <p className="mt-3 text-base sm:text-lg lg:text-xl text-black max-w-2xl mx-auto">
        Comprehensive tools to elevate every aspect of your application
      </p>

      {/* Tabs */}
      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`w-32 sm:w-40 py-2 text-sm sm:text-base font-semibold rounded-full transition-all ${
              activeTab === 'tools'
                ? 'bg-gradient-to-r from-[#3F37C9] to-[#12D8B5] text-white shadow-md'
                : 'bg-white text-slate-700'
            }`}
          >
            Tools
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('experts')}
            className={`w-32 sm:w-40 ml-2 py-2 text-sm sm:text-base font-semibold rounded-full transition-all ${
              activeTab === 'experts'
                ? 'bg-gradient-to-r from-[#3F37C9] to-[#12D8B5] text-white shadow-md'
                : 'bg-white text-slate-700'
            }`}
          >
            Our Experts
          </button>
        </div>
      </div>

      {/* TOOLS TAB CONTENT */}
      {activeTab === 'tools' && (
        <>
          {/* MOBILE: grid layout */}
          {isMobile ? (
            <div className="mt-10 max-w-md mx-auto grid grid-cols-2 gap-x-6 gap-y-10">
              {toolCards.map((t, i) => {
                const size = 96; // Increased from 72-80 to 96

                const Inner = (
                  <div className="flex flex-col items-center gap-3">
                    <div
                      style={{
                        width: size,
                        height: size,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Image
                        src={t.src}
                        alt={t.title}
                        width={size}
                        height={size}
                        className="object-contain"
                      />
                    </div>
                    <div className="text-xs font-semibold text-slate-700 text-center">
                      {t.title}
                    </div>
                    <div className="text-[11px] text-slate-500 text-center leading-snug">
                      {t.subtitle}
                    </div>
                  </div>
                );

                return t.href && !t.comingSoon ? (
                  <Link href={t.href} key={i} prefetch={false}>
                    {Inner}
                  </Link>
                ) : (
                  <div key={i}>{Inner}</div>
                );
              })}
            </div>
          ) : (
            /* DESKTOP / TABLET: horizontal layout with larger icons */
            <div className="mt-12 relative mx-auto max-w-5xl pb-8">
              <div className="flex items-end justify-between gap-6 sm:gap-10 px-4">
                {toolCards.map((t, i) => {
                  const iconSize = 160; // Increased from 96-128 to 160

                  const Inner = (
                    <div className="flex flex-col items-center gap-4 flex-1">
                      <div
                        style={{
                          width: iconSize,
                          height: iconSize,
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Image
                          src={t.src}
                          alt={t.title}
                          width={iconSize}
                          height={iconSize}
                          className="object-contain"
                        />
                      </div>

                      <div className="text-base sm:text-xl text-slate-700 font-semibold mt-2 text-center">
                        {t.title}
                      </div>
                      <div className="text-sm sm:text-base text-slate-500 text-center">
                        {t.subtitle}
                      </div>
                    </div>
                  );

                  return t.href && !t.comingSoon ? (
                    <Link
                      href={t.href}
                      key={i}
                      className="block flex-1"
                      prefetch={false}
                    >
                      {Inner}
                    </Link>
                  ) : (
                    <div key={i} className="block flex-1">
                      {Inner}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Follow text only when Tools tab is active */}
      <div
        className={`mt-6 text-xs sm:text-sm text-slate-500 ${
          activeTab === 'tools' ? 'block' : 'hidden'
        }`}
      >
        Follow the journey: Profile → B-School → Essay → Interview
      </div>

      {/* OUR EXPERTS TAB CONTENT */}
      <div
        className={`mt-16 ${
          activeTab === 'experts' ? 'block' : 'hidden'
        }`}
      >
        <div className="max-w-6xl mx-auto text-left">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 text-center lg:text-left">
            Admissions Intelligence Engineered by an Ex-ISB MBA and Trained on
            Authentic Profiles, Essays &amp; Outcomes
          </h3>

          <div className="mt-10 flex flex-col lg:flex-row items-center lg:items-start gap-10">
            {/* Left: credentials + copy + button */}
            <div className="w-full lg:w-5/12 flex flex-col items-center lg:items-start gap-6">
              <div className="w-full max-w-sm">
                <Image
                  src="/how/credentials.webp"
                  alt="Admit55 expert credentials"
                  width={480}
                  height={360}
                  className="w-full h-auto rounded-xl shadow-md object-contain"
                />
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed text-center lg:text-left">
                Work 1:1 with ISB, IIM, and INSEAD alumni who've helped hundreds
                of candidates succeed. If you don't secure admission to your top
                5 B-Schools, we'll refund you — no questions asked.
              </p>

              <button
                type="button"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 px-7 py-3 text-sm sm:text-base font-semibold text-white shadow-md transition-colors"
              >
                Grab your seat now
              </button>
            </div>

            {/* Right: YouTube video */}
            <div className="w-full lg:w-7/12">
              <div className="relative w-full pt-[56.25%] rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/LPZh9BOjkQs"
                  title="Admit55 Experts"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}