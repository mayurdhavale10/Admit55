'use client';

import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';

/* ---------- types ---------- */
type Coach = {
  name: string;
  title: string;
  institution: string;
  role: string;
  highlight: string;
  image: string;
};

/* ---------- content ---------- */
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

export default function WhyAdmit55() {
  const { data: session } = useSession();

  const handleBookSession = () => {
    const phoneNumber = '919632301231';
    const message = encodeURIComponent(
      "Hi Admit55, I'm interested in learning more about your mentorship and guidance programs"
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <section className="relative w-full bg-gradient-to-b from-[#0a3a6a] to-[#0b487f] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20">

        {/* Guarantee pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-3 py-1 text-sm font-semibold text-slate-900 shadow">
            <ShieldCheck className="h-4 w-4" />
            100% GUARANTEE
          </div>
        </div>

        {/* Heading */}
        <h2 className="mt-5 text-center text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
          Guaranteed Admission or 100% Money Back
        </h2>

        <p className="mx-auto mt-4 max-w-3xl text-center text-slate-100/90">
          Work 1:1 with ISB, IIM, and INSEAD alumni who’ve helped hundreds of
          candidates succeed. If you don’t secure admission to your top 5
          B-Schools, we’ll refund you — no questions asked.
        </p>

        {/* Divider */}
        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-sm font-semibold tracking-wide text-white/80">
            Meet Your Coaches
          </span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        {/* Mentor cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {COACHES.map((coach, i) => (
            <CoachCard key={i} coach={coach} />
          ))}
        </div>

        {/* Founding team strip */}
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <p className="text-sm sm:text-base text-white/90 font-medium">
            Other founding team includes alums from <strong>ISB</strong>,{' '}
            <strong>INSEAD</strong>
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/admit55/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A66C2]/90 hover:bg-[#0A66C2] transition shadow-sm"
            >
              <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/admit55_mba/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#515BD4] hover:brightness-110 transition shadow-sm"
            >
              <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.343 3.608 1.318.975.975 1.256 2.242 1.318 3.608.058 1.266.07 1.646.07 4.84 0 3.204-.012 3.584-.07 4.85-.062 1.366-.343 2.633-1.318 3.608-.975.975-2.242 1.256-3.608 1.318-1.266.058-1.646.07-4.84.07-3.204 0-3.584-.012-4.85-.07-1.366-.062-2.633-.343-3.608-1.318-.975-.975-1.256-2.242-1.318-3.608-.058-1.266-.07-1.646-.07-4.84 0-3.204.012-3.584.07-4.85.062-1.366.343-2.633 1.318-3.608.975-.975 2.242-1.256 3.608-1.318 1.266-.058 1.646-.07 4.84-.07z" />
              </svg>
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleBookSession}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-red-900/20 ring-1 ring-red-400/40 transition hover:bg-red-500"
          >
            Book a Session
          </button>
        </div>

        {/* Fine print */}
        <p className="mt-3 text-center text-xs text-white/70">
          Limited slots available • Premium coaching packages starting at ₹50,000
        </p>
      </div>
    </section>
  );
}

/* ---------- Coach Card ---------- */

function CoachCard({ coach }: { coach: Coach }) {
  const { name, title, institution, role, highlight, image } = coach;

  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 backdrop-blur-sm shadow-lg shadow-black/10 transition hover:-translate-y-0.5">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full overflow-hidden ring-2 ring-emerald-400/50">
          <Image
            src={image}
            alt={name}
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        </div>

        <div>
          <div className="text-lg font-semibold">{name}</div>
          <div className="text-sm text-white/80">{title}</div>
          <div className="text-sm text-emerald-300 font-medium">
            {institution}
          </div>
        </div>
      </div>

      <div className="mt-4 h-px w-full bg-white/10" />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-white/90">{role}</span>
        <span className="text-xs font-semibold text-emerald-300">
          {highlight}
        </span>
      </div>
    </div>
  );
}
