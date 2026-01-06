'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Linkedin, Instagram } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

type Coach = {
  name: string;
  title: string;
  institution: string;
  role: string;
  highlight: string;
  image: string;
};

const COACHES: Coach[] = [
  {
    name: 'Vaishali Gupta',
    title: 'Co-Founder, Admit55',
    institution: 'IIM Ahmedabad',
    role: 'Essay & Profile Strategy',
    highlight: 'Led 100+ successful admits',
    image: '/mentor/mentor2.webp',
  },
  {
    name: 'Akshay Goel',
    title: 'Founder',
    institution: "ISB ’21 | Ex-McKinsey",
    role: 'Admissions Strategy',
    highlight: '12+ mentees admitted',
    image: '/mentor/mentor1.webp',
  },
];

const WHATSAPP_PHONE = '919632301231';
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function MeetYourCoaches() {
  const reduceMotion = useReducedMotion();

  const fadeUp: Variants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
      };

  const stagger: Variants = reduceMotion
    ? { hidden: {}, show: {} }
    : {
        hidden: {},
        show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
      };

  const cardAnim: Variants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
      };

  const handleBookSession = () => {
    const msg = encodeURIComponent(
      "Hi Admit55, I'm interested in 1:1 Alum Coaching. Please share available slots and details."
    );
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${msg}`, '_blank');
  };

  return (
    <section className="relative w-full bg-transparent pt-28 pb-14 sm:pt-32 sm:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-4 py-2 shadow-sm backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              Meet Your Coaches
            </span>
          </div>

          <h2 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Learn from alumni who’ve done it — and helped others do it too.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600">
            High-touch guidance for profile, essays and interviews — with a structured strategy, not generic tips.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto"
        >
          {COACHES.map((c) => (
            <motion.div key={c.name} variants={cardAnim}>
              <CoachCard coach={c} />
            </motion.div>
          ))}
        </motion.div>

        {/* Footer strip */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="mt-10 flex flex-col items-center text-center gap-4"
        >
          <p className="text-sm sm:text-base text-slate-700">
            Other founding team includes alums from <strong>ISB</strong>, <strong>INSEAD</strong>
          </p>

          <div className="flex items-center gap-3">
            <Link
              href="https://www.linkedin.com/company/admit55/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/80 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-teal-200"
            >
              <Linkedin className="h-5 w-5 text-slate-700 group-hover:text-teal-700 transition" />
            </Link>

            <Link
              href="https://www.instagram.com/admit55_mba/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/80 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-teal-200"
            >
              <Instagram className="h-5 w-5 text-slate-700 group-hover:text-teal-700 transition" />
            </Link>
          </div>

          <button
            onClick={handleBookSession}
            className="mt-2 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Book a Session
          </button>
        </motion.div>
      </div>
    </section>
  );
}

function CoachCard({ coach }: { coach: Coach }) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white/80 p-7 shadow-[0_18px_50px_-35px_rgba(2,6,23,0.35)] backdrop-blur transition hover:-translate-y-1">
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_20%_0%,rgba(20,184,166,0.10),transparent_55%)]" />

      <div className="relative flex items-center gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-full ring-2 ring-teal-500/25">
          <Image
            src={coach.image}
            alt={coach.name}
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0">
          <div className="text-lg font-bold text-slate-900">{coach.name}</div>
          <div className="text-sm text-slate-600">{coach.title}</div>
          <div className="text-sm font-semibold text-teal-700">{coach.institution}</div>
        </div>
      </div>

      <div className="relative mt-6 h-px w-full bg-slate-200/80" />

      <div className="relative mt-5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">{coach.role}</span>
        <span className="text-xs font-semibold text-teal-700">{coach.highlight}</span>
      </div>
    </div>
  );
}
