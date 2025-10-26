// src/sections/landing/testimonial.tsx
"use client";

import { motion, Variants, useInView } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type Mode = "fan" | "grid";

// Framer Motion easing tuples
const EASE_SMOOTH: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_BACK: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

// Your testimonial card images
const RAW = [
  "card1 (1).webp",
  "card2 (1).webp",
  "card3 (1).webp",
  "card4 (1).webp",
  "card5 (1).webp",
  "card6 (1).webp",
  "card7 (1).webp",
];
const src = (name: string) => encodeURI(`/testimonial/${name}`);

// ---- small utility: observe element size ----
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect?.width ?? el.clientWidth;
        setWidth(Math.max(0, Math.round(w)));
      }
    });
    ro.observe(el);
    // initialize immediately
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

export default function Testimonial() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(scrollRef, { amount: 0.35, once: true });

  // Stage size (for responsive math)
  const { ref: stageRef, width: stageW } = useElementWidth<HTMLDivElement>();
  const isMobile = stageW > 0 && stageW < 480;

  // --- State machine: starts in "fan" mode ---
  const [mode, setMode] = useState<Mode>("fan");

  const ALL = useMemo(() => RAW, []);

  // Responsive sizes - all cards same size
  const baseSize = isMobile ? { w: 220, h: 146 } : { w: 260, h: 172 };

  // Circular fan positions for all cards - full circle arrangement
  const fanPositions = useMemo(() => {
    const total = ALL.length;
    // radius for circular arrangement
    const radius = isMobile ? 200 : 300;
    const angleStep = (2 * Math.PI) / total; // full 360 degrees

    return Array.from({ length: total }, (_, i) => {
      const angle = i * angleStep - Math.PI / 2; // start from top (-90 degrees)
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        rotate: (angle * 180 / Math.PI + 90) * 0.15, // subtle rotation based on position
      };
    });
  }, [ALL.length, isMobile]);

  // Grid targets: desktop 4/3; mobile 3/4 - responsive spacing
  const gridTargets = useMemo(() => {
    const row1 = isMobile ? 3 : 4;
    const row2Count = Math.max(ALL.length - row1, 0);

    // base horizontal spacing ~ card width + gap, but don't exceed stage width
    const idealSpacing = baseSize.w + (isMobile ? 24 : 40);
    const maxSpacing =
      row1 > 1 ? Math.max(120, Math.min(idealSpacing, (stageW - baseSize.w) / (row1 - 1) + baseSize.w * 0.1)) : 0;
    const spacingX = row1 > 1 ? Math.floor(maxSpacing) : 0;

    const topY = isMobile ? -90 : -120;
    const botY = isMobile ? 90 : 120;

    const distribute = (n: number) => {
      if (n <= 0) return [] as number[];
      if (n === 1) return [0];
      const totalWidth = spacingX * (n - 1);
      const start = -totalWidth / 2;
      return Array.from({ length: n }, (_, i) => start + i * spacingX);
    };

    const row1Xs = distribute(Math.min(row1, ALL.length));
    const row2Xs = distribute(row2Count);

    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < Math.min(row1, ALL.length); i++) out.push({ x: row1Xs[i], y: topY });
    for (let j = 0; j < row2Count; j++) out.push({ x: row2Xs[j], y: botY });
    return out;
  }, [ALL.length, baseSize.w, isMobile, stageW]);

  // Variants per mode
  const variants: Variants = {
    fan: (i: number) => ({
      ...(fanPositions[i] ?? { x: 0, y: 0, rotate: 0 }),
      scale: 1,
      opacity: 1,
      transition: { duration: 0.75, ease: EASE_SMOOTH, delay: inView ? i * 0.08 : 0 },
    }),

    grid: (i: number) => {
      const t = gridTargets[i] ?? { x: 0, y: 0 };
      return {
        x: t.x,
        y: t.y,
        scale: 1,
        opacity: 1,
        rotate: 0,
        transition: { duration: 0.55, ease: EASE_SMOOTH },
      };
    },
  };

  // Initial state (before animation)
  const initialFor = () => ({ x: 0, y: 0, scale: 0.9, opacity: 0 });

  // Click handlers
  const toGrid = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMode("grid");
  };
  const toFan = () => setMode("fan");

  return (
    <section id="testimonials" style={{ background: '#FFFFFF' }}>
      {/* ultra-tight vertical padding */}
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-6 md:py-8">
        {/* Heading (animated) */}
        <motion.div
          className="text-center mb-0"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          variants={{
            hidden: { opacity: 1 },
            show: { transition: { staggerChildren: 0.1 } },
          }}
        >
          <motion.h2
            className="mt-0 text-3xl sm:text-4xl md:text-[60px] font-extrabold tracking-tight leading-tight"
            style={{ color: '#1d1d1f' }}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_SMOOTH } },
            }}
          >
            We're transforming millions, and now it's your turn
          </motion.h2>
        </motion.div>

        {/* Stage */}
        <div
          ref={scrollRef}
          className="relative mx-auto max-w-[980px] mt-8"
          onClick={mode === "grid" ? toFan : undefined}
        >
          <div
            ref={stageRef}
            className="relative h-[500px] sm:h-[600px] md:h-[700px] overflow-visible flex items-center justify-center"
          >
            {/* World origin at center */}
            <div className="absolute left-1/2 top-1/2" style={{ transform: "translate(-50%, -50%)" }}>
              {ALL.map((file, i) => {
                const { w, h } = baseSize;
                return (
                  <motion.div
                    key={file}
                    className="absolute will-change-transform"
                    style={{
                      left: -w / 2,
                      top: -h / 2,
                      zIndex: mode === "grid" ? 1 : 0,
                      cursor: mode === "grid" ? "default" : "pointer",
                    }}
                    custom={i}
                    initial={initialFor()}
                    animate={mode}
                    variants={variants}
                    whileHover={
                      mode === "grid"
                        ? { scale: 1.03, transition: { duration: 0.2, ease: EASE_BACK } }
                        : { scale: 1.08, transition: { duration: 0.25, ease: EASE_BACK } }
                    }
                    onClick={mode === "grid" ? undefined : toGrid}
                  >
                    <Card src={src(file)} w={w} h={h} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Simple card shell
function Card({ src, w, h }: { src: string; w: number; h: number }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-white border border-[#E9E4E2] shadow-lg"
      style={{ width: w, height: h }}
    >
      <img src={src} alt="" className="w-full h-full object-cover" />
    </div>
  );
}