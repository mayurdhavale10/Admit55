import Image from "next/image";
import BSchoolcards from "./BSchoolcards";

export default function BSchoolHero() {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative min-h-screen w-full">
        {/* Background */}
        <Image
          src="/bschools/IIMADUBAICAMPUS.webp"
          alt="IIM Ahmedabad Dubai Campus"
          fill
          priority
          className="object-cover"
        />

        {/* Slight grey film overlay */}
        <div className="absolute inset-0 bg-neutral-900/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/55 via-neutral-900/35 to-neutral-900/50" />

        {/* Content */}
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
          <h1 className="text-5xl font-extrabold tracking-tight text-white md:text-7xl drop-shadow-lg max-w-5xl">
            {/* Line 1: Logo + IIM Ahmedabad */}
            <span className="inline-flex items-center gap-5">
              <Image
                src="/school/IIMA.webp"
                alt="IIM Ahmedabad logo"
                width={96}
                height={96}
                className="h-16 w-16 md:h-20 md:w-20 object-contain"
              />
              <span>IIM Ahmedabad</span>
            </span>

            {/* Line 2: One-Year MBA | Dubai Campus */}
            <span className="block mt-3 whitespace-nowrap">
              One-Year MBA | Dubai Campus
            </span>
          </h1>

          <p className="mt-6 text-xl md:text-2xl text-white/95 font-semibold drop-shadow-md max-w-4xl">
            A fast-track, full-time MBA for experienced professionals ready to step into global leadership — from Dubai.
          </p>

          <div className="mt-8 space-y-5 text-lg md:text-xl text-white/90 drop-shadow-md max-w-4xl leading-relaxed">
            <p>
              Built on IIM Ahmedabad&apos;s academic rigour and alumni legacy, this immersive programme is designed for
              mid-career professionals who want to accelerate their impact — without compromising on depth.
            </p>

            <p>
              Study in Dubai while staying close to the action: regional HQs, consulting firms, family offices, sovereign
              entities, and high-growth tech across the GCC — giving you direct exposure to real business transformation.
            </p>
          </div>

          {/* ✅ Cards appear right after the text, on the same background */}
          <BSchoolcards />
        </div>
      </div>
    </section>
  );
}