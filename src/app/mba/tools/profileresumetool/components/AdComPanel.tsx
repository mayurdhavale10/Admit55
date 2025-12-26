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

function List({ items, color }: { items?: string[]; color: "green" | "amber" | "blue" }) {
  if (!items?.length) {
    return (
      <p className="text-sm text-slate-400 italic mt-3">
        No data available
      </p>
    );
  }

  const colorClasses = {
    green: {
      text: "text-slate-700",
      bullet: "text-green-500",
    },
    amber: {
      text: "text-slate-700",
      bullet: "text-amber-500",
    },
    blue: {
      text: "text-slate-700",
      bullet: "text-blue-500",
    },
  };

  return (
    <ul className="mt-4 space-y-3">
      {items.map((x, i) => (
        <li key={i} className={cn("text-sm leading-relaxed flex gap-2.5", colorClasses[color].text)}>
          <span className={cn("font-bold mt-0.5 flex-shrink-0", colorClasses[color].bullet)}>•</span>
          <span className="flex-1">{x}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdComPanel({ whatExcites, whatConcerns, howToPreempt }: Props) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white p-8 shadow-xl border border-slate-100",
        "hover:shadow-2xl transition-shadow duration-300"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center shadow-sm">
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
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">What AdCom Sees</h3>
      </div>

      {/* Three Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* What Excites Them */}
        <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-200/60 p-6 hover:border-green-300 transition-colors duration-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center shadow-sm">
              <svg 
                className="w-5 h-5 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            <p className="text-base font-bold text-green-900">What Excites Them</p>
          </div>
          <List items={whatExcites} color="green" />
        </div>

        {/* What Concerns Them */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60 p-6 hover:border-amber-300 transition-colors duration-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm">
              <svg 
                className="w-5 h-5 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            <p className="text-base font-bold text-amber-900">What Concerns Them</p>
          </div>
          <List items={whatConcerns} color="amber" />
        </div>

        {/* How to Preempt */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50/50 border border-blue-200/60 p-6 hover:border-blue-300 transition-colors duration-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-sm">
              <svg 
                className="w-5 h-5 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <p className="text-base font-bold text-blue-900">How to Preempt</p>
          </div>
          <List items={howToPreempt} color="blue" />
        </div>
      </div>
    </div>
  );
}