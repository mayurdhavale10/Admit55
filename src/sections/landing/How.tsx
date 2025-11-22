

'use client';

import HowTop from "./how/HowTop";
import HowSteps from "./how/HowSteps";
import HowTestimonials from "./how/HowTestimonials";

export default function How() {
  return (
    <section id="how" className="relative w-full bg-white">
      <HowTop />
      <HowSteps />
      <HowTestimonials />
    </section>
  );
}
