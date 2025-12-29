"use client";

interface FitStoryStrengthProps {
  strengths?: string[];
  concerns?: string[];
  improvements?: string[];
}

function Section({ 
  title, 
  items, 
  icon,
  gradient,
  border,
  iconBg,
  textColor 
}: { 
  title: string;
  items: string[];
  icon: React.ReactNode;
  gradient: string;
  border: string;
  iconBg: string;
  textColor: string;
}) {
  if (!items?.length) {
    return (
      <div className={`rounded-2xl bg-gradient-to-br ${gradient} border ${border} p-6 hover:border-opacity-80 transition-all duration-200`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shadow-sm`}>
            {icon}
          </div>
          <h4 className={`text-base font-bold ${textColor}`}>{title}</h4>
        </div>
        <p className="text-sm text-slate-400 italic">No data available</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} border ${border} p-6 hover:shadow-lg transition-all duration-200 group`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
        <h4 className={`text-base font-bold ${textColor}`}>{title}</h4>
      </div>

      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
            <span className={`font-bold mt-0.5 flex-shrink-0 ${textColor}`}>•</span>
            <span className="flex-1">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FitStoryStrength({ 
  strengths, 
  concerns, 
  improvements 
}: FitStoryStrengthProps) {
  // Mock data for preview
  const displayStrengths = strengths?.length ? strengths : [
    "4 years PM experience shows leadership trajectory",
    "GMAT 720 demonstrates academic readiness",
    "Clear career goal (consulting) with rationale",
    "Tech background adds diversity to consulting class"
  ];

  const displayConcerns = concerns?.length ? concerns : [
    "Indian male tech → consulting is overrepresented",
    "Need to differentiate from hundreds of similar profiles",
    "GPA 3.6 is below median at M7 schools",
    "Limited international experience"
  ];

  const displayImprovements = improvements?.length ? improvements : [
    "Highlight unique: non-profit side project, unusual hobby",
    "Retake GMAT (target 740+ for ambitious tier)",
    "Take online quant course to offset GPA",
    "Get recommendation from senior partner, not peer",
    "In essays, focus on 'why consulting' beyond money"
  ];

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-shadow duration-300">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <img 
            src="/logo/admit55_final_logo.webp"
            alt="Admit55"
            className="w-10 h-10 object-contain"
          />
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            Your Application Story
          </h3>
        </div>
        <p className="text-slate-600 leading-relaxed">
          What admissions committees will see in your profile
        </p>
      </div>

      {/* Three columns */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Strengths */}
        <Section
          title="What AdCom Likes"
          items={displayStrengths}
          gradient="from-emerald-50 to-green-50/50"
          border="border-emerald-200/60"
          iconBg="bg-emerald-600"
          textColor="text-emerald-900"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          }
        />

        {/* Concerns */}
        <Section
          title="What Raises Questions"
          items={displayConcerns}
          gradient="from-amber-50 to-orange-50/50"
          border="border-amber-200/60"
          iconBg="bg-amber-600"
          textColor="text-amber-900"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />

        {/* Improvements */}
        <Section
          title="How to Strengthen"
          items={displayImprovements}
          gradient="from-sky-50 to-cyan-50/50"
          border="border-sky-200/60"
          iconBg="bg-sky-600"
          textColor="text-sky-900"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Bottom insight */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed flex-1">
            <span className="font-semibold text-slate-900">Pro tip:</span> Address concerns proactively in essays and interviews. Don't wait for AdCom to discover weaknesses—own them and show how you've grown.
          </p>
        </div>
      </div>
    </div>
  );
}