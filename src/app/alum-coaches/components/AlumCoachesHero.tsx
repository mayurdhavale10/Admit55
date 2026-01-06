'use client';

import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function AlumCoachesHero() {
  const reduceMotion = useReducedMotion();

  const fadeUp: Variants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
      };

  return (
    <section className="relative w-full bg-transparent pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="mx-auto max-w-4xl"
        >
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/75 p-8 sm:p-10 shadow-[0_20px_60px_-35px_rgba(2,6,23,0.30)] backdrop-blur">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(20,184,166,0.12),transparent_55%)]" />

            <div className="relative flex flex-col sm:flex-row items-center gap-5">
              <div className="h-16 w-16 overflow-hidden rounded-3xl border border-slate-200 bg-white/85 p-3 shadow-sm sm:h-20 sm:w-20">
                <Image
                  src="/logo/admit55_final_logo.webp"
                  alt="Admit55"
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>

              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  100% Guarantee • Admission or Money Back
                </div>

                <p className="mt-3 text-slate-600">
                  Limited slots • High-touch mentorship • Global applicants welcome
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
