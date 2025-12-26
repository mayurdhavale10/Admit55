"use client";

import Image from "next/image";

type Props = {
  whatExcites?: string[];
  whatConcerns?: string[];
  howToPreempt?: string[];
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function List({ items }: { items?: string[] }) {
  if (!items?.length) return <p className="text-sm text-slate-600/70">Not available.</p>;
  return (
    <ul className="mt-3 space-y-2.5">
      {items.map((x, i) => (
        <li key={i} className="text-sm text-slate-700 leading-relaxed flex">
          <span className="mr-2 text-slate-400 mt-0.5">•</span>
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdComPanel({ whatExcites, whatConcerns, howToPreempt }: Props) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white p-8 shadow-lg border border-slate-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
          <svg 
            className="w-5 h-5 text-slate-700" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900">What AdCom Sees</h3>
      </div>

      {/* Three Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* What Excites Them */}
        <div className="rounded-2xl bg-green-50/60 border border-green-100 p-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg 
                className="w-4 h-4 text-green-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-green-800">What Excites Them</p>
          </div>
          <List items={whatExcites} />
        </div>

        {/* What Concerns Them */}
        <div className="rounded-2xl bg-amber-50/60 border border-amber-100 p-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
              <svg 
                className="w-4 h-4 text-amber-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-amber-800">What Concerns Them</p>
          </div>
          <List items={whatConcerns} />
        </div>

        {/* How to Preempt */}
        <div className="rounded-2xl bg-blue-50/60 border border-blue-100 p-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <svg 
                className="w-4 h-4 text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-blue-800">How to Preempt</p>
          </div>
          <List items={howToPreempt} />
        </div>
      </div>
    </div>
  );
}