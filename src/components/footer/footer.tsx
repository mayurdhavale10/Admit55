'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Linkedin,
  Youtube,
  Instagram,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#0b1d2b] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">

        {/* TOP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* BRAND */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo/admit55_final_logo.webp"
                alt="Admit55 Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-xl font-extrabold tracking-tight">
                Admit55
              </span>
            </div>

            <p className="mt-3 text-sm text-white/70 max-w-xs">
              Clarity. Confidence. Admit55.
            </p>
          </div>

          {/* TOOLS */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold tracking-wide text-white/80">
              Tools
            </h4>

            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>
                <Link
                  href="/mba/tools/profileresumetool"
                  className="hover:text-white transition"
                >
                  Profile Snapshot
                </Link>
              </li>

              <li>
                <Link
                  href="http://localhost:3000/mba/tools/bschool-match"
                  className="hover:text-white transition"
                >
                  B-School Match
                </Link>
              </li>

              <li className="cursor-default opacity-60">
                Essay Lab
              </li>

              <li className="cursor-default opacity-60">
                Interview Ready
              </li>
            </ul>
          </div>

          {/* RESOURCES */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold tracking-wide text-white/80">
              Resources
            </h4>

            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>
                <Link href="/alum-coaches" className="hover:text-white transition">
                  Alum Coaches
                </Link>
              </li>
              <li>
                <Link href="/dream-b-schools" className="hover:text-white transition">
                  Dream B-Schools
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* SOCIAL */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold tracking-wide text-white/80">
              Connect
            </h4>

            <div className="mt-3 flex items-center gap-3">
              <a
                href="https://www.linkedin.com/company/admit55/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2 ring-1 ring-white/15 hover:bg-white/15 transition"
              >
                <Linkedin className="h-5 w-5" />
              </a>

              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2 ring-1 ring-white/15 hover:bg-white/15 transition"
              >
                <Youtube className="h-5 w-5" />
              </a>

              <a
                href="https://www.instagram.com/admit55_mba/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2 ring-1 ring-white/15 hover:bg-white/15 transition"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="mt-10 h-px w-full bg-white/10" />

        {/* BOTTOM BAR */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>
            Admit55 is not affiliated with ISB, IIMs, or any listed institutions.
          </p>

          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms of Use
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
