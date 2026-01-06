import Link from "next/link";
import type { QuotaStatusResponse } from "@src/lib/db/usage/getQuotaStatus";

type Props = {
  quota: QuotaStatusResponse | null;
};

/**
 * ✅ Choose ONE provider to represent "AI Runs Left"
 * Change this if your tools use a different provider.
 */
const PRIMARY_PROVIDER: "groq" | "openai" | "ollama" = "groq";

function pickPrimary(quota: QuotaStatusResponse) {
  const preferred = quota.providers.find((p) => p.provider === PRIMARY_PROVIDER);
  if (preferred) return preferred;
  // fallback: first provider row
  return quota.providers[0];
}

function isPrivileged(quota: QuotaStatusResponse) {
  const role = quota.role ?? "user";
  const plan = quota.plan ?? "free";
  return role === "admin" || plan === "pro";
}

function asText(x: number | "inf") {
  return x === "inf" ? "∞" : String(x);
}

function asNumber(x: number | "inf") {
  return x === "inf" ? null : x;
}

export default function QuotaCard({ quota }: Props) {
  if (!quota) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-slate-900 font-semibold">Usage</div>
        <div className="mt-1 text-sm text-slate-600">Quota status unavailable right now.</div>
      </div>
    );
  }

  const privileged = isPrivileged(quota);
  const plan = quota.plan ?? "free";
  const role = quota.role ?? "user";

  const primary = pickPrimary(quota);
  const remaining = primary.remaining;
  const limit = primary.limit;

  const remN = asNumber(remaining);
  const limN = asNumber(limit);

  const showUpgrade = !privileged && remN !== null && remN <= 1;

  // progress bar (how many remaining out of limit)
  const pct =
    limN === null
      ? 100
      : Math.max(0, Math.min(100, Math.round((Math.max(0, remN ?? 0) / limN) * 100)));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Current Plan card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600">Current Plan</p>
            <h3 className="mt-2 text-3xl font-extrabold text-slate-900">
              {plan === "pro" || role === "admin" ? "Pro" : "Free"}
            </h3>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-lg">⚡</div>
        </div>

        {!privileged && (
          <Link
            href="/upgradetopro?from=%2Fprofile"
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition"
          >
            Upgrade to Pro →
          </Link>
        )}

        <div className="mt-4 text-xs text-slate-500">
          Role: <span className="font-semibold text-slate-700">{role}</span>
        </div>
      </div>

      {/* AI Runs Left card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600">AI Runs Left</p>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-3xl font-extrabold text-slate-900">
                {asText(remaining)}
              </div>
              <div className="pb-1 text-sm text-slate-500">/ {asText(limit)}</div>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-lg">✨</div>
        </div>

        <div className="mt-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>

        {showUpgrade ? (
          <div className="mt-3 text-sm text-amber-700">
            Running low?{" "}
            <Link href="/upgradetopro?from=%2Fprofile" className="font-semibold underline">
              Upgrade to Pro
            </Link>{" "}
            to continue using AI tools.
          </div>
        ) : (
          <div className="mt-3 text-sm text-slate-600">
            {/* keep simple like your screenshot */}
            {privileged ? "Unlimited access enabled." : "Keep an eye on your remaining runs."}
          </div>
        )}

        <div className="mt-3 text-xs text-slate-500">
          Updated: {new Date(quota.asOf).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
