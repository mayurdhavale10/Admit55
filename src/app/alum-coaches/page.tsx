import MeetYourCoaches from './components/MeetYourCoaches';
import AlumCoachesHero from './components/AlumCoachesHero';
import Plan from '@src/sections/landing/plan';
import Footer from '@src/components/footer/footer';

export default function Page() {
  return (
    <main className="relative w-full overflow-hidden bg-white">
      {/* Continuous page background */}
      <div className="pointer-events-none absolute inset-0">
        {/* dark top fade so transparent navbar stays visible */}
        <div className="absolute left-0 top-0 h-[170px] w-full bg-gradient-to-b from-[#0b1220] via-[#0b1220]/60 to-transparent" />

        {/* subtle grid */}
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:64px_64px]" />

        {/* teal glow */}
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.18),transparent_60%)] blur-2xl" />
      </div>

      <div className="relative">
        <MeetYourCoaches />
        <AlumCoachesHero />
        <Plan />
        <Footer />
      </div>
    </main>
  );
}
