'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Linkedin,
  Youtube,
  Instagram,
} from 'lucide-react';

export default function Footer() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get('name') as string,
      email: form.get('email') as string,
      target: form.get('target') as string,
      score: form.get('score') as string,
    };

    try {
      // POST to your API (adjust route as needed)
      await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setMsg('Thanks! We’ll reach out with early access details.');
      e.currentTarget.reset();
    } catch {
      setMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <footer className="w-full">
      {/* ===== Early Beta band ===== */}
      <section className="relative isolate bg-gradient-to-b from-[#0a3a6a] via-[#0b487f] to-[#0b4f88] text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              <Sparkles className="h-4 w-4" />
              Early Beta Access
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Join Our Early Beta
            </h2>
            <p className="mt-2 text-white/85">
              Early users get personalized feedback, exclusive tools, and essay support
            </p>
          </div>

          {/* Glass card form */}
          <div className="mt-8 rounded-2xl bg-white/5 p-4 sm:p-6 backdrop-blur-md ring-1 ring-white/15 shadow-xl">
            <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input name="name" label="Full Name" placeholder="Your name" />
              <Input
                name="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                required
              />
              <Input
                name="target"
                label="Target B-School"
                placeholder="ISB, IIM A, etc."
              />
              <Input
                name="score"
                label="GMAT/GRE Score"
                placeholder="710 / 325"
              />

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-400/40 transition hover:bg-emerald-400 disabled:opacity-70"
                >
                  Get Early Access
                  <ArrowRight className="h-4 w-4" />
                </button>
                {msg && (
                  <p className="mt-2 text-center text-sm text-white/90">{msg}</p>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ===== Dark footer ===== */}
      <section className="bg-[#0b1d2b] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Brand */}
            <div className="md:col-span-4">
              <div className="text-xl font-extrabold">Admit55</div>
              <p className="mt-2 text-sm text-white/70">
                Clarity. Confidence. Admit55.
              </p>
            </div>

            {/* Tools */}
            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold tracking-wide text-white/80">
                Tools
              </h4>
              <ul className="mt-3 space-y-2 text-white/70 text-sm">
                <li><Link href="/mba/tools/profileresumetool" className="hover:text-white">Profile Snapshot</Link></li>
                <li><Link href="/dream-b-schools" className="hover:text-white">B-School Match</Link></li>
                <li><span className="cursor-default">Essay Lab</span></li>
                <li><span className="cursor-default">Interview Ready</span></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="md:col-span-3">
              <h4 className="text-sm font-semibold tracking-wide text-white/80">
                Resources
              </h4>
              <ul className="mt-3 space-y-2 text-white/70 text-sm">
                <li><Link href="/alum-coaches" className="hover:text-white">Alum Coaches</Link></li>
                <li><Link href="/dream-b-schools" className="hover:text-white">Dream B-Schools</Link></li>
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>

            {/* Social */}
            <div className="md:col-span-3">
              <h4 className="text-sm font-semibold tracking-wide text-white/80">
                Connect
              </h4>
              <div className="mt-3 flex items-center gap-3">
                <a aria-label="LinkedIn" href="https://www.linkedin.com" target="_blank" className="rounded-full bg-white/10 p-2 ring-1 ring-white/15 hover:bg-white/15">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a aria-label="YouTube" href="https://www.youtube.com" target="_blank" className="rounded-full bg-white/10 p-2 ring-1 ring-white/15 hover:bg-white/15">
                  <Youtube className="h-5 w-5" />
                </a>
                <a aria-label="Instagram" href="https://www.instagram.com" target="_blank" className="rounded-full bg-white/10 p-2 ring-1 ring-white/15 hover:bg-white/15">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-8 h-px w-full bg-white/10" />

          {/* Bottom bar */}
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60">
            <p>
              Admit55 is not affiliated with ISB, IIMs, or any listed institutions.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white">Terms of Use</Link>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}

/* ---------- small input component ---------- */
function Input({
  name,
  label,
  placeholder,
  type = 'text',
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-white/85">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md bg-white/10 px-3 py-2 text-white placeholder-white/60 outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-emerald-400"
      />
    </label>
  );
}
