'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Make sure these paths match your /public/animations files exactly.
 */
const FRAMES = [
  '/animations/man_scene_1.0.svg',
  '/animations/man_scene_stage1_1_embedded.svg',
  '/animations/man_scene_stage1_2_NO_LINES.svg',
  '/animations/man_scene_stage1_3_embedded.svg',
  '/animations/man_scene_stage1_4_embedded.svg',
  '/animations/man_scene_stage1_5_embedded.svg',
];

declare global {
  interface Window {
    gsap: any;
    ScrollTrigger: any;
  }
}

export default function HeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [gsapReady, setGsapReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const framesText = useRef<string[]>([]);

  // ---------------- 1) Load GSAP + ScrollTrigger once ----------------
  useEffect(() => {
    let cancelled = false;
    const inject = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
      });

    (async () => {
      try {
        if (!(window.gsap && window.ScrollTrigger)) {
          await inject('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js');
          await inject('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js');
          window.gsap?.registerPlugin?.(window.ScrollTrigger);
        }
        if (!cancelled) setGsapReady(true);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Failed to load GSAP/ScrollTrigger');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------- 2) Preload all SVGs ----------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const texts = await Promise.all(
          FRAMES.map(async (u) => {
            const r = await fetch(u, { cache: 'force-cache' });
            if (!r.ok) throw new Error(`Failed to load ${u}: ${r.status}`);
            return (await r.text()).replace(/<\?xml[^>]*\?>/i, '');
          })
        );
        if (!cancelled) {
          framesText.current = texts;
          setReady(true);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Failed to load frames');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------- 3) Build layers inside the STAGE ----------------
  useEffect(() => {
    if (!ready || !gsapReady) return;
    if (!stageRef.current) return;

    const stage = stageRef.current;
    stage.innerHTML = '';

    framesText.current.forEach((svg, i) => {
      const layer = document.createElement('div');
      layer.className = 'frame-layer';
      layer.dataset.index = String(i);
      Object.assign(layer.style, {
        position: 'absolute',
        inset: '0',
        opacity: i === 0 ? '1' : '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: String(200 + i), // Higher z-index to stay above slideshow
      });

      layer.innerHTML = svg;

      const el = layer.querySelector('svg') as SVGSVGElement | null;
      if (el) {
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.objectFit = 'contain';
        el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        el.style.shapeRendering = 'geometricPrecision';
      }

      stage.appendChild(layer);
    });

    setTimeout(() => window.ScrollTrigger?.refresh(), 0);
  }, [ready, gsapReady]);

  // ---------------- 4) Single ScrollTrigger: progress → frame index + parallax ----------------
  useEffect(() => {
    if (!ready || !gsapReady) return;
    if (!containerRef.current || !animContainerRef.current || !stageRef.current) return;

    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (!gsap || !ST) return;

    ST.getAll().forEach((t: any) => t.kill());
    gsap.killTweensOf('*');

    const container = containerRef.current;
    const stage = stageRef.current;
    const layers = Array.from(stage.querySelectorAll<HTMLElement>('.frame-layer'));
    const N = layers.length;
    if (!N) return;

    const START_X = '-40vw';
    const END_X = '25vw';
    const PX_PER_FRAME = 50;
    const END_DISTANCE = () => `+=${Math.max(N * PX_PER_FRAME, 1)}`;

    gsap.set(stage, { x: START_X });
    layers.forEach((l, i) => (l.style.opacity = i === 0 ? '1' : '0'));

    let current = 0;
    const show = (i: number) => {
      if (i === current) return;
      layers[current].style.opacity = '0';
      layers[i].style.opacity = '1';
      current = i;
    };

    const trig = ST.create({
      trigger: container,
      start: 'top top',
      end: END_DISTANCE,
      scrub: true,
      pin: true,
      anticipatePin: 1,
      markers: false,
      invalidateOnRefresh: true,
      onUpdate: (self: any) => {
        const p = self.progress;

        let idx;
        if (p >= 0.99) {
          idx = N - 1;
        } else {
          idx = Math.min(N - 1, Math.floor(p * N));
        }

        show(idx);

        gsap.set(stage, {
          x: gsap.utils.interpolate(START_X, END_X, p),
          force3D: false,
          transformPerspective: 0,
        });
      },
      onRefresh: () => {
        show(0);
        gsap.set(stage, {
          x: START_X,
          force3D: false,
          transformPerspective: 0,
        });
      },
    });

    return () => trig.kill();
  }, [ready, gsapReady]);

  // ---------------- RENDER ----------------
  if (err) {
    return (
      <div className="min-h-[100vh] grid place-items-center">
        <div style={{ color: '#8E8E93' }}>Animation error: {err}</div>
      </div>
    );
  }

  if (!ready || !gsapReady) {
    return (
      <div className="min-h-[100vh] grid place-items-center" style={{ color: '#8E8E93' }}>
        Loading animation…
      </div>
    );
  }

  return (
    <>
      <div className="hero-section" ref={containerRef}>
        <div className="animation-container" ref={animContainerRef}>
          <div className="animation-stage" ref={stageRef} />
        </div>
      </div>

      <style jsx>{`
        .hero-section {
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .animation-container {
          position: relative;
          width: 85vw;
          max-width: 1400px;
          min-width: 600px;
          aspect-ratio: 1 / 1.05;
          overflow: visible;
          z-index: 100;
          isolation: isolate;
        }

        .animation-stage {
          position: relative;
          inset: 0;
          width: 100%;
          height: 100%;
          will-change: transform;
          backface-visibility: hidden;
          transform: translateZ(0);
        }

        @media (max-width: 768px) {
          .animation-container {
            width: 90vw;
            min-width: 320px;
          }
        }
      `}</style>
    </>
  );
}