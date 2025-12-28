// src/app/BSchools/IIMADubai/components/brochure.tsx
"use client";

import React from "react";

export default function Brochure() {
  const pdfHref =
    "/documents/bschool/b1cb626ed_IIMADubaiBrochureVer12DoublePageView6-11-2025-compressed.pdf";

  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-3xl border border-black/10 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.10)]">
          <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
            {/* Left */}
            <div className="flex items-start gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm">
                {/* download icon */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3v10m0 0 4-4m-4 4-4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold tracking-tight text-[#0B1B33]">
                  Download the IIM Ahmedabad Dubai MBA Brochure
                </h3>
                <p className="mt-2 max-w-2xl text-[15.5px] leading-relaxed text-black/65">
                  Access the official programme brochure covering curriculum structure,
                  academic calendar, faculty approach, and campus details.
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={pdfHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-white font-semibold shadow-sm hover:bg-red-700 transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3v10m0 0 4-4m-4 4-4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                View Brochure
              </a>

              <a
                href={pdfHref}
                download
                className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-3 text-[#0B1B33] font-semibold hover:bg-black/5 transition-colors"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
