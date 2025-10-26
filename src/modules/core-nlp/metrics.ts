import type { ProfileResume } from "@/src/modules/schemas/profileresumetool/types";

export type MetricUnit = "%" | "currency" | "count" | "time" | "ratio" | "unknown";
export type BulletMetricSignal = {
  roleId: string;
  idx: number;
  hasNumber: boolean;
  units: MetricUnit[];
  hasDelta: boolean;
  spans?: [number, number][];
};

export type MetricsAnalysis = {
  perBullet: BulletMetricSignal[];
  densityByRole: Record<string, number>;
  overallDensity: number;
};

type RoleItem = NonNullable<ProfileResume["roles"]>[number];

function roleIdOf(role: RoleItem, fallbackIndex: number): string {
  const base = (role.company ?? "role").trim().replace(/\s+/g, "-").toLowerCase();
  const start = (role.start ?? String(fallbackIndex)).trim().slice(0, 10);
  return `${base}-${start || fallbackIndex}`;
}

function detectUnits(text: string): MetricUnit[] {
  const t = text.toLowerCase();
  const units: MetricUnit[] = [];
  if (/%/.test(t)) units.push("%");
  if (/(₹|\$|eur|usd|inr|crore|lakh|million|billion)/i.test(t)) units.push("currency");
  if (/\b\d{1,3}(,\d{3})+\b|\b\d+\b/.test(t)) units.push("count");
  if (/\b(day|days|week|weeks|month|months|quarter|year|years|hrs?|hours?)\b/i.test(t)) units.push("time");
  if (/\b\d+:\d+\b/.test(t)) units.push("ratio");
  return Array.from(new Set(units));
}

function detectDelta(text: string): boolean {
  const t = text.toLowerCase();
  return /(from .* to )|(increase(d)? by)|(decrease(d)? by)|(\bup\b|\bdown\b)|(\+\d+%|-\d+%)/i.test(t);
}

export function analyzeMetrics(pr: ProfileResume): MetricsAnalysis {
  const perBullet: BulletMetricSignal[] = [];
  const densityByRole: Record<string, number> = {};
  let bulletsWithNumbers = 0;
  let totalBullets = 0;

  (pr.roles ?? []).forEach((role, rIdx) => {
    const rid = roleIdOf(role, rIdx);
    const bullets = role.bullets ?? [];
    let roleHas = 0;

    bullets.forEach((b, idx) => {
      const text = (b?.text ?? "").trim();
      const hasNumber = /\d/.test(text);
      const units = hasNumber ? detectUnits(text) : [];
      const hasDelta = hasNumber ? detectDelta(text) : false;
      perBullet.push({ roleId: rid, idx, hasNumber, units, hasDelta });
      totalBullets += 1;
      if (hasNumber) roleHas += 1;
    });

    densityByRole[rid] = bullets.length ? roleHas / bullets.length : 0;
    bulletsWithNumbers += roleHas;
  });

  const overallDensity = totalBullets ? bulletsWithNumbers / totalBullets : 0;
  return { perBullet, densityByRole, overallDensity };
}
