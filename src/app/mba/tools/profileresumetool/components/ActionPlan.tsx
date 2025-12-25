"use client";

type ActionItem = {
  title: string;
  how: string;
  why: string;
};

type Props = {
  next4to6Weeks?: ActionItem[];
  next3Months?: ActionItem[];
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Section({ title, items }: { title: string; items?: ActionItem[] }) {
  if (!items?.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">{title}</h4>
        </div>
        <p className="mt-2 text-sm text-slate-200/70">Not available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>

      <div className="mt-3 space-y-3">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-50">{it.title}</p>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-200/70">
                #{idx + 1}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-100/90">
              <span className="text-slate-300/70">How: </span>
              {it.how}
            </p>
            <p className="mt-1 text-sm text-slate-100/90">
              <span className="text-slate-300/70">Why: </span>
              {it.why}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ActionPlan({ next4to6Weeks, next3Months }: Props) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/15 bg-white/10 p-6 shadow-xl",
        "backdrop-blur-xl backdrop-saturate-150 text-slate-50"
      )}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-bold">Action Plan</h3>
        <span className="text-xs text-slate-200/70">Time-boxed roadmap</span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Section title="Next 4–6 Weeks" items={next4to6Weeks} />
        <Section title="Next 3 Months" items={next3Months} />
      </div>
    </div>
  );
}
