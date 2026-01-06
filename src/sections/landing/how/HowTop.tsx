'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

/* ---------- routes ---------- */
const PROFILE_ROUTE = '/mba/tools/profileresumetool';
const RESUME_ROUTE = '/mba/tools/resumewriter';
const BSCHOOL_ROUTE = '/mba/tools/bschool-match';

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
    title: 'Resume Writer',
    subtitle: 'Create a professional, ATS-friendly resume tailored for MBA recruiting.',
    src: '/logo/resumewriteicon.webp',
    href: RESUME_ROUTE,
    tone: 'green',
  },
  {
    title: 'B-School Match',
    subtitle: 'Discover schools that fit your goals.',
    src: '/logo/Bschool.webp',
    href: BSCHOOL_ROUTE,
    tone: 'purple',
  },
  {
    title: 'Essay Lab',
    subtitle: 'Coming Soon',
    src: '/logo/essayicon.webp',
    comingSoon: true,
    tone: 'orange',
  },
  {
    title: 'Interview Ready',
    subtitle: 'Coming Soon',
    src: '/logo/interviewicon.webp',
    comingSoon: true,
    tone: 'orange',
  },
];

/* ---------- animation presets ---------- */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

export default function HowTop() {
  const [activeTab, setActiveTab] = useState<'tools' | 'experts'>('tools');
  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleBookNow = () => {
    const phoneNumber = '919632301231';
    const message = encodeURIComponent(
      "Hi Admit55, I'm interested in learning more about your mentorship and guidance programs"
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20">

      {/* HEADER */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center"
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-black">
          Your MBA Journey, Guided by AI and Experience
        </h2>

        <div className="mt-4 flex justify-center">
          <Image
            src="/logo/admit55_final_logo.webp"
            alt="Admit55 Logo"
            width={80}
            height={80}
            className="object-contain"
          />
        </div>

        <p className="mt-3 text-base sm:text-lg text-black max-w-2xl mx-auto">
          Comprehensive tools to elevate every aspect of your application
        </p>
      </motion.div>

      {/* TABS */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mt-8 flex justify-center"
      >
        <div className="inline-flex rounded-full p-1 gap-3">
          {(['tools', 'experts'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-32 sm:w-40 py-2 text-sm sm:text-base font-semibold rounded-full transition ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#3F37C9] to-[#12D8B5] text-white shadow-md'
                  : 'bg-white text-slate-700 shadow-sm'
              }`}
            >
              {tab === 'tools' ? 'Tools' : 'Our Experts'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ---------------- TOOLS TAB ---------------- */}
      {activeTab === 'tools' && (
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className={`mt-12 grid ${
            isMobile ? 'grid-cols-2 gap-6' : 'grid-cols-5 gap-10'
          } justify-items-center`}
        >
          {toolCards.map((t, i) => {
            const size = isMobile ? 120 : 180;

            const Card = (
              <motion.div
                variants={fadeUp}
                className="flex flex-col items-center text-center gap-3 group"
              >
                <div
                  style={{ width: size, height: size }}
                  className="grid place-items-center transition-transform group-hover:-translate-y-2"
                >
                  <Image
                    src={t.src}
                    alt={t.title}
                    width={size}
                    height={size}
                    className="object-contain drop-shadow-md group-hover:drop-shadow-xl transition"
                  />
                </div>
                <div className="font-semibold text-slate-800">{t.title}</div>
                <div className="text-sm text-slate-500">{t.subtitle}</div>
              </motion.div>
            );

            return t.href && !t.comingSoon ? (
              <Link key={i} href={t.href} prefetch={false}>
                {Card}
              </Link>
            ) : (
              <div key={i}>{Card}</div>
            );
          })}
        </motion.div>
      )}

      {/* ---------------- EXPERTS TAB ---------------- */}
      {activeTab === 'experts' && (
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* LEFT */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6"
          >
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Built by admissions experts.
              <span className="block">Powered by AI.</span>
            </h3>

            <p className="mt-5 text-slate-600">
              Admit55 is founded by top admissions mentors and AI professionals who've personally
              guided <strong>1,000+</strong> candidates.
            </p>

            <p className="mt-3 text-slate-600">
              Started with <em>55 Successful ISB Essays</em>, now reimagined for the AI era.
            </p>

            <button
              onClick={handleBookNow}
              className="mt-8 inline-flex rounded-full bg-red-600 px-8 py-3 text-white font-semibold hover:bg-red-700"
            >
              Book a Session
            </button>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="lg:col-span-6 space-y-6"
          >
            <motion.div variants={fadeUp}>
              <Testimonial
                quote="The profile review gave me clarity I couldn't get anywhere else."
                name="Kartik Mittal"
                subtitle="IIM Bangalore EPGP '23"
                link="https://www.linkedin.com/in/kartikmittal1792/"
              />
            </motion.div>

            <motion.div variants={fadeUp}>
              <Testimonial
                quote="The insights were spot on and extremely actionable."
                name="Armaan Bansal"
                subtitle="ISB PGP '20"
                link="https://www.linkedin.com/in/armaan-bansal-aa93b95b/"
              />
            </motion.div>

            <motion.div variants={fadeUp}>
              <Testimonial
                quote="A game-changer for working professionals."
                name="Apoorva Tripathi"
                subtitle="XLRI Exec. MBA '22"
                link="https://www.linkedin.com/in/apoorvatripathi91/"
              />
            </motion.div>
          </motion.div>
        </div>
      )}
    </section>
  );
}

/* ---------- helpers ---------- */

function Testimonial({
  quote,
  name,
  subtitle,
  link,
}: {
  quote: string;
  name: string;
  subtitle: string;
  link: string;
}) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl bg-white p-6 ring-1 ring-slate-200 hover:ring-2 hover:ring-[#0A66C2] transition-all cursor-pointer"
    >
      <p className="text-slate-700">"{quote}"</p>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-900">{name}</div>
          <div className="text-sm text-slate-500">{subtitle}</div>
        </div>
        <ChevronRight className="h-5 w-5 text-[#0A66C2]" />
      </div>
    </a>
  );
}
