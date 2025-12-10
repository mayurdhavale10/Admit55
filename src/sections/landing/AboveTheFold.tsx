'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

const PROFILE_ROUTE = '/mba/tools/profileresumetool';
const RESUMEWRITER_ROUTE = '/mba/tools/resumewriter';
const BSCHOOL_ROUTE = '/mba/tools/bschool-match';
const COMMUNITY_ROUTE = '/mba/tools/communitytool';

type Chip = {
  src: string;
  label: string;
  x: number;
  y: number;
  size?: number;
  href?: string;
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

function vw(p: number) {
  if (typeof window === 'undefined') return 0;
  return (window.innerWidth * p) / 100;
}

function vh(p: number) {
  if (typeof window === 'undefined') return 0;
  return (window.innerHeight * p) / 100;
}

/** Floating Icons (with hover scale + premium label) */
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

  const content = (
    <div className="relative flex items-center gap-3">
      {/* Icon */}
      <motion.img
        src={chip.src}
        alt={chip.label}
        width={s}
        height={s}
        whileHover={{ scale: 1.12 }}
        transition={{ duration: 0.25 }}
        className="
          object-contain rounded-xl
          drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]
        "
      />

      {/* PREMIUM LABEL - Now clickable */}
      {showTrail && (
        <motion.div
          whileHover={{ scale: 1.06, boxShadow: '0 8px 24px rgba(255,255,255,0.25)' }}
          transition={{ duration: 0.25 }}
          className="
            inline-flex items-center
            px-2 py-1
            sm:px-3 sm:py-1.5
            md:px-4 md:py-2
            lg:px-5 lg:py-2.5
            rounded-md sm:rounded-lg md:rounded-xl
            backdrop-blur-xl
            bg-white/15
            border border-white/25
            shadow-[0_4px_16px_rgba(0,0,0,0.35)]
            text-white/95
            select-none
          "
        >
          <span
            className="
              font-semibold tracking-wide
              text-[10px]
              sm:text-xs
              md:text-sm
              lg:text-base
              xl:text-lg
            "
          >
            {chip.label}
          </span>
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, x: chip.x, y: chip.y }}
        animate={
          start
            ? {
                opacity: 1,
                scale: 1,
                x: chip.x + drift,
                y: chip.y,
                transition: { duration: 0.55, ease: 'easeOut', delay },
              }
            : {}
        }
      >
        {chip.href ? (
          <Link href={chip.href} className="pointer-events-auto" prefetch={false}>
            {content}
          </Link>
        ) : (
          <div className="pointer-events-auto">{content}</div>
        )}
      </motion.div>
    </div>
  );
}

