"use client";

interface TimelineItem {
  title: string;
  description: string;
  completed?: boolean;
}

interface ActionPlanTimelineProps {
  timeline?: {
    weeks_1_2?: TimelineItem[];
    weeks_3_6?: TimelineItem[];
    weeks_7_12?: TimelineItem[];
  };
}

function TimelineSection({ 
  title, 
  period, 
  items, 
  iconBg, 
  gradient 
}: { 
  title: string;
  period: string;
  items: TimelineItem[];
  iconBg: string;
  gradient: string;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} border border-slate-200/60 p-6`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} text-white flex items-center justify-center font-bold text-lg shadow-sm`}>
          {period}
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-900">{title}</h4>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div 
            key={idx} 
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-100 hover:shadow-md transition-all duration-200"
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                  item.completed 
                    ? 'bg-emerald-600 border-emerald-600' 
                    : 'border-slate-300 bg-white'
                }`}>
                  {item.completed && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ActionPlanTimeline({ timeline }: ActionPlanTimelineProps) {
  // Mock data for preview
  const weeks_1_2 = timeline?.weeks_1_2?.length ? timeline.weeks_1_2 : [
    { title: "Finalize school list", description: "Select 6-8 schools across all tiers", completed: false },
    { title: "Order transcripts", description: "Request official transcripts from all universities", completed: false },
    { title: "Identify recommenders", description: "Choose 2-3 recommenders and brief them on your goals", completed: false }
  ];

  const weeks_3_6 = timeline?.weeks_3_6?.length ? timeline.weeks_3_6 : [
    { title: "GMAT/GRE preparation", description: "Target 740+ GMAT or equivalent GRE score", completed: false },
    { title: "Attend info sessions", description: "Join virtual events for target schools", completed: false },
    { title: "Connect with alumni", description: "Reach out to 2-3 alumni per school via LinkedIn", completed: false },
    { title: "Research essay prompts", description: "Analyze past year essays and start brainstorming", completed: false }
  ];

  const weeks_7_12 = timeline?.weeks_7_12?.length ? timeline.weeks_7_12 : [
    { title: "Draft essays", description: "First drafts for all schools (3-4 weeks)", completed: false },
    { title: "Request recommendations", description: "Give recommenders 4-week notice minimum", completed: false },
    { title: "Finalize applications", description: "Review, proofread, and polish all materials", completed: false },
    { title: "Submit Round 1", description: "Submit all applications before R1 deadline", completed: false }
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
            Your 12-Week Action Plan
          </h3>
        </div>
        <p className="text-slate-600 leading-relaxed">
          Step-by-step timeline to maximize your admission chances
        </p>
      </div>

      {/* Timeline Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <TimelineSection
          title="Week 1-2"
          period="1-2"
          items={weeks_1_2}
          iconBg="bg-sky-600"
          gradient="from-sky-50 to-cyan-50/50"
        />

        <TimelineSection
          title="Week 3-6"
          period="3-6"
          items={weeks_3_6}
          iconBg="bg-emerald-600"
          gradient="from-emerald-50 to-green-50/50"
        />

        <TimelineSection
          title="Week 7-12"
          period="7-12"
          items={weeks_7_12}
          iconBg="bg-amber-600"
          gradient="from-amber-50 to-orange-50/50"
        />
      </div>

      {/* Bottom tip */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="flex gap-3 items-start bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed flex-1">
            <span className="font-semibold text-slate-900">Time management tip:</span> Start early and build buffer time. Most successful applicants spend 3-4 months on essays alone. Don't rush the process.
          </p>
        </div>
      </div>
    </div>
  );
}