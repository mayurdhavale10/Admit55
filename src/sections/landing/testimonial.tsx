'use client';

import Image from 'next/image';
import Link from 'next/link';

type Testimonial = {
  image: string;
  quote: string;
  name: string;
  program: string;
  linkedin: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    image: '/testimonial/kartik_mittal.webp',
    quote:
      "The profile review gave me clarity I couldn't get anywhere else. Helped me target the right schools.",
    name: 'Kartik Mittal',
    program: "IIM Bangalore EPGP ’23",
    linkedin: 'https://www.linkedin.com/in/kartikmittal1792/',
  },
  {
    image: '/testimonial/Arman_Bansal.webp',
    quote:
      'Admit55 helped me understand my strengths and weaknesses objectively. The insights were spot on.',
    name: 'Armaan Bansal',
    program: "ISB PGP ’20",
    linkedin: 'https://www.linkedin.com/in/armaan-bansal-aa93b95b/',
  },
  {
    image: '/testimonial/Apoorva_tripathi.webp',
    quote:
      'A game-changer for working professionals. Saved me months of confusion and gave me a clear roadmap.',
    name: 'Apoorva Tripathi',
    program: "XLRI Exec. MBA ’22",
    linkedin: 'https://www.linkedin.com/in/apoorvatripathi91/',
  },
];

export default function HowTop() {
  return (
    <section className="w-full bg-white py-18 sm:py-22">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo/admit55_final_logo.webp"
              alt="Admit55"
              width={84}
              height={84}
              className="object-contain"
            />
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
            Behind every one of our <span className="text-[#0B5CAB]">1000+</span> successful admits
            is a unique story, a strategic profile, and a mentor who cared.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600">
            See what our students have to say about the journey.
          </p>
        </div>

        {/* TESTIMONIALS */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="group rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 p-8 text-center"
            >
              {/* IMAGE */}
              <Link
                href={t.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center"
              >
                <Image
                  src={t.image}
                  alt={t.name}
                  width={128}
                  height={128}
                  className="rounded-full object-cover ring-4 ring-slate-100 group-hover:ring-[#0B5CAB]/20 transition"
                />
              </Link>

              {/* QUOTE */}
              <p className="mt-8 text-slate-700 text-sm sm:text-base leading-relaxed">
                “{t.quote}”
              </p>

              {/* NAME */}
              <Link
                href={t.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block font-semibold text-slate-900 hover:text-[#0A66C2] transition"
              >
                {t.name}
              </Link>

              {/* PROGRAM */}
              <div className="text-sm text-slate-500">
                {t.program}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