/** Desktop Thumbnail (Restored) */
function CyclingThumb({
  x,
  y,
  images,
  start,
  w = 300,
  h = 180,
  periodMs = 4000,
  delay = 1.2,
}: {
  x: number;
  y: number;
  images: string[];
  start: boolean;
  w?: number;
  h?: number;
  periodMs?: number;
  delay?: number;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!start) return;
    const interval = setInterval(
      () => setIdx((prev) => (prev === 0 ? 1 : 0)),
      periodMs
    );
    return () => clearInterval(interval);
  }, [start, periodMs]);

  return (
    <div
      className="absolute left-1/2 top-1/2 hidden lg:block pointer-events-none"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={
          start
            ? {
                opacity: 1,
                y: 0,
                transition: { delay, duration: 0.4 },
              }
            : {}
        }
        className="relative rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
        style={{ width: w, height: h }}
      >
        <motion.img
          src={images[0]}
          className="absolute inset-0 w-full h-full object-cover"
          animate={{ opacity: idx === 0 ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />

        <motion.img
          src={images[1]}
          className="absolute inset-0 w-full h-full object-cover"
          animate={{ opacity: idx === 1 ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
    </div>
  );
}

export default function AboveTheFold() {
  const [start, setStart] = useState(false);
  const bp = useBreakpoint();

  /** ICON CONFIG - Mobile fixed with better spacing */
  const CHIPS: Chip[] = useMemo(() => {
    if (bp === 'mobile') {
      return [
        {
          src: '/logo/profileicon.webp',
          label: 'Profile Snapshot',
          x: -vw(28),
          y: -vh(32),
          size: vw(22),
          href: PROFILE_ROUTE,
        },
        {
          src: '/logo/resumewriteicon.webp',
          label: 'Resumewriter',
          x: vw(28),
          y: -vh(32),
          size: vw(24),
          href: RESUMEWRITER_ROUTE,
        },
        {
          src: '/logo/communitytoolicon.webp',
          label: 'Community Tool',
          x: -vw(28),
          y: vh(34),
          size: vw(24),
          href: COMMUNITY_ROUTE,
        },
        {
          src: '/logo/Bschool.webp',
          label: 'B-School Match',
          x: vw(28),
          y: vh(36),
          size: vw(24),
          href: BSCHOOL_ROUTE,
        },
      ];
    }

    if (bp === 'tablet') {
      return [
        {
          src: '/logo/profileicon.webp',
          label: 'Profile Snapshot',
          x: -360,
          y: -170,
          href: PROFILE_ROUTE,
        },
        {
          src: '/logo/communitytoolicon.webp',
          label: 'Community Tool',
          x: -360,
          y: 210,
          href: COMMUNITY_ROUTE,
        },
        {
          src: '/logo/resumewriteicon.webp',
          label: 'Resumewriter',
          x: 300,
          y: -180,
          href: RESUMEWRITER_ROUTE,
        },
        {
          src: '/logo/Bschool.webp',
          label: 'B-School Match',
          x: 320,
          y: 210,
          href: BSCHOOL_ROUTE,
        },
      ];
    }

    // desktop layout
    return [
      {
        src: '/logo/profileicon.webp',
        label: 'Profile Snapshot',
        x: -560,
        y: -200,
        href: PROFILE_ROUTE,
      },
      {
        src: '/logo/communitytoolicon.webp',
        label: 'Community Tool',
        x: -560,
        y: 260,
        href: COMMUNITY_ROUTE,
      },
      {
        src: '/logo/resumewriteicon.webp',
        label: 'Resumewriter',
        x: 420,
        y: -220,
        href: RESUMEWRITER_ROUTE,
      },
      {
        src: '/logo/Bschool.webp',
        label: 'B-School Match',
        x: 440,
        y: 240,
        href: BSCHOOL_ROUTE,
      },
    ];
  }, [bp]);

  /** Dynamic Icon Sizing + Movement */
  const iconSize = bp === 'mobile' ? 88 : bp === 'tablet' ? 104 : 124;
  const drift = bp === 'mobile' ? 12 : 48;
  const showTrail = bp !== 'mobile';

  useEffect(() => {
    const t = setTimeout(() => setStart(true), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden">
      {/* BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/landing/mbaheroschool.webp')` }}
      />
      <div className="absolute inset-0 bg-black/45" />
      
      {/* CENTER TEXT */}
      <div className="relative z-20 max-w-2xl px-6">
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-white mb-4 drop-shadow-xl">
          Your{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(90deg, #3F37C9 0%, #12D8B5 100%)',
            }}
          >
            AI powered
          </span>{' '}
          MBA Admissions studio
        </h1>
        <p
          className="text-base md:text-xl font-medium mb-6 text-white/95"
          style={{ textShadow: '1px 1px 6px rgba(0,0,0,0.35)' }}
        >
          Get a clear, personalised evaluation of your MBA profile in minutes.
        </p>
        
        {/* BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={PROFILE_ROUTE}
            prefetch={false}
            className="inline-flex items-center justify-center px-5 md:px-6 py-2.5 rounded-md 
            text-base md:text-lg font-medium bg-[#0B5CAB] text-white 
            shadow-[0_5px_20px_rgba(10,60,120,0.28)] hover:-translate-y-0.5 
            transition-all duration-200"
          >
            Get My Profile Snapshot →
          </Link>
          <Link
            href={BSCHOOL_ROUTE}
            prefetch={false}
            className="inline-flex items-center justify-center px-5 md:px-6 py-2.5 rounded-md 
            text-base md:text-lg font-medium bg-white text-[#0B5CAB] border-2 border-[#0B5CAB]
            shadow-[0_3px_14px_rgba(0,0,0,0.15)] hover:bg-white/90 transition-all duration-200"
          >
            Explore Dream B-Schools
          </Link>
        </div>
      </div>
      
      {/* FLOATING ICONS + LABELS + THUMBNAILS */}
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
        
        {/* DESKTOP THUMBNAILS RESTORED */}
        {bp === 'desktop' && (
          <>
            {/* Under Profile Snapshot */}
            <CyclingThumb
              x={-620}
              y={-50}
              images={[
                '/landing/profiledemofinal.webp',
                '/landing/profileresumetooltestimonial (1).webp',
              ]}
              start={start}
              w={300}
              h={180}
              delay={1.1}
            />
            {/* Under Resumewriter */}
            <CyclingThumb
              x={480}
              y={-80}
              images={[
                '/landing/profiledemofinal.webp',
                '/landing/profileresumetooltestimonial (1).webp',
              ]}
              start={start}
              w={300}
              h={180}
              delay={1.25}
            />
          </>
        )}
      </div>
    </section>
  );
}