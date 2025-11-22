'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

const PROFILE_ROUTE = '/mba/tools/profileresumetool';
const ESSAY_ROUTE   = '/mba/tools/essaytool';

type Chip = {
  src: string;
  label: string;
  x: number;     // offset from hero center (px)
  y: number;     // offset from hero center (px)
  size?: number; // optional per-chip icon size
  href?: string; // optional link
};

type BP = 'mobile' | 'tablet' | 'desktop';
function useBreakpoint(): BP {
  const [bp, setBp] = useState<BP>('desktop');
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 640) setBp('mobile');
      else if (w < 1024) setBp('tablet');
      else setBp('desktop');
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);
  return bp;
}

/** Single floating icon + optional trail label */
function FloatingChip({
  chip,
  i,
  start,
  showTrail,
  iconSize,
  drift,
}: {
  chip: Chip;
  i: number;
  start: boolean;
  showTrail: boolean;
  iconSize: number;
  drift: number;
}) {
  const delay = 1 + i * 0.14;
  const s = chip.size ?? iconSize;

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, x: chip.x, y: chip.y }}
        animate={
          start
            ? {
                opacity: 1,
                scale: 1,
                x: chip.x + drift, // subtle slide on load
                y: chip.y,
                transition: { duration: 0.55, ease: 'easeOut', delay },
              }
            : {}
        }
      >
        <div className="relative flex items-center">
          {chip.href ? (
            <Link
              href={chip.href}
              className="block pointer-events-auto"
              aria-label={chip.label}
              prefetch={false}
            >
              <Image
                src={chip.src}
                alt={chip.label}
                width={s}
                height={s}
                className="object-contain rounded-lg drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
                priority={false}
              />
            </Link>
          ) : (
            <Image
              src={chip.src}
              alt={chip.label}
              width={s}
              height={s}
              className="object-contain rounded-lg drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] pointer-events-auto"
              priority={false}
            />
          )}

          {showTrail && (
            <motion.div
              className="ml-3 pointer-events-none"
              initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
              animate={{
                opacity: 1,
                clipPath: 'inset(0 0% 0 0)',
                transition: { delay: delay + 0.25, duration: 0.55, ease: 'easeOut' },
              }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-md bg-white/12 backdrop-blur-md border border-white/20 text-white/95">
                <span className="text-sm font-medium">{chip.label}</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/** Desktop-only tiny thumbnail that sits under an icon and crossfades every 4s (no glass effect) */
function CyclingThumb({
  x,
  y,
  images,
  start,
  w = 300,   // bigger size
  h = 180,
  periodMs = 4000,
  delay = 1.2,
}: {
  x: number;
  y: number;
  images: string[]; // [img1, img2]
  start: boolean;
  w?: number;
  h?: number;
  periodMs?: number;
  delay?: number;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!start) return;
    const id = setInterval(() => setIdx((p) => (p === 0 ? 1 : 0)), periodMs);
    return () => clearInterval(id);
  }, [start, periodMs]);

  return (
    <div
      className="absolute left-1/2 top-1/2 hidden lg:block pointer-events-none"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={start ? { opacity: 1, y: 0, transition: { delay, duration: 0.4 } } : {}}
        className="relative rounded-lg overflow-hidden" // no border, no glassy shadow
        style={{ width: w, height: h }}
      >
        {/* frame 1 */}
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: idx === 0 ? 1 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <Image
            src={images[0]}
            alt="demo 1"
            fill
            sizes={`${w}px`}
            className="object-cover"
            priority={false}
          />
        </motion.div>

        {/* frame 2 */}
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: idx === 1 ? 1 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <Image
            src={images[1]}
            alt="demo 2"
            fill
            sizes={`${w}px`}
            className="object-cover"
            priority={false}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function AboveTheFold() {
  const [start, setStart] = useState(false);
  const bp = useBreakpoint();

  const CHIPS: Chip[] = useMemo(() => {
    if (bp === 'mobile') {
      return [
        { src: '/logo/profileicon.webp',   label: 'Profile Snapshot', x: -120, y: -190, size: 60, href: PROFILE_ROUTE },
        { src: '/logo/essayicon.webp',     label: 'Essay Lab',        x:  120, y: -190, size: 78, href: ESSAY_ROUTE   },
        { src: '/logo/interviewicon.webp', label: 'Interview Ready',  x: -120, y:  210, size: 76 },
        { src: '/logo/Bschool.webp',       label: 'B-School Match',   x:  120, y:  240, size: 80 },
      ];
    }
    if (bp === 'tablet') {
      return [
        { src: '/logo/profileicon.webp',   label: 'Profile Snapshot', x: -360, y: -170, href: PROFILE_ROUTE },
        { src: '/logo/interviewicon.webp', label: 'Interview Ready',  x: -360, y:  210 },
        { src: '/logo/essayicon.webp',     label: 'Essay Lab',        x:  300, y: -200, href: ESSAY_ROUTE   },
        { src: '/logo/Bschool.webp',       label: 'B-School Match',   x:  320, y:  210 },
      ];
    }
    // desktop
    return [
      { src: '/logo/profileicon.webp',   label: 'Profile Snapshot', x: -560, y: -200, href: PROFILE_ROUTE },
      { src: '/logo/interviewicon.webp', label: 'Interview Ready',  x: -560, y:  260 },
      { src: '/logo/essayicon.webp',     label: 'Essay Lab',        x:  420, y: -240, href: ESSAY_ROUTE   },
      { src: '/logo/Bschool.webp',       label: 'B-School Match',   x:  440, y:  240 },
    ];
  }, [bp]);

  const iconSize = bp === 'mobile' ? 60 : bp === 'tablet' ? 76 : 88;
  const drift = bp === 'mobile' ? 12 : 48;
  const showTrail = bp !== 'mobile';

  useEffect(() => {
    const t = setTimeout(() => setStart(true), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center text-center" style={{ overflow: 'hidden' }}>
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/landing/mbaheroschool.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45))', zIndex: 1 }} />

      {/* Center content (above everything) */}
      <div className="relative z-20 max-w-2xl px-6">
        <h1
          className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight"
          style={{
            color: '#FFFFFF',
            fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
            textShadow: '2px 2px 8px rgba(0,0,0,0.35)',
          }}
        >
          Your{' '}
          <span
            style={{
              backgroundImage: 'linear-gradient(90deg, #3F37C9 0%, #12D8B5 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}
          >
            AI powered
          </span>{' '}
          MBA Admissions studio
        </h1>

        <p
          className="text-base md:text-xl font-medium mb-6"
          style={{
            color: 'rgba(255,255,255,0.92)',
            fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
            textShadow: '1px 1px 6px rgba(0,0,0,0.35)',
          }}
        >
          Get a clear, personalised evaluation of your MBA profile in minutes. From ISB to IIMs—clarity
          starts here.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={PROFILE_ROUTE}
            prefetch={false}
            className="inline-flex items-center justify-center px-5 md:px-6 py-2.5 rounded-md text-base md:text-lg font-medium transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/60 shadow-[0_5px_20px_rgba(10,60,120,0.28)]"
            style={{ backgroundColor: '#0B5CAB', color: '#FFFFFF' }}
            aria-label="Get My Profile Snapshot"
          >
            Get My Profile Snapshot <span aria-hidden="true" className="ml-2">→</span>
          </Link>

          <Link
            href="/dream-b-schools"
            prefetch={false}
            className="inline-flex items-center justify-center px-5 md:px-6 py-2.5 rounded-md text-base md:text-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/60 shadow-[0_3px_14px_rgba(0,0,0,0.15)] hover:bg-white/95"
            style={{ backgroundColor: '#FFFFFF', border: '2px solid #0B5CAB', color: '#0B5CAB' }}
          >
            Explore Dream B-Schools
          </Link>
        </div>
      </div>

      {/* Floating icons + desktop thumbnails */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {CHIPS.map((chip, i) => (
          <FloatingChip
            key={`${chip.label}-${i}`}
            chip={chip}
            i={i}
            start={start}
            showTrail={showTrail}
            iconSize={iconSize}
            drift={drift}
          />
        ))}

        {/* DESKTOP-ONLY tiny cycling thumbnails (bigger & nudged further from center, no glass look) */}
        {bp === 'desktop' && (
          <>
            {/* Profile icon is at (-560, -200). Thumb: slightly further left & down from icon */}
            <CyclingThumb
              x={-620}                 // moved farther from center
              y={-200 + 150}          // just below icon
              images={[
                '/landing/profiledemofinal.webp',
                '/landing/profileresumetooltestimonial%20(1).webp',
              ]}
              start={start}
              w={300}                 // bigger
              h={180}
              periodMs={4000}
              delay={1.1}
            />

            {/* Essay icon is at (420, -240). Thumb: slightly further right & down from icon */}
            <CyclingThumb
              x={480}                 // moved farther from center
              y={-240 + 160}          // just below icon
              images={[
                '/landing/profiledemofinal.webp',
                '/landing/profileresumetooltestimonial%20(1).webp',
              ]}
              start={start}
              w={300}                 // bigger
              h={180}
              periodMs={4000}
              delay={1.25}
            />
          </>
        )}
      </div>
    </section>
  );
}
