'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const HeroAnimation = dynamic(() => import('@src/components/hero/HeroAnimation'), { ssr: false });

const SLIDES = [
  '/landing/profileresumetooldemo (1).webp',
  '/landing/profileresumetooltestimonial (1).webp',
  '/landing/essaytooldemo (1).webp',
  '/landing/essaytooltestimonial (1).webp',
] as const;

export default function AboveTheFold({
  colors = { bg: '#EFEFEF', ink: '#F8F7F4' },
}: {
  colors?: { bg: string; ink: string };
}) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [slidesReady, setSlidesReady] = useState(false);
  const slideTimer = useRef<NodeJS.Timeout | null>(null);

  // Preload slideshow images
  useEffect(() => {
    let stop = false;
    Promise.allSettled(
      SLIDES.map(
        (src) =>
          new Promise<void>((res, rej) => {
            const img = new Image();
            img.onload = () => res();
            img.onerror = () => rej();
            img.src = src;
          })
      )
    ).then(() => !stop && setSlidesReady(true));
    return () => {
      stop = true;
    };
  }, []);

  // Auto-rotate slides
  useEffect(() => {
    if (!slidesReady) return;
    if (slideTimer.current) clearInterval(slideTimer.current);
    slideTimer.current = setInterval(() => {
      setSlideIdx((i) => (i + 1) % SLIDES.length);
    }, 3500);
    return () => {
      if (slideTimer.current) clearInterval(slideTimer.current);
    };
  }, [slidesReady]);

  return (
    <section
      className="relative min-h-screen flex items-center justify-center"
      style={{ background: colors.bg, overflow: 'visible' }}
    >
      {/* Slideshow background - positioned absolutely within section */}
      {slidesReady && (
        <div className="slideshow-background">
          {SLIDES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`slide ${i === slideIdx ? 'on' : ''}`}
              draggable={false}
            />
          ))}
        </div>
      )}

      {/* Main content grid - text and animation side by side */}
      <div className="relative z-20 max-w-7xl w-full grid md:grid-cols-2 gap-10 items-start px-[6vw] py-12 mt-[-5vh]">
        {/* Left side text - stays in place */}
        <div className="flex flex-col justify-center">
          {/* New headline - single line */}
          <h1
            className="text-5xl md:text-7xl font-bold mb-4 whitespace-nowrap"
            style={{
              color: '#1d1d1f',
              fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: '1.05',
            }}
          >
            Don't Just Apply. Get Accepted.
          </h1>

          {/* Second line: "Get into your dream school with Admit55" */}
          <p
            className="text-2xl md:text-3xl font-bold mb-8"
            style={{
              fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: '1.1',
            }}
          >
            <span style={{ color: '#1d1d1f' }}>Get into your dream school with </span>
            <span className="logo-with-brush" style={{ whiteSpace: 'nowrap' }}>
              <span style={{ color: '#A3A3A3', fontWeight: 700 }}>ADMIT55</span>
              <img
                src="/logo/admit55logo.webp"
                alt="Admit55"
                style={{
                  height: '45px',
                  width: 'auto',
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  position: 'relative',
                  marginLeft: '8px',
                }}
              />
            </span>
          </p>

          <h2
            className="text-4xl md:text-5xl font-extrabold mb-6"
            style={{
              color: colors.ink,
              fontFamily: `'SF Pro Display', Inter, sans-serif`,
              textShadow: '2px 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            YOU ARE PERFECT
          </h2>
          <h2
            className="text-4xl md:text-5xl font-extrabold mb-8"
            style={{
              color: colors.ink,
              fontFamily: `'SF Pro Display', Inter, sans-serif`,
              textShadow: '2px 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            YOUR SKILLS ARE PERFECT
          </h2>
          
          {/* New text replacing the old one - Brushy style */}
          <div className="brush-text-container mb-8">
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
              <defs>
                <filter id="brush-filter">
                  <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise"/>
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/>
                  <feGaussianBlur stdDeviation="0.2"/>
                </filter>
              </defs>
            </svg>
            <p
              className="text-xl md:text-2xl font-bold brush-text-style"
              style={{
                fontFamily: `'Brush Script MT', 'SF Pro Display', cursive, sans-serif`,
                color: '#1d1d1f',
                fontWeight: 700,
                lineHeight: '1.4',
                letterSpacing: '1px',
                position: 'relative',
              }}
            >
              Leverage your potential with our tools.
              <br />
              Click on a tool or icon to get started.
            </p>
          </div>

          {/* Tools section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Profile Resume Tool */}
            <a
              href="/tools/profileresumetool"
              className="tool-card"
            >
              <img
                src="/logo/profileresumetool.webp"
                alt="ProfileResume"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  marginBottom: '8px',
                  transform: 'scale(1.4)',
                }}
              />
              <span className="tool-name">
                ProfileResume
              </span>
            </a>

            {/* Essay Tool */}
            <a
              href="/tools/essaytool"
              className="tool-card"
            >
              <img
                src="/logo/essaytool.webp"
                alt="Essay"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  marginBottom: '8px',
                }}
              />
              <span className="tool-name">
                Essay
              </span>
            </a>

            {/* Community Tool */}
            <a
              href="/tools/communitytool"
              className="tool-card"
            >
              <img
                src="/logo/community.webp"
                alt="Community"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  marginBottom: '8px',
                }}
              />
              <span className="tool-name">
                Community
              </span>
            </a>

            {/* Reapplication Tool */}
            <a
              href="/tools/reapplicationtool"
              className="tool-card"
            >
              <img
                src="/logo/reapplicationtool.webp"
                alt="Reapplication"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  marginBottom: '8px',
                }}
              />
              <span className="tool-name">
                Reapplication
              </span>
            </a>
          </div>
        </div>

        {/* Right side animation - allow overflow to prevent cropping */}
        <div className="flex justify-center items-center" style={{ overflow: 'visible' }}>
          <HeroAnimation />
        </div>
      </div>

      <style jsx>{`
        .brush-text-container {
          position: relative;
        }

        .brush-text-style {
          text-shadow: 
            2px 2px 0px rgba(0,0,0,0.1),
            -1px -1px 0px rgba(0,0,0,0.05);
          filter: contrast(1.2) url('#brush-filter');
        }

        .logo-with-brush {
          position: relative;
          display: inline-block;
        }

        .logo-with-brush::before {
          content: '';
          position: absolute;
          bottom: -5px;
          left: -10px;
          right: -10px;
          height: 25px;
          background: #FFE500;
          opacity: 0.7;
          border-radius: 50%;
          transform: skewY(-2deg);
          z-index: -1;
        }

        .tool-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          border-radius: 12px;
          background: transparent;
          transition: transform 0.2s, background-color 0.2s;
          text-decoration: none;
          cursor: pointer;
          position: relative;
          z-index: 10;
          pointer-events: auto;
        }

        .tool-card:hover {
          transform: translateY(-2px);
          background-color: rgba(255, 255, 255, 0.3);
        }

        .tool-name {
          color: #1d1d1f;
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .slideshow-background {
          position: absolute;
          top: 18vh;
          right: 2vw;
          width: min(44vw, 620px);
          max-width: 620px;
          aspect-ratio: 16 / 11;
          pointer-events: none;
          z-index: 1;
        }

        .slide {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          opacity: 0;
          transform: scale(1.02);
          transition: opacity 0.55s ease-in-out, transform 3.5s linear;
          user-select: none;
        }
        
        .slide.on {
          opacity: 1;
          transform: scale(1);
        }

        @media (max-width: 768px) {
          .slideshow-background {
            top: 50%;
            right: 50%;
            transform: translate(50%, -50%);
            width: 92%;
            max-width: 560px;
          }
        }
      `}</style>
    </section>
  );
}