'use client';

import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';

/* ---------- testimonials content ---------- */
const testimonials = [
  {
    text: 'The profile insights were eerily accurate — felt like talking to a real admissions consultant.',
    author: 'Priya S.',
    meta: 'ISB ’24',
  },
  {
    text: 'Clear, concise, and actually helpful. The Snapshot told me exactly what to fix.',
    author: 'Arjun M.',
    meta: 'IIM A ’25',
  },
  {
    text: 'Way better than random forum advice. Data-backed and super practical next steps.',
    author: 'Shreya K.',
    meta: 'XLRI ’24',
  },
];

/* ===========================================================
 * HowTestimonials Component (PART 3)
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
    <div className="bg-slate-50/70 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-12">
          Backed by Results. Proven by Data.
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Stats */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <Stat number="1,000+" label="Students Guided" />
            <Stat number="100+" label="Admits to ISB, IIM A/B/C/L, XLRI" />
            <Stat number="4,000+" label="Books Sold | 4.8★ on Amazon" />
          </div>

          {/* Testimonial Carousel */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-8 relative">
              <Quote className="absolute -top-4 -left-4 h-10 w-10 text-teal-400/60" />

              <blockquote className="text-slate-800 text-base sm:text-lg leading-relaxed">
                “{testimonials[active].text}”
              </blockquote>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {testimonials[active].author}
                  </span>{' '}
                  • {testimonials[active].meta}
                </div>

                <div className="flex items-center gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className={`h-2.5 w-2.5 rounded-full transition ${
                        i === active ? 'bg-teal-500' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

/* ===========================================================
 * Stat Component
 * =========================================================== */
function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <div className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
        {number}
      </div>
      <div className="text-slate-600">{label}</div>
    </div>
  );
}
