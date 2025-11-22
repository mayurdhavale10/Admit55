// src/modules/heuristics/profileresumetool/content/patterns/detectors/metrics.ts
// 🎯 PURPOSE: Detect and quantify numeric, financial, and performance metrics from resume text.
// Used to measure impact density (how data-driven a candidate’s experience is).

import type { ProfileResume } from "@/src/modules/schemas/profileresumetool/types";

/** Supported metric units */
export type MetricUnit = "%" | "currency" | "count" | "time" | "ratio" | "unknown";

/** Bullet-level metric signal */
export type BulletMetricSignal = {
  roleId: string;               // Role identifier (company + start date)
  idx: number;                  // Bullet index
  hasNumber: boolean;           // True if any numeric data present
  units: MetricUnit[];          // Detected metric types (%, $, time, etc.)
  hasDelta: boolean;            // True if performance change ("+20%", "from X to Y") found
  spans?: [number, number][];   // Reserved for numeric span indices (future use)
};

/** Aggregated metric statistics */
export type MetricsAnalysis = {
  perBullet: BulletMetricSignal[];
  densityByRole: Record<string, number>; // % of quantified bullets per role
  overallDensity: number;                // % of quantified bullets overall
};

type RoleItem = NonNullable<ProfileResume["roles"]>[number];

/** 🔠 Consistent unique role ID generator */
function roleIdOf(role: RoleItem, fallbackIndex: number): string {
  const base = (role.company ?? "role").trim().replace(/\s+/g, "-").toLowerCase();
  const start = (role.start ?? String(fallbackIndex)).trim().slice(0, 10);
  return `${base}-${start || fallbackIndex}`;
}

/**
 * 💱 Detects the types of numeric units within a bullet.
 * Handles % changes, currency, raw counts, time expressions, and ratios.
 */
function detectUnits(text: string): MetricUnit[] {
  const t = text.toLowerCase();
  const units: MetricUnit[] = [];

  if (/%/.test(t)) units.push("%"); // Percentages
  if (/(₹|\$|eur|usd|inr|sgd|gbp|€|£|aed|cad|aud|jpy|¥|hkd|₩|₽|₺|₦|₴|₪|฿|₫|₱|million|billion|crore|lakh)/i.test(t))
    units.push("currency"); // Currency formats
  if (/\b\d{1,3}(,\d{3})+\b|\b\d+\b/.test(t)) units.push("count"); // Numbers (e.g., 1,000 / 200)
  if (/\b(day|days|week|weeks|month|months|quarter|year|years|hrs?|hours?|minutes?)\b/i.test(t))
    units.push("time"); // Time-based metrics
  if (/\b\d+:\d+\b/.test(t)) units.push("ratio"); // Ratio-like metrics (e.g., 3:1)

  return Array.from(new Set(units.length ? units : ["unknown"]));
}

/**
 * 📈 Detects "delta" signals — words showing growth/change over time.
 * Examples: "increased by", "from X to Y", "+20%", "down 15%".
 */
function detectDelta(text: string): boolean {
  const t = text.toLowerCase();
  return /(from .* to )|(increas(ed|e)? by)|(decreas(ed|e)? by)|(\bup\b|\bdown\b)|(\+\d+%|-\d+%)/i.test(t);
}

/**
 * 🚀 Analyzes all roles to measure quantitative impact density.
 * Returns per-bullet metric info + per-role + overall density scores.
 */
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

    densityByRole[rid] = bullets.length ? Number((roleHas / bullets.length).toFixed(2)) : 0;
    bulletsWithNumbers += roleHas;
  });

  const overallDensity = totalBullets ? Number((bulletsWithNumbers / totalBullets).toFixed(2)) : 0;

  return { perBullet, densityByRole, overallDensity };
}

/** 🧪 Local Test (Run via ts-node for verification) */
if (require.main === module) {
  const mock: ProfileResume = {
    roles: [
      {
        company: "Cogniv.ai",
        start: "2023-01",
        end: "2024-06",
        bullets: [
          { text: "Increased conversion rate by 27% and revenue from $200K to $400K YoY." },
          { text: "Reduced processing time by 30 hours weekly through automation." },
          { text: "Launched pilot in 3 countries with 200+ users and 98% uptime." },
          { text: "Managed 5 interns to deliver 10+ client projects." }
        ]
      }
    ]
  } as any;

  console.log(analyzeMetrics(mock));
}

export default analyzeMetrics;
