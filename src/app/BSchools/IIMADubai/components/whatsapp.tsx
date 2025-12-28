// src/app/BSchools/IIMADubai/components/whatsapp.tsx
"use client";

import React from "react";

const PHONE_DISPLAY = "+971 56 685 6643";
const PHONE_E164 = "971566856643"; // wa.me needs digits only
const EMAIL = "crew@admit55.com";
const LINKEDIN_URL = "https://www.linkedin.com/company/admit55/?viewAsMember=true";

// WhatsApp chat link (no +, no spaces)
const WHATSAPP_CHAT_URL = `https://wa.me/${PHONE_E164}?text=${encodeURIComponent(
  "Hi Admit55 team — I’d like to learn more about the IIM Ahmedabad Dubai MBA."
)}`;

export default function WhatsAppSection() {
  return (
    <section className="w-full bg-gradient-to-b from-[#0ea58f] to-[#0a927f] py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="text-center text-white">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Talk to Our Dubai-Based Team
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg md:text-xl text-white/90 leading-relaxed">
            Have questions about fit, positioning, or whether the IIM A Dubai MBA
            makes sense for your career goals? Our team is based in Dubai and
            works closely with professionals across the UAE.
          </p>
        </div>

        {/* Contact Card */}
        <div className="mx-auto mt-12 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <div className="grid grid-cols-1 gap-10 px-8 py-10 md:grid-cols-3 md:gap-6">
            {/* WhatsApp */}
            <a
              href={WHATSAPP_CHAT_URL}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col items-center text-center text-white"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/15 group-hover:bg-white/15 transition">
                {/* phone icon */}
                <svg
                  viewBox="0 0 24 24"
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M22 16.9v3a2 2 0 0 1-2.18 2 19.9 19.9 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.17 10.8 19.9 19.9 0 0 1 .1 2.18 2 2 0 0 1 2.09 0h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L6.1 7.4a16 16 0 0 0 6.5 6.5l1.07-1.07a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.9Z" />
                </svg>
              </div>

              <div className="mt-4 text-sm font-semibold text-white/90">
                Call / WhatsApp
              </div>
              <div className="mt-2 text-xl md:text-2xl font-extrabold tracking-tight">
                {PHONE_DISPLAY}
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${EMAIL}`}
              className="group flex flex-col items-center text-center text-white"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/15 group-hover:bg-white/15 transition">
                {/* mail icon */}
                <svg
                  viewBox="0 0 24 24"
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M4 4h16v16H4z" />
                  <path d="m22 6-10 7L2 6" />
                </svg>
              </div>

              <div className="mt-4 text-sm font-semibold text-white/90">
                Email
              </div>
              <div className="mt-2 text-xl md:text-2xl font-extrabold tracking-tight">
                {EMAIL}
              </div>
            </a>

            {/* LinkedIn */}
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col items-center text-center text-white"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/15 group-hover:bg-white/15 transition">
                {/* linkedin icon */}
                <svg
                  viewBox="0 0 24 24"
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V9h4v2" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </div>

              <div className="mt-4 text-sm font-semibold text-white/90">
                LinkedIn
              </div>
              <div className="mt-2 text-xl md:text-2xl font-extrabold tracking-tight">
                Admit55
              </div>
            </a>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={WHATSAPP_CHAT_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 font-semibold text-[#0B1B33] shadow hover:opacity-95 transition"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/5">
              💬
            </span>
            Contact Our Dubai Team
          </a>

          <a
            href={`tel:${PHONE_E164}`}
            className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white hover:bg-white/15 transition"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
              📞
            </span>
            Book a Quick Call
          </a>
        </div>

        {/* Badge */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/15 px-6 py-3 text-white/95 border border-white/20 backdrop-blur">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
              ✓
            </span>
            <span className="text-sm md:text-base font-semibold">
              UAE-based alumni and advisor support available
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
