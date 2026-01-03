"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const PROFILE_ROUTE = "/mba/tools/profileresumetool";
const RESUMEWRITER_ROUTE = "/mba/tools/resumewriter";
const BSCHOOL_ROUTE = "/mba/tools/bschool-match";
const COMMUNITY_ROUTE = "/mba/tools/communitytool";

type Chip = {
  src: string;
  label: string;
  x: number;
  y: number;
  size?: number;
  href?: string;
};

type BP = "mobile" | "tablet" | "desktop";

function useBreakpoint(): BP {
  const [bp, setBp] = useState<BP>(() => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    if (w < 640) return "mobile";
    if (w < 1024) return "tablet";
    return "desktop";
  });

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 640) setBp("mobile");
      else if (w < 1024) setBp("tablet");
      else setBp("desktop");
    };
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return bp;
}

/** Floating Chip */
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
      <motion.img
        src={chip.src}
        alt={chip.label}
        width={s}
        height={s}
        whileHover={{ scale: 1.12 }}
        transition={{ duration: 0.25 }}
        className="object-contain rounded-xl drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
      />

      {showTrail && (
        <motion.div
          whileHover={{ scale: 1.06 }}
          className="inline-flex items-center px-3 py-1.5 rounded-xl backdrop-blur-xl
            bg-white/15 border border-white/25 shadow-[0_4px_16px_rgba(0,0,0,0.35)]
            text-white/95 select-none"
        >
          <span className="font-semibold text-xs sm:text-sm md:text-base">
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
                transition: { duration: 0.55, ease: "easeOut", delay },
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

/** Multi-Image Slideshow */
function CyclingThumb({
  x,
  y,
  images,
  start,
  w = 300,
  h = 180,
  periodMs = 3000,
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
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % images.length);
    }, periodMs);
    return () => clearInterval(interval);
  }, [start, images.length, periodMs]);

  return (
    <div
      className="absolute left-1/2 top-1/2 hidden lg:block pointer-events-none"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={
          start ? { opacity: 1, y: 0, transition: { delay, duration: 0.4 } } : {}
        }
        className="relative rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
        style={{ width: w, height: h }}
      >
        {images.map((img, i) => (
          <motion.img
            key={i}
            src={img}
            className="absolute inset-0 w-full h-full object-contain bg-black/30"
            animate={{ opacity: idx === i ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          />
        ))}
      </motion.div>
    </div>
  );
}

export default function AboveTheFold() {
  const [start, setStart] = useState(false);
  const bp = useBreakpoint();

  // ✅ MOBILE uses small fixed px offsets (no vw/vh) to avoid weird layout
  const CHIPS: Chip[] = useMemo(() => {
    if (bp === "mobile") {
      return [
        {
          src: "/logo/profileicon.webp",
          label: "Profile Snapshot",
          x: -120,
          y: -180,
          size: 72,
          href: PROFILE_ROUTE,
        },
        {
          src: "/logo/resumewriteicon.webp",
          label: "Resumewriter",
          x: 120,
          y: -180,
          size: 76,
          href: RESUMEWRITER_ROUTE,
        },
        {
          src: "/logo/communitytoolicon.webp",
          label: "Community Tool",
          x: -120,
          y: 190,
          size: 76,
          href: COMMUNITY_ROUTE,
        },
        {
          src: "/logo/Bschool.webp",
          label: "B-School Match",
          x: 120,
          y: 190,
          size: 76,
          href: BSCHOOL_ROUTE,
        },
      ];
    }

    if (bp === "tablet") {
      return [
        { src: "/logo/profileicon.webp", label: "Profile Snapshot", x: -340, y: -160, href: PROFILE_ROUTE },
        { src: "/logo/communitytoolicon.webp", label: "Community Tool", x: -340, y: 200, href: COMMUNITY_ROUTE },
        { src: "/logo/resumewriteicon.webp", label: "Resumewriter", x: 280, y: -170, href: RESUMEWRITER_ROUTE },
        { src: "/logo/Bschool.webp", label: "B-School Match", x: 300, y: 200, href: BSCHOOL_ROUTE },
      ];
    }

    return [
      { src: "/logo/profileicon.webp", label: "Profile Snapshot", x: -560, y: -200, href: PROFILE_ROUTE },
      { src: "/logo/communitytoolicon.webp", label: "Community Tool", x: -560, y: 260, href: COMMUNITY_ROUTE },
      { src: "/logo/resumewriteicon.webp", label: "Resumewriter", x: 420, y: -220, href: RESUMEWRITER_ROUTE },
      { src: "/logo/Bschool.webp", label: "B-School Match", x: 440, y: 240, href: BSCHOOL_ROUTE },
    ];
  }, [bp]);

  const iconSize = bp === "mobile" ? 76 : bp === "tablet" ? 104 : 124;
  const drift = bp === "mobile" ? 6 : bp === "tablet" ? 24 : 48;
  const showTrail = bp !== "mobile";

  useEffect(() => {
    const t = setTimeout(() => setStart(true), 600);
    return () => clearTimeout(t);
  }, []);

  const SLIDES = [
    "/landing/profiledemoslide1.webp",
    "/landing/profiledemoslide2.webp",
    "/landing/profiledemoslide3.webp",
    "/landing/profiledemoslide4.webp",
  ];

  const RIGHT_SLIDES = ["/landing/bschooldemo.webp", "/landing/yourtoolsdemo.webp"];

  return (
    // ✅ FULL-BLEED: works even if parent uses container/max-w
    <section
      className="
        relative min-h-screen overflow-hidden
        w-full
        flex items-center justify-center text-center
      "
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/landing/mbaheroschool.webp')` }}
      />
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-20 max-w-2xl px-6">
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
          Your{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #3F37C9 0%, #12D8B5 100%)",
            }}
          >
            AI powered
          </span>{" "}
          MBA Admissions studio
        </h1>

        <p className="text-base md:text-xl font-medium text-white/95 mb-6">
          Get a clear, personalised evaluation of your MBA profile in minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={PROFILE_ROUTE}
            className="px-6 py-2.5 rounded-md text-lg font-medium bg-[#0B5CAB] text-white shadow-lg"
          >
            Get My Profile Snapshot →
          </Link>

          <Link
            href={BSCHOOL_ROUTE}
            className="px-6 py-2.5 rounded-md text-lg font-medium bg-white text-[#0B5CAB] border-2 border-[#0B5CAB]"
          >
            Explore Dream B-Schools
          </Link>
        </div>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        {CHIPS.map((chip, i) => (
          <FloatingChip
            key={i}
            chip={chip}
            i={i}
            start={start}
            showTrail={showTrail}
            iconSize={iconSize}
            drift={drift}
          />
        ))}

        {bp === "desktop" && (
          <>
            <CyclingThumb x={-720} y={-50} images={SLIDES} start={start} w={300} h={180} delay={1.1} />
            <CyclingThumb x={420} y={-10} images={RIGHT_SLIDES} start={start} w={300} h={180} delay={1.3} />
          </>
        )}
      </div>
    </section>
  );
}
