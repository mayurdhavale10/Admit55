"use client";

type Props = {
  whatExcites?: string[];
  whatConcerns?: string[];
  howToPreempt?: string[];
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function List({ items }: { items?: string[] }) {
  if (!items?.length) return <p className="text-sm text-slate-200/70">Not available.</p>;
  return (
    <ul className="mt-2 space-y-2">
      {items.map((x, i) => (
        <li key={i} className="text-sm text-slate-100/90">
          <span className="mr-2 text-slate-300/70">•</span>
          {x}
        </li>
      ))}
    </ul>
  );
}

export default function AdComPanel({ whatExcites, whatConcerns, howToPreempt }: Props) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/15 bg-white/10 p-6 shadow-xl",
        "backdrop-blur-xl backdrop-saturate-150 text-slate-50"
      )}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-bold">What AdCom Sees</h3>
        <span className="text-xs text-slate-200/70">Panel summary</span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <p className="text-sm font-semibold">What excites</p>
          </div>
          <List items={whatExcites} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <p className="text-sm font-semibold">What concerns</p>
          </div>
          <List items={whatConcerns} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <p className="text-sm font-semibold">How to preempt</p>
          </div>
          <List items={howToPreempt} />
        </div>
      </div>
    </div>
  );
}
