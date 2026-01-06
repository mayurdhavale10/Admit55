'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

export default function ISBBookPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showAmazonPopup, setShowAmazonPopup] = useState(false);
  const [counters, setCounters] = useState({ mba: 0, career: 0, book: 0 });
  const [hasAnimated, setHasAnimated] = useState(false);

  const bookRef = useRef<HTMLDivElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);

  const pages = [
    '/book/isbbookcover.webp',
    '/book/page1.webp',
    '/book/page2.webp',
    '/book/page3.webp',
    '/book/page4.webp',
    '/book/blurpage.webp',
  ];

  const totalPages = pages.length;

  /* ---------------- COUNTER ANIMATION ---------------- */

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateCounters();
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  const animateCounters = () => {
    const duration = 1800;
    const steps = 60;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const p = step / steps;

      setCounters({
        mba: Math.floor(100 * easeOut(p)),
        career: Math.floor(1000 * easeOut(p)),
        book: Math.floor(10000 * easeOut(p)),
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounters({ mba: 100, career: 1000, book: 10000 });
      }
    }, duration / steps);
  };

  const easeOut = (t: number) => t * (2 - t);

  /* ---------------- PAGE FLIP ---------------- */

  const nextPage = () => {
    if (currentPage < totalPages - 1 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        const next = currentPage + 1;
        setCurrentPage(next);
        setIsFlipping(false);
        if (next === totalPages - 1) setShowAmazonPopup(true);
      }, 500);
    }
  };

  const prevPage = () => {
    if (currentPage > 0 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage((p) => p - 1);
        setIsFlipping(false);
      }, 500);
    }
  };

  const isDesktop =
    typeof window !== 'undefined' && window.innerWidth >= 1024;

  /* ============================== */

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* ---------- HEADING ---------- */}
      <div className="text-center mb-12">
        <h2 className="flex items-center justify-center gap-3 flex-wrap text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900">
          <span>Foundation of</span>
          <img
            src="/logo/admit55_final_logo.webp"
            alt="Admit55"
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
          />
          <span>Admit55</span>
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* ================= LEFT ================= */}
        <div className="space-y-8">
          {/* Glass Pill */}
          <div className="text-center lg:text-left space-y-5">
            <div className="inline-block relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-100/60 via-cyan-100/60 to-teal-100/60 blur-md rounded-full -rotate-1" />
              <div className="relative bg-white/40 backdrop-blur-sm border border-teal-200 rounded-full px-6 py-3 shadow-md">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-teal-700">
                  55 Successful ISB Essays & Their Analysis
                </h3>
              </div>
            </div>

            <p className="text-base sm:text-lg text-slate-700 max-w-xl mx-auto lg:mx-0 font-medium">
              The foundational work that powers our AI. Real essays, real analysis, real outcomes.
            </p>
          </div>

          {/* Stats */}
          <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Successful MBA Admits', value: counters.mba, color: 'from-teal-500 to-teal-600' },
              { label: 'Career Discovery Sessions', value: counters.career, color: 'from-blue-500 to-blue-600' },
              { label: 'Book Sales', value: counters.book, color: 'from-amber-500 to-orange-600' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className={`mx-auto mb-4 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${s.color} shadow-xl`} />
                <div className="text-4xl sm:text-5xl font-extrabold text-slate-900">
                  {s.value.toLocaleString()}+
                </div>
                <div className="mt-1 text-sm sm:text-base text-slate-600 font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() =>
              window.open(
                'https://www.amazon.in/Successful-ISB-Essays-Their-Analysis/dp/1647606160',
                '_blank'
              )
            }
            className="mx-auto lg:mx-0 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:scale-[1.03] transition"
          >
            View on Amazon
            <ExternalLink size={20} />
          </button>
        </div>

        {/* ================= RIGHT (3D BOOK) ================= */}
        <div className="flex justify-center">
          <div
            ref={bookRef}
            className="relative w-full max-w-[260px] sm:max-w-[320px] lg:max-w-[380px]"
            style={{ perspective: isDesktop ? '2000px' : '700px' }}
          >
            <div
              className="relative transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: isDesktop
                  ? 'rotateY(-22deg) rotateX(6deg)'
                  : 'rotateY(-8deg)',
              }}
            >
              <div
                className="absolute inset-0 bg-black/30 blur-2xl"
                style={{
                  transform: isDesktop
                    ? 'translateZ(-60px) translateY(30px)'
                    : 'translateY(18px)',
                  zIndex: -1,
                }}
              />

              <div className="relative overflow-hidden rounded-xl bg-white shadow-2xl aspect-[3/4.4]">
                <img
                  src={pages[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  className={`h-full w-full object-cover ${isFlipping ? 'animate-page-flip' : ''}`}
                />
              </div>

              <div className="mt-4 text-center text-sm font-medium text-slate-600">
                Page {currentPage + 1} of {totalPages}
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={prevPage}
                disabled={currentPage === 0 || isFlipping}
                className="rounded-full bg-teal-600 p-3 text-white hover:bg-teal-700 disabled:opacity-40"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages - 1 || isFlipping}
                className="rounded-full bg-teal-600 p-3 text-white hover:bg-teal-700 disabled:opacity-40"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- AMAZON POPUP ---------- */}
      {showAmazonPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-center">
              55 Successful ISB Essays
            </h3>
            <p className="mt-2 text-center text-slate-600">
              Get your copy on Amazon
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() =>
                  window.open(
                    'https://www.amazon.in/Successful-ISB-Essays-Their-Analysis/dp/1647606160',
                    '_blank'
                  )
                }
                className="flex-1 rounded-xl bg-teal-600 px-4 py-3 text-white font-semibold"
              >
                View on Amazon
              </button>
              <button
                onClick={() => setShowAmazonPopup(false)}
                className="rounded-xl border px-4 py-3 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes page-flip {
          from {
            transform: rotateY(0deg);
          }
          to {
            transform: rotateY(-180deg);
          }
        }
        .animate-page-flip {
          animation: page-flip 0.5s ease-in-out;
          transform-origin: left center;
        }
      `}</style>
    </section>
  );
}
