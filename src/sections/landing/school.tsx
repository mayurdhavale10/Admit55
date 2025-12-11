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

        {/* ONE-LINE HEADING */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-6 whitespace-nowrap">

            {/* Heading text */}
            <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
              Explore Your Dream Programs
            </span>

            {/* Logo + Admit55 */}
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

          <p className="mt-3 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto">
            From ISB to IIMs and beyond — compare key stats, admissions trends, and essay insights
          </p>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SCHOOLS.map((s) => (
            <SchoolCard key={s.slug} s={s} />
          ))}
        </div>

        {/* VIEW ALL → updated redirect */}
        <div className="mt-8 flex justify-center">
          <Link
            prefetch={false}
            href="http://localhost:3000/mba/tools/bschool-match"
            className="inline-flex items-center gap-2 rounded-md bg-[#0B5CAB] px-5 py-3 text-white font-semibold shadow-md hover:bg-[#0a519c]"
          >
            View All B-Schools
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* BUILT BY EXPERTS SECTION */}
      <div className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* TEXT BLOCK */}
            <div className="lg:col-span-6">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
                Built by admissions experts.{` `}
                <span className="bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
                  Powered by AI.
                </span>
              </h3>

              <p className="mt-3 text-slate-600">
                Admit55 was founded by top admissions mentors and AI professionals who've personally
                guided 1,000+ candidates to their dream B-schools. The journey started with the
                bestselling book <span className="italic">55 Successful ISB Essays</span> — now
                reimagined for the AI era.
              </p>

              <div className="mt-6 rounded-xl bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 p-4 flex gap-3">
                <Quote className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm">
                  <span className="italic">
                    "We've seen what works. Now we're making it accessible to everyone."
                  </span>
                  <br />
                  <span className="text-emerald-800/80">— Founders, Admit55</span>
                </p>
              </div>
            </div>

            {/* BOOK FLIP CARD */}
            <div className="lg:col-span-6">
              <BookFlipCard />
            </div>

          </div>
        </div>
      </div>

    </section>
  );
}

/* ---------------- subcomponents ---------------- */

function BookFlipCard() {
  const [currentPage, setCurrentPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  const pages = [
    '/book/isbbookcover.webp',
    '/book/page1.webp',
    '/book/page2.webp',
    '/book/page3.webp',
    '/book/page4.webp',
    '/book/blurpage.webp',
    '/book/blurpage.webp',
    '/book/blurpage.webp',
  ];

  const handleNext = () => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    
    setTimeout(() => {
      if (currentPage < pages.length - 1) {
        setCurrentPage(currentPage + 1);
        // Show modal when reaching first blur page (page 5, index 5)
        if (currentPage === 4) {
          setTimeout(() => setShowModal(true), 400);
        }
      } else {
        setShowModal(true);
      }
      setIsFlipping(false);
    }, 800);
  };

  const handlePrev = () => {
    if (isFlipping || currentPage === 0) return;
    
    setIsFlipping(true);
    
    setTimeout(() => {
      setCurrentPage(currentPage - 1);
      setIsFlipping(false);
    }, 800);
  };

  return (
    <>
      <div className="relative">
        <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 p-6 shadow-2xl">
          <div className="relative w-full max-w-xs mx-auto">
            {/* Book Container with realistic 3D perspective */}
            <div 
              className="relative w-full aspect-[2/3] mx-auto"
              style={{ 
                perspective: '1200px',
                perspectiveOrigin: '50% 50%'
              }}
            >
              {/* 3D ROTATED PARENT CONTAINER */}
              <div
                style={{
                  transform: 'rotateX(8deg) rotateY(-12deg)',
                  transformStyle: 'preserve-3d',
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                }}
              >
                {/* Book Shadow */}
                <div 
                  className="absolute inset-0 bg-black/40 blur-xl rounded-lg pointer-events-none"
                  style={{ 
                    transform: 'translateY(2rem) translateZ(-20px)',
                    transformStyle: 'preserve-3d'
                  }}
                />
                
                {/* BOOK CONTENT WRAPPER - NO ROTATION */}
                <div className="relative w-full h-full">
                  {/* Static Book Base */}
                  <div 
                    className="absolute inset-0 rounded-lg bg-white overflow-hidden"
                    style={{ 
                      boxShadow: '20px 20px 40px rgba(0,0,0,0.3), -5px 0 20px rgba(0,0,0,0.1)',
                    }}
                  >
                    {/* Book spine effect */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-slate-800 to-slate-700"
                      style={{ 
                        boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.4)'
                      }}
                    />
                    <Image
                      src={pages[currentPage]}
                      alt={`Page ${currentPage + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* Flipping Page Overlay */}
                  {isFlipping && currentPage < pages.length - 1 && (
                    <div 
                      className="absolute inset-0 origin-left"
                      style={{
                        transformStyle: 'preserve-3d',
                        animation: 'pageFlip 800ms cubic-bezier(0.645, 0.045, 0.355, 1) forwards',
                        WebkitTransformStyle: 'preserve-3d',
                        zIndex: 10
                      }}
                    >
                      {/* Front of flipping page (current page) */}
                      <div 
                        className="absolute inset-0 rounded-lg overflow-hidden"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          backgroundColor: 'white',
                          boxShadow: '5px 5px 15px rgba(0,0,0,0.3)',
                        }}
                      >
                        <Image
                          src={pages[currentPage]}
                          alt={`Page ${currentPage + 1}`}
                          fill
                          className="object-contain"
                        />
                      </div>

                      {/* Back of flipping page (next page, mirrored) */}
                      <div 
                        className="absolute inset-0 rounded-lg overflow-hidden"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          WebkitTransform: 'rotateY(180deg)',
                          backgroundColor: 'white',
                          boxShadow: '5px 5px 15px rgba(0,0,0,0.3)',
                        }}
                      >
                        <Image
                          src={pages[currentPage + 1]}
                          alt={`Page ${currentPage + 2}`}
                          fill
                          className="object-contain scale-x-[-1]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={handlePrev}
                disabled={currentPage === 0 || isFlipping}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white disabled:opacity-0 disabled:pointer-events-none transition-all"
                aria-label="Previous page"
              >
                <ChevronRight className="h-5 w-5 text-slate-700 rotate-180" />
              </button>

              <button
                onClick={handleNext}
                disabled={isFlipping}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white disabled:opacity-50 transition-all"
                aria-label="Next page"
              >
                <ChevronRight className="h-5 w-5 text-slate-700" />
              </button>
            </div>

            {/* Book Info */}
            <div className="mt-6 text-center">
              <h4 className="text-lg font-bold text-slate-900">
                55 Successful ISB Essays
              </h4>
              <p className="mt-2 text-sm text-slate-600 flex items-center justify-center gap-2">
                4,000+ copies sold
                <span className="h-1 w-1 rounded-full bg-slate-400 inline-block" />
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                4.8 on Amazon
              </p>
              
              {/* Page Indicator */}
              <div className="mt-4 flex items-center justify-center gap-1.5">
                {pages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentPage
                        ? 'w-8 bg-[#0B5CAB]'
                        : 'w-1.5 bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in zoom-in-95">
            <button
              onClick={() => {
                setShowModal(false);
                setCurrentPage(0);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#0B5CAB] to-[#0a3a6a] mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-slate-900">
                Want to Read More?
              </h3>
              
              <p className="mt-3 text-slate-600">
                Get the complete book with all 55 successful ISB essays, expert analysis, and proven strategies.
              </p>

              <div className="mt-6 p-4 rounded-xl bg-emerald-50 ring-1 ring-emerald-200">
                <div className="flex items-center justify-center gap-2 text-emerald-900">
                  <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                  <span className="font-semibold">4.8/5 Rating</span>
                  <span className="text-emerald-700">• 4,000+ Sold</span>
                </div>
              </div>

              <Link
                href="https://www.amazon.in/Successful-ISB-Essays-Their-Analysis/dp/1647606160/ref=sr_1_1?crid=3POHFB7T9U2CI&dib=eyJ2IjoiMSJ9.uN1JYchBfdxHWiFoARzgzw.GcoUXmDVlBq5PHECeX_0kDF2t27WeLauHMWek2s1Wr0&dib_tag=se&keywords=55+successful+isb+essays&qid=1765373501&sprefix=55+essay%2Caps%2C171&sr=8-1"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center w-full gap-2 rounded-full bg-gradient-to-r from-[#0B5CAB] to-[#0a3a6a] text-white px-6 py-3.5 text-base font-semibold shadow-lg hover:shadow-xl transition"
              >
                Buy on Amazon
                <ChevronRight className="h-5 w-5" />
              </Link>

              <button
                onClick={() => {
                  setShowModal(false);
                  setCurrentPage(0);
                }}
                className="mt-3 text-sm text-slate-500 hover:text-slate-700 transition"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pageFlip {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(-180deg);
          }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoom-in-95 {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-in {
          animation-duration: 300ms;
          animation-fill-mode: both;
        }
        .fade-in {
          animation-name: fade-in;
        }
        .zoom-in-95 {
          animation-name: zoom-in-95;
        }
      `}</style>
    </>
  );
}

function SchoolCard({ s }: { s: School }) {
  const logoSize = s.name === 'ISB' || s.name === 'INSEAD' ? 64 : 38;

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

        {/* BUTTON */}
        <Link
          prefetch={false}
          href="http://localhost:3000/mba/tools/bschool-match"
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