// src/app/mba/tools/resumewriter/page.tsx
"use client";

import Link from "next/link";

export default function ResumeWriterLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-blue-900 text-white">
      <div className="max-w-6xl mx-auto px-4 pt-32 pb-20 grid gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
        
        {/* Left: Copy */}
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-blue-100 uppercase mb-4">
            Admit55 · MBA Resume Engine
          </p>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white">
            Stop Writing Resumes.
            <br />
            <span className="text-blue-200">
              Start Engineering Your Career Goal.
            </span>
          </h1>

          <p className="mt-4 text-sm md:text-base text-blue-100 max-w-xl">
            Customized resumes for every milestone: salary negotiation, MBA entrance,
            and executive placement.
          </p>

          <p className="mt-3 text-xs md:text-sm text-blue-100/90 max-w-xl">
            Built by ex-ISB and ex-IIM mentors who translated years of top-tier consulting
            and MBA recruiting experience into an affordable AI engine that works for you
            24/7.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/mba/tools/resumewriter/builder"
              className="
                inline-flex items-center justify-center rounded-full
                bg-white px-6 py-2.5 text-sm font-semibold text-slate-900
                shadow-lg shadow-black/20 hover:bg-blue-50 transition
              "
            >
              Create your resume
            </Link>

            <button
              type="button"
              className="
                inline-flex items-center justify-center rounded-full
                border border-blue-200/40 px-6 py-2.5 text-sm font-semibold
                text-blue-100 hover:bg-white/10 transition
              "
            >
              Upload existing resume
            </button>
          </div>

          <p className="mt-4 text-[11px] text-blue-100/70">
            No templates to fight. No copy-paste prompts. Just answer smart questions and
            let the engine do the heavy lifting.
          </p>
        </div>

        {/* Right: Preview card */}
        <div className="relative">
          <div className="absolute -inset-6 bg-blue-500/20 blur-3xl rounded-3xl" />

          <div className="relative rounded-3xl bg-slate-900/60 border border-white/10 p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-blue-100">
                Live MBA resume preview
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-blue-100">
                Builder v1 prototype
              </span>
            </div>

            <div className="rounded-2xl bg-slate-950/70 border border-white/10 h-64 flex items-center justify-center text-xs text-blue-100/70 text-center px-6">
              Real screenshots from the Admit55 Resume Builder will appear here.
              <br />
              First, let’s make the engine world-class.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
