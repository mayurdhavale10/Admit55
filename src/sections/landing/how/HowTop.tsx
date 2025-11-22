'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, {
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
} from 'react';

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

/* ===========================================================
 * Catmull-Rom to Bezier
 * =========================================================== */
function catmullRom2bezier(points: { x: number; y: number }[]) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[0] : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 < points.length ? points[i + 2] : p2;

    const cp1x = (p1.x + (p2.x - p0.x) / 6).toFixed(2);
    const cp1y = (p1.y + (p2.y - p0.y) / 6).toFixed(2);
    const cp2x = (p2.x - (p3.x - p1.x) / 6).toFixed(2);
    const cp2y = (p2.y - (p3.y - p1.y) / 6).toFixed(2);

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x.toFixed(2)} ${p2.y.toFixed(
      2,
    )}`;
  }
  return d;
}

/* ===========================================================
 * Find nearest length along path to a point (with sampling)
 * =========================================================== */
function findNearestLength(
  pathEl: SVGPathElement,
  px: number,
  py: number,
  steps = 400,
) {
  const total = pathEl.getTotalLength();
  let best = 0;
  let bestDist = Infinity;

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * total;
    const p = pathEl.getPointAtLength(t);
    const dx = p.x - px;
    const dy = p.y - py;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = t;
    }
  }
  return best;
}

/* ===========================================================
 * HowTop component
 * =========================================================== */
export default function HowTop() {
  const containerRef = useRef<HTMLDivElement | null>(null); // icons + path container
  const iconRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pathRef = useRef<SVGPathElement | null>(null);

  const [pathD, setPathD] = useState<string>('');
  const [pathLength, setPathLength] = useState<number | null>(null);
  const [keyPointsAttr, setKeyPointsAttr] = useState<string>('');
  const [keyTimesAttr, setKeyTimesAttr] = useState<string>('');
  const [dashOffsetValuesAttr, setDashOffsetValuesAttr] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tools' | 'experts'>('tools');
  const [isMobile, setIsMobile] = useState(false);
  const [hasAnimationStarted, setHasAnimationStarted] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  /* ---------- speed control ---------- */
  const totalDuration = 7.0; // seconds per run
  const pausePerIcon = 0.12;

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

  /* ---------- detect if user has scrolled ---------- */
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setHasScrolled(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ---------- trigger animation only when icons container is in view (desktop tools) ---------- */
  useEffect(() => {
    if (isMobile || activeTab !== 'tools' || !hasScrolled) {
      return;
    }

    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only trigger when at least 50% of the section is visible
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setHasAnimationStarted(true);
            observer.disconnect(); // run once
          }
        });
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: '-50px 0px -50px 0px', // Add some margin to ensure it's really in view
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isMobile, activeTab, hasScrolled]);

  /* ---------- 1. build curve (desktop / tablet only, tools tab only) ---------- */
  useLayoutEffect(() => {
    if (isMobile || activeTab !== 'tools') {
      setPathD('');
      setPathLength(null);
      return;
    }

    function compute() {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      type IconInfo = { x: number; y: number; radius: number };
      const icons: IconInfo[] = [];

      iconRefs.current.forEach((el) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        icons.push({
          x: r.left + r.width / 2 - containerRect.left,
          y: r.top + r.height / 2 - containerRect.top,
          radius: r.width / 2,
        });
      });

      if (!icons.length) return;

      const basePts = icons.map(({ x, y }) => ({ x, y }));

      const offset = 8;
      basePts[0].x = icons[0].x + icons[0].radius + offset;
      const lastIdx = basePts.length - 1;
      basePts[lastIdx].x =
        icons[lastIdx].x - icons[lastIdx].radius - offset;

      const width = containerRect.width;
      const amplitude = Math.min(28, Math.max(14, width / 20));

      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < basePts.length; i++) {
        const current = basePts[i];
        pts.push(current);

        if (i < basePts.length - 1) {
          const next = basePts[i + 1];
          const midX = (current.x + next.x) / 2;
          const midY =
            (current.y + next.y) / 2 +
            (i % 2 === 0 ? -amplitude : amplitude);
          pts.push({ x: midX, y: midY });
        }
      }

      const d = catmullRom2bezier(pts);
      setPathD(d);
    }

    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', compute);
    const t = window.setTimeout(compute, 200);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
      clearTimeout(t);
    };
  }, [isMobile, activeTab]);

  /* ---------- 2. compute keyPoints / keyTimes / dashOffsets (desktop tools only) ---------- */
  useLayoutEffect(() => {
    if (isMobile || activeTab !== 'tools') {
      setKeyPointsAttr('');
      setKeyTimesAttr('');
      setDashOffsetValuesAttr('');
      return;
    }

    if (!pathD) return;
    if (!containerRef.current) return;

    const id = window.setTimeout(() => {
      const svgPath = pathRef.current;
      if (!svgPath) return;

      const totalLen = svgPath.getTotalLength();
      setPathLength(totalLen);

      const containerRect = containerRef.current!.getBoundingClientRect();
      const centers: { x: number; y: number }[] = [];

      iconRefs.current.forEach((el) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        centers.push({
          x: r.left + r.width / 2 - containerRect.left,
          y: r.top + r.height / 2 - containerRect.top,
        });
      });

      if (!centers.length) return;

      const rawLengths: number[] = centers.map((c) =>
        findNearestLength(svgPath, c.x, c.y, 1000),
      );
      const lengths: number[] = [];
      let last = 0;
      const eps = totalLen * 0.0005;

      rawLengths.forEach((L, idx) => {
        let adjusted = L;
        if (idx === 0) {
          adjusted = Math.max(0, L);
        } else {
          adjusted = Math.max(L, last + eps);
        }
        if (adjusted > totalLen) adjusted = totalLen;
        lengths.push(adjusted);
        last = adjusted;
      });

      const fractions  = lengths.map((l) =>
        Math.max(0, Math.min(1, l / totalLen)),
      );

      const n = fractions.length;
      if (!n) return;

      // ensure last icon reaches end of path
      fractions[n - 1] = 1;

      const deltas: number[] = [];
      for (let i = 0; i < n - 1; i++) deltas.push(fractions[i + 1] - fractions[i]);
      const totalTravel = deltas.reduce((a, b) => a + b, 0) || 1;

      const pauseTotal = n * pausePerIcon;
      const pauseFraction = pauseTotal / totalDuration;
      const travelFractionTotal = Math.max(0.0001, 1 - pauseFraction);
      const travelFractions = deltas.map(
        (d) => (d / totalTravel) * travelFractionTotal,
      );

      const keyPoints: number[] = [];
      const keyTimes: number[] = [];
      let tCursor = 0;

      for (let i = 0; i < n; i++) {
        keyPoints.push(fractions[i]);
        keyTimes.push(tCursor);

        tCursor += pausePerIcon / totalDuration;
        keyPoints.push(fractions[i]);
        keyTimes.push(Math.min(1, tCursor));

        if (i < n - 1) {
          tCursor += travelFractions[i];
        }
      }

      keyTimes[keyTimes.length - 1] = 1;

      setKeyPointsAttr(keyPoints.map((v) => v.toFixed(4)).join(';'));
      setKeyTimesAttr(keyTimes.map((v) => v.toFixed(4)).join(';'));

      const offsets = keyPoints.map((f) => {
        const clamped = Math.max(0, Math.min(1, f));
        return totalLen * (1 - clamped);
      });
      setDashOffsetValuesAttr(offsets.map((v) => v.toFixed(2)).join(';'));
    }, 60);

    return () => clearTimeout(id);
  }, [pathD, isMobile, activeTab]);

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
            onClick={() => {
              setActiveTab('tools');
              setHasAnimationStarted(false); // reset when coming back
            }}
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
          {/* MOBILE: only icons, no animation, no knowmore image */}
          {isMobile ? (
            <div className="mt-10 max-w-md mx-auto grid grid-cols-2 gap-x-6 gap-y-10">
              {toolCards.map((t, i) => {
                const isProfile = t.title === 'Profile Snapshot';
                const size = isProfile ? 72 : 80;

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
            /* DESKTOP / TABLET: animated path + arrow + icons */
            <div
              className="mt-12 relative mx-auto max-w-4xl pb-16 sm:pb-20"
              ref={containerRef}
            >
              {/* SVG behind icons */}
              <div className="absolute inset-0 pointer-events-none">
                <svg
                  width="100%"
                  height="260"
                  viewBox={`0 0 ${
                    containerRef.current?.clientWidth ?? 1200
                  } 260`}
                  preserveAspectRatio="xMinYMid meet"
                  aria-hidden="true"
                  style={{ overflow: 'visible' }}
                >
                  {pathD && (
                    <path
                      ref={pathRef}
                      id="journeyPath"
                      d={pathD}
                      fill="none"
                      stroke="none"
                    />
                  )}

                  {hasAnimationStarted &&
                    pathD &&
                    pathLength &&
                    keyTimesAttr &&
                    dashOffsetValuesAttr && (
                      <>
                        <defs>
                          <mask id="trail-mask">
                            <rect
                              x="0"
                              y="0"
                              width="100%"
                              height="100%"
                              fill="black"
                            />
                            <path
                              d={pathD}
                              stroke="white"
                              strokeWidth={9}
                              strokeDasharray={pathLength}
                              strokeDashoffset={pathLength}
                            >
                              <animate
                                attributeName="stroke-dashoffset"
                                dur={`${totalDuration}s`}
                                repeatCount="1"
                                fill="freeze"
                                keyTimes={keyTimesAttr}
                                values={dashOffsetValuesAttr}
                              />
                            </path>
                          </mask>
                        </defs>

                        <path
                          d={pathD}
                          fill="none"
                          stroke="#000000"
                          strokeWidth={3}
                          strokeDasharray="4 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          mask="url(#trail-mask)"
                        />

                        {keyPointsAttr && keyTimesAttr && (
                          <path d="M0 -7 L14 0 L0 7 Z" fill="#000000">
                            <animateMotion
                              dur={`${totalDuration}s`}
                              repeatCount="1"
                              fill="freeze"
                              rotate="auto"
                              keyPoints={keyPointsAttr}
                              keyTimes={keyTimesAttr}
                            >
                              <mpath xlinkHref="#journeyPath" />
                            </animateMotion>
                          </path>
                        )}
                      </>
                    )}
                </svg>
              </div>

              {/* icons row */}
              <div className="relative z-10">
                <div className="flex items-end justify-between gap-4 sm:gap-8 px-2 sm:px-6">
                  {toolCards.map((t, i) => {
                    const isProfile = t.title === 'Profile Snapshot';
                    const baseSize = isProfile ? 96 : 128;

                    const setIconRef = (el: HTMLDivElement | null) => {
                      iconRefs.current[i] = el;
                    };

                    const Inner = (
                      <div className="flex flex-col items-center gap-3 sm:gap-4 flex-1">
                        <div
                          ref={setIconRef}
                          style={{
                            width: baseSize,
                            height: baseSize,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <Image
                            src={t.src}
                            alt={t.title}
                            width={baseSize}
                            height={baseSize}
                            className="object-contain"
                          />
                        </div>

                        <div className="text-sm sm:text-lg text-slate-700 font-semibold mt-1 text-center">
                          {t.title}
                        </div>
                        <div className="text-xs sm:text-base text-slate-500 text-center">
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

      {/* KNOW MORE character (desktop / large screens only) */}
      {activeTab === 'tools' && !isMobile && (
        <div className="hidden lg:block pointer-events-none">
          <div
            className={`absolute top-72 xl:top-64 ${
              hasAnimationStarted ? 'knowmore-slide' : 'knowmore-hidden'
            }`}
            style={{ right: '-40px' }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white/90 rounded-full px-4 py-1 shadow-md text-xs sm:text-sm font-semibold text-slate-700">
                Hey, I am 55. Click on &quot;Our Experts&quot; to know more
              </div>
              <Image
                src="/how/knowmore.webp"
                alt="Know more about our experts"
                width={220}
                height={220}
              />
            </div>
          </div>
        </div>
      )}

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

      <style jsx>{`
        @media (max-width: 640px) {
          svg {
            height: 280px !important;
          }
        }

        .knowmore-hidden {
          transform: translateX(120%);
          opacity: 0;
        }

        @keyframes slideInRightKnowMore {
          0% {
            transform: translateX(120%);
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .knowmore-slide {
          animation: slideInRightKnowMore 0.9s ease-out 0.4s forwards;
        }
      `}</style>
    </div>
  );
}