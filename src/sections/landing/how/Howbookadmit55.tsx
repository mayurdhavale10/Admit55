'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, GraduationCap, Globe, BookOpen } from 'lucide-react';

export default function ISBBookPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showAmazonPopup, setShowAmazonPopup] = useState(false);
  const [counters, setCounters] = useState({ mba: 0, career: 0, book: 0 });
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const bookRef = useRef(null);
  const statsRef = useRef(null);

  // Book images
  const pages = [
    '/book/isbbookcover.webp',
    '/book/page1.webp',
    '/book/page2.webp',
    '/book/page3.webp',
    '/book/page4.webp',
    '/book/blurpage.webp'
  ];

  const totalPages = pages.length;

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Counter animation effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateCounters();
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const animateCounters = () => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setCounters({
        mba: Math.floor(100 * easeOutQuad(progress)),
        career: Math.floor(1000 * easeOutQuad(progress)),
        book: Math.floor(10000 * easeOutQuad(progress)),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setCounters({ mba: 100, career: 1000, book: 10000 });
      }
    }, interval);
  };

  const easeOutQuad = (t: number) => t * (2 - t);

  const nextPage = () => {
    if (currentPage < totalPages - 1 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsFlipping(false);
        
        if (currentPage + 1 === totalPages - 1) {
          setShowAmazonPopup(true);
        }
      }, isMobile ? 400 : 600);
    }
  };

  const prevPage = () => {
    if (currentPage > 0 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setIsFlipping(false);
      }, isMobile ? 400 : 600);
    }
  };

  const handleAmazonClick = () => {
    window.open('https://www.amazon.in/Successful-ISB-Essays-Their-Analysis/dp/1647606160', '_blank');
    setShowAmazonPopup(false);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      {/* Heading */}
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-6 sm:mb-8">
          <span>Foundation of</span>
          <img
            src="/logo/admit55_final_logo.webp"
            alt="Admit55 Logo"
            className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-contain"
          />
          <span>Admit55</span>
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        
        {/* Left Side - Description and Stats */}
        <div className="space-y-6 sm:space-y-8">
          {/* Book Description with Glass Pill */}
          <div className="text-center lg:text-left space-y-4 sm:space-y-6">
            <div className="inline-block">
              <div className="relative">
                {/* Glass pill background */}
                <div className="absolute inset-0 bg-gradient-to-r from-teal-100/60 via-cyan-100/60 to-teal-100/60 backdrop-blur-md rounded-full transform -rotate-1" />
                <div className="relative bg-white/40 backdrop-blur-sm border-2 border-teal-200/50 rounded-full px-4 py-2 sm:px-6 sm:py-3 shadow-lg">
                  <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-extrabold text-teal-700">
                    55 Successful ISB Essays & Their Analysis
                  </h3>
                </div>
              </div>
            </div>
            <p className="text-base sm:text-lg lg:text-xl text-slate-700 max-w-xl mx-auto lg:mx-0 font-medium px-4 sm:px-0">
              The foundational work that powers our AI. Real essays, real analysis, real outcomes.
            </p>
          </div>

          {/* Stats with Icons */}
          <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { label: 'Successful MBA Admits', value: counters.mba, color: 'from-teal-500 to-teal-600', icon: GraduationCap },
              { label: 'Career Discovery Sessions', value: counters.career, color: 'from-blue-500 to-blue-600', icon: Globe },
              { label: 'Book Sales', value: counters.book, color: 'from-amber-500 to-orange-600', icon: BookOpen },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${s.color} shadow-xl mb-3 sm:mb-4`}>
                  <s.icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" strokeWidth={2} />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-1 sm:mb-2">
                  {s.value.toLocaleString()}+
                </div>
                <div className="text-slate-600 text-xs sm:text-sm lg:text-base font-medium px-2">{s.label}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => window.open('https://www.amazon.in/Successful-ISB-Essays-Their-Analysis/dp/1647606160', '_blank')}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold transition-all transform hover:scale-105 shadow-lg mx-auto lg:mx-0"
          >
            View on Amazon
            <ExternalLink size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Right Side - Book Display */}
        <div className="relative flex items-center justify-center">
          {isMobile ? (
            /* MOBILE: Simple Flat Book */
            <div className="w-full max-w-sm mx-auto px-4">
              <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden">
                <img
                  src={pages[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  className="w-full h-auto aspect-[3/4.4] object-cover"
                />
              </div>
              
              <div className="mt-4 text-center text-sm font-medium text-slate-600">
                Page {currentPage + 1} of {totalPages}
              </div>

              {/* Mobile Navigation */}
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 0 || isFlipping}
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50 p-3 rounded-full transition-all shadow-lg text-white"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages - 1 || isFlipping}
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50 p-3 rounded-full transition-all shadow-lg text-white"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          ) : (
            /* DESKTOP: Full 3D Book */
            <div className="relative w-full flex items-center justify-center min-h-[600px]">
              <div 
                ref={bookRef}
                className="relative w-full max-w-sm mx-auto"
                style={{
                  perspective: '2000px',
                  perspectiveOrigin: '50% 50%'
                }}
              >
                {/* Book Container - Tilted */}
                <div
                  className="relative"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'rotateY(-25deg) rotateX(5deg)',
                  }}
                >
                  {/* Book Shadow */}
                  <div 
                    className="absolute inset-0 bg-teal-900/40 blur-3xl"
                    style={{
                      transform: 'translateZ(-80px) translateY(40px) scale(1.1)',
                      zIndex: -1
                    }}
                  />

                  {/* Book Spine/Thickness */}
                  <div className="absolute left-0 top-0 bottom-0" style={{ transformStyle: 'preserve-3d' }}>
                    {[...Array(25)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 w-1"
                        style={{
                          left: 0,
                          background: `linear-gradient(to right, 
                            ${i < 5 ? '#0f766e' : i < 15 ? '#14b8a6' : '#e2e8f0'}, 
                            ${i < 5 ? '#115e59' : i < 15 ? '#0d9488' : '#cbd5e1'})`,
                          transform: `translateZ(${-i * 2}px)`,
                          boxShadow: i === 0 ? 'inset -3px 0 8px rgba(0,0,0,0.4)' : 'none',
                          borderLeft: i === 0 ? '1px solid rgba(0,0,0,0.2)' : 'none',
                        }}
                      />
                    ))}
                  </div>

                  {/* Main Book Body */}
                  <div className="relative bg-white rounded-r-xl overflow-hidden"
                    style={{
                      width: '340px',
                      height: '480px',
                      transformStyle: 'preserve-3d',
                      transform: 'translateZ(2px)',
                      boxShadow: '-15px 15px 40px rgba(20,184,166,0.4), inset -8px 0 15px rgba(0,0,0,0.15)',
                    }}
                  >
                    {/* Page Stack */}
                    <div className="absolute right-0 top-0 bottom-0">
                      {[...Array(Math.max(0, totalPages - currentPage - 1))].map((_, i) => (
                        <div
                          key={`right-${i}`}
                          className="absolute top-0 bottom-0 right-0 bg-white border-r border-slate-200"
                          style={{
                            width: '100%',
                            transform: `translateZ(${-i * 0.3}px) translateX(${i * 0.5}px)`,
                            boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.1)',
                          }}
                        />
                      ))}
                    </div>

                    {/* Current Page */}
                    <div
                      className={`absolute inset-0 ${isFlipping ? 'animate-page-flip' : ''}`}
                      style={{
                        transformStyle: 'preserve-3d',
                        transformOrigin: 'left center',
                        zIndex: 10,
                      }}
                    >
                      <img
                        src={pages[currentPage]}
                        alt={`Page ${currentPage + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Page curl */}
                      <div 
                        className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"
                        style={{
                          clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                        }}
                      />
                    </div>

                    {/* Back of flipping page */}
                    {isFlipping && (
                      <div
                        className="absolute inset-0 bg-slate-50"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: 'rotateY(180deg)',
                          backfaceVisibility: 'hidden',
                          zIndex: 9,
                        }}
                      />
                    )}

                    {/* Page edges */}
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-r from-transparent via-slate-200/50 to-slate-300/70" 
                         style={{ transform: 'translateZ(1px)' }} />
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-slate-800/30 via-slate-600/20 to-transparent" />
                    
                    {/* Top and bottom shadows */}
                    <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-slate-900/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-slate-900/10 to-transparent" />
                  </div>

                  {/* Page Number */}
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-slate-600 text-sm font-medium"
                       style={{ transform: 'translateX(-50%) translateZ(50px)' }}>
                    Page {currentPage + 1} of {totalPages}
                  </div>
                </div>

                {/* Desktop Navigation Buttons */}
                <button
                  onClick={prevPage}
                  disabled={currentPage === 0 || isFlipping}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50 p-4 rounded-full transition-all shadow-lg text-white z-20"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages - 1 || isFlipping}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50 p-4 rounded-full transition-all shadow-lg text-white z-20"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Amazon Popup */}
      {showAmazonPopup && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-teal-300 shadow-2xl animate-scale-in">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-2 text-center text-slate-900">
              55 Successful ISB Essays & Their Analysis
            </h3>
            <p className="text-slate-700 mb-6 text-center text-sm sm:text-base lg:text-lg font-medium">
              Get your book now
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleAmazonClick}
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                View on Amazon
                <ExternalLink size={18} />
              </button>
              <button
                onClick={() => setShowAmazonPopup(false)}
                className="px-6 py-3 bg-white/70 hover:bg-white border-2 border-teal-300 text-slate-700 rounded-xl font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes page-flip {
          0% {
            transform: rotateY(0deg);
          }
          50% {
            transform: rotateY(-90deg);
            box-shadow: -5px 5px 20px rgba(0,0,0,0.3);
          }
          100% {
            transform: rotateY(-180deg);
          }
        }

        @keyframes scale-in {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .animate-page-flip {
          animation: page-flip 0.8s cubic-bezier(0.645, 0.045, 0.355, 1.000);
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </section>
  );
}