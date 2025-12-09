'use client';

import Image from 'next/image';
import Link from 'next/link';

const TOOLS = [
  {
    id: 'profile',
    name: 'Profile Snapshot',
    description:
      'Upload your resume or fill a quick form to get an instant MBA profile evaluation.',
    href: '/mba/tools/profileresumetool',
    icon: '/logo/profileicon.webp',
  },
  {
    id: 'bschool',
    name: 'B-School Match',
    description:
      'Discover your best-fit business schools based on your profile and goals.',
    href: '/mba/tools/bschool-match',
    icon: '/logo/Bschool.webp',
  },
  {
    id: 'essay',
    name: 'Essay Lab',
    description:
      'Draft, refine, and polish winning MBA essays with AI + human guidance.',
    href: '/mba/tools/essaytool',
    icon: '/logo/essayicon.webp',
  },
  {
    id: 'resume',
    name: 'Resume Writer',
    description:
      'Create a professional, ATS-friendly resume tailored for MBA recruiting.',
    href: '/mba/tools/resumewriter',
    icon: '/logo/resumewriteicon.webp',
  },
  {
    id: 'interview',
    name: 'Interview Ready',
    description:
      'Practice MBA-style interview questions and get structured, targeted feedback.',
    href: '/mba/tools/interview-ready',
    icon: '/logo/interviewicon.webp',
  },
];

export default function YourToolsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* NAVY BLUE SLATE WITH HEADING + TOOLS */}
      <section className="w-full bg-gradient-to-br from-slate-800 to-blue-900 text-white">
        <div className="mx-auto max-w-6xl px-4 pt-32 pb-20 md:px-6 lg:px-10">
          {/* Heading */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Admit55: Your One-Stop Solution
            </h1>
            <p className="text-blue-100 text-lg md:text-xl leading-relaxed">
              AI-Curated with Human Intelligence for MBA Application Success
            </p>
          </div>

          {/* TOOLS – logos only on blue slate */}
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {TOOLS.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="group flex flex-col items-center text-center px-4 py-4 transition-transform duration-200 hover:-translate-y-1 cursor-pointer"
              >
                <div className="mb-4 flex items-center justify-center">
                  <Image
                    src={tool.icon}
                    alt={tool.name}
                    width={120}
                    height={120}
                    className="object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.55)] transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">
                  {tool.name}
                </h2>
                <p className="text-sm text-blue-100/90">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}