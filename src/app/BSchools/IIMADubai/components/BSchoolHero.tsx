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

        {/* Overlays */}
        <div className="absolute inset-0 bg-neutral-900/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/55 via-neutral-900/35 to-neutral-900/50" />

        {/* Content */}
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 sm:py-20">

          {/* HERO TITLE */}
          <h1 className="max-w-5xl text-3xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg">

            {/* Logo + Name */}
            <span className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
              <Image
                src="/school/IIMA.webp"
                alt="IIM Ahmedabad logo"
                width={96}
                height={96}
                className="h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 object-contain"
              />
              <span>IIM Ahmedabad</span>
            </span>

            {/* Program line */}
            <span className="block mt-3 sm:mt-4">
              One-Year MBA <span className="opacity-80">|</span> Dubai Campus
            </span>
          </h1>

          {/* SUBHEAD */}
          <p className="mt-5 max-w-4xl text-base sm:text-lg md:text-xl font-semibold text-white/95 drop-shadow-md">
            A fast-track, full-time MBA for experienced professionals ready to step
            into global leadership — from Dubai.
          </p>

          {/* BODY */}
          <div className="mt-6 max-w-4xl space-y-4 text-sm sm:text-base md:text-lg text-white/90 leading-relaxed drop-shadow-md">
            <p>
              Built on IIM Ahmedabad&apos;s academic rigour and alumni legacy, this
              immersive programme is designed for mid-career professionals who
              want to accelerate their impact — without compromising on depth.
            </p>

            <p>
              Study in Dubai while staying close to the action: regional HQs,
              consulting firms, family offices, sovereign entities, and high-growth
              tech across the GCC — giving you direct exposure to real business
              transformation.
            </p>
          </div>

          {/* Cards */}
          <div className="mt-10">
            <BSchoolcards />
          </div>
        </div>
      </div>
    </section>
  );
}
