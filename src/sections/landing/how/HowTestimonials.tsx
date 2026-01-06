"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Quote } from "lucide-react";

/* ---------- testimonials content ---------- */
const testimonials = [
  {
    text: "The profile insights were eerily accurate — felt like talking to a real admissions consultant.",
    author: "Priya S.",
    meta: "ISB ’24",
  },
  {
    text: "Clear, concise, and actually helpful. The Snapshot told me exactly what to fix.",
    author: "Arjun M.",
    meta: "IIM A ’25",
  },
  {
    text: "Way better than random forum advice. Data-backed and super practical next steps.",
    author: "Shreya K.",
    meta: "XLRI ’24",
  },
];

/* ===========================================================
 * HowTestimonials Component
 * =========================================================== */
export default function HowTestimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % testimonials.length);
    }, 5200);
    return () => clearInterval(id);
  }, []);

  return (
    // ✅ full width section wrapper
    <section className="w-full bg-slate-50/70 py-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ✅ FIX: removed whitespace-nowrap, allow wrapping on small screens */}
        <h3
          className="
            text-3xl sm:text-4xl lg:text-5xl
            font-extrabold text-slate-900
            text-center mb-12
            flex items-center justify-center gap-3
            flex-wrap
          "
        >
          <Image
            src="/logo/admit55_final_logo.webp"
            alt="Admit55 Logo"
            width={60}
            height={60}
            className="object-contain w-12 h-12 sm:w-16 sm:h-16"
          />
          <span className="leading-tight">
            Admit55. Backed by Results. Proven by Data.
          </span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Stats */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <Stat target={1000} suffix="+" label="Students Guided" />
            <Stat target={100} suffix="+" label="Admits to ISB, IIM A/B/C/L, XLRI" />
            <Stat
              target={10000}
              suffix="+"
              label="Books Sold | 4.8★ on Amazon"
              href="https://www.amazon.in/Successful-ISB-Essays-Their-Analysis/dp/1647606160/ref=sr_1_1?crid=3POHFB7T9U2CI&dib=eyJ2IjoiMSJ9.uN1JYchBfdxHWiFoARzgzw.GcoUXmDVlBq5PHECeX_0kDF2t27WeLauHMWek2s1Wr0&dib_tag=se&keywords=55+successful+isb+essays&qid=1765373501&sprefix=55+essay%2Caps%2C171&sr=8-1"
            />
          </div>

          {/* Testimonial Carousel */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-8 relative">
              <Quote className="absolute -top-4 -left-4 h-10 w-10 text-teal-400/60" />

              <blockquote className="text-slate-800 text-base sm:text-lg leading-relaxed">
                “{testimonials[active].text}”
              </blockquote>

              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {testimonials[active].author}
                  </span>{" "}
                  • {testimonials[active].meta}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className={`h-2.5 w-2.5 rounded-full transition ${
                        i === active ? "bg-teal-500" : "bg-slate-300"
                      }`}
                      aria-label={`Show testimonial ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===========================================================
 * Stat Component – scroll-triggered animated counter + glass card
 * =========================================================== */
function Stat({
  target,
  label,
  suffix = "",
  href,
}: {
  target: number;
  label: string;
  suffix?: string;
  href?: string;
}) {
  const [value, setValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) setHasAnimated(true);
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) {
      setValue(0);
      return;
    }

    let frameId: number;
    let startTime: number | null = null;
    const duration = 1400;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [hasAnimated, target]);

  const formatted = value.toLocaleString("en-IN");

  const inner = (
    <div
      className="
        flex items-baseline gap-4
        px-5 py-4 rounded-2xl
        bg-white/20 backdrop-blur-xl
        border border-white/40
        shadow-lg shadow-slate-300/40
        transition-transform transition-shadow duration-300
        hover:-translate-y-1 hover:shadow-2xl
        overflow-hidden
      "
    >
      <div className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
        {formatted}
        {suffix}
      </div>
      <div className="text-slate-700 text-sm sm:text-base">{label}</div>
    </div>
  );

  return (
    <div ref={ref}>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="block cursor-pointer">
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}
