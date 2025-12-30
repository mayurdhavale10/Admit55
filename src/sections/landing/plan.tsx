'use client';

import { Check, MessageCircle, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Plan() {
  const router = useRouter();

  const handleUpgrade = () => {
    // Redirect to upgradetopro page
    router.push('/upgradetopro');
  };

  const handleWhatsApp = () => {
    const phone = '919632301231';
    const msg = encodeURIComponent(
      "Hi Admit55 team, I'd like to know more about 1-1 Alum Coaching. Please share details."
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  return (
    <section className="w-full bg-gradient-to-b from-white to-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Our Packages
          </h2>
          <p className="text-slate-600 text-lg">
            Choose what works for you
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">

          {/* FREE */}
          <div className="rounded-2xl bg-white p-8 shadow-md border border-slate-200 flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
              <p className="text-slate-600 text-sm">Get started with basic access</p>
            </div>

            <div className="mb-8">
              <div className="text-5xl font-bold text-slate-900">₹0</div>
            </div>

            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">5 AI tool runs</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Profile Review</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">B-School Match</span>
              </li>
            </ul>

            <button
              disabled
              className="w-full rounded-xl border-2 border-slate-300 py-3.5 text-base font-semibold text-slate-400 cursor-not-allowed bg-slate-50"
            >
              Get Started Free
            </button>
          </div>

          {/* PRO (HIGHLIGHTED) */}
          <div className="relative rounded-2xl bg-gradient-to-br from-teal-600 via-teal-600 to-teal-700 p-8 text-white shadow-2xl transform lg:scale-105 flex flex-col">

            {/* Popular badge */}
            <div className="absolute -top-3 right-6 rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-900 shadow-lg">
              POPULAR
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-3">Pro</h3>
              <p className="text-teal-50 text-sm leading-relaxed">
                Unlock advanced AI insights, personalized school strategies, and expert-backed guidance
              </p>
            </div>

            {/* Price */}
            <div className="mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">₹1,999</span>
                <span className="text-lg text-teal-100">/ $25</span>
              </div>
              <div className="mt-2">
                <span className="text-teal-200 line-through text-base">₹3,999</span>
                <span className="text-teal-200 mx-1">·</span>
                <span className="text-teal-200 line-through text-base">$50</span>
              </div>
            </div>

            <p className="text-xs text-teal-100 italic mb-8">
              Limited-time launch pricing currently available
            </p>

            {/* Features */}
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                <span className="text-white font-medium">30 AI tool runs</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                <span className="text-white font-medium">All AI tools included</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                <span className="text-white font-medium">2 Alum Strategy Sessions</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                <span className="text-white font-medium">Priority support</span>
              </li>
            </ul>

            {/* CTA */}
            <button
              onClick={handleUpgrade}
              className="w-full rounded-xl bg-white py-4 text-base font-bold text-teal-700 shadow-lg hover:bg-teal-50 transition-all duration-200 hover:shadow-xl"
            >
              Upgrade to Pro
            </button>

            <div className="mt-4 text-xs text-center text-teal-100 leading-relaxed">
              Instant activation after confirmation
              <br />
              Works for applicants in India and internationally
            </div>
          </div>

          {/* 1-1 ALUM */}
          <div className="rounded-2xl bg-white p-8 shadow-md border border-slate-200 flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-6 w-6 text-teal-600" />
                <h3 className="text-2xl font-bold text-slate-900">1-1 Alum Coaching</h3>
              </div>
              <p className="text-slate-600 text-sm font-medium">Custom</p>
            </div>

            <p className="text-slate-700 text-sm leading-relaxed mb-8">
              Personalized mentoring, strategy calls, and application guidance from ISB, IIM A, and global B-school alumni.
            </p>

            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Tailored admission strategy</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Essay review & feedback</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Interview preparation</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">School selection guidance</span>
              </li>
            </ul>

            <button
              onClick={handleWhatsApp}
              className="w-full rounded-xl bg-teal-600 py-4 text-base font-semibold text-white hover:bg-teal-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              Connect on WhatsApp
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}