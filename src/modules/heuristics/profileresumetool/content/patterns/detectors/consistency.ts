// src/modules/heuristics/profileresumetool/content/patterns/detectors/consistency.ts
// Catches logical inconsistencies in a candidate’s career history — overlaps, tense mismatches, or contradictory claims.

import type { ProfileResume } from "@src/modules/schemas/profileresumetool/types";

export type ConsistencyIssue =
  | { type: "date_overlap"; roleIdA: string; roleIdB: string }
  | { type: "tense_vs_dates"; roleId: string; idx: number; expected: "past" | "present" }
  | { type: "claim_conflict"; roleId: string; idx: number; note: string };

export type ConsistencyAnalysis = {
  issues: ConsistencyIssue[];
  summary: {
    total: number;
    overlaps: number;
    tense: number;
    claims: number;
  };
};

type RoleItem = NonNullable<ProfileResume["roles"]>[number];

function roleIdOf(role: RoleItem, fallbackIndex: number): string {
  const base = (role.company ?? "role").trim().replace(/\s+/g, "-").toLowerCase();
  const start = (role.start ?? String(fallbackIndex)).trim().slice(0, 10);
  return `${base}-${start || fallbackIndex}`;
}

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const normalized = s.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, "$3-$2-$1");
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

function detectTense(text: string): "past" | "present" | "neutral" {
  const t = text.toLowerCase();
  if (/\b(led|managed|delivered|achieved|built|created|spearheaded|owned)\b/.test(t)) return "past";
  if (/\b(leading|managing|delivering|building|creating|owning)\b/.test(t)) return "present";
  return "neutral";
}

function extractNumbers(text: string): number[] {
  const matches = text.match(/\b\d{1,4}\b/g);
  return matches ? matches.map(n => Number(n)) : [];
}

export function analyzeConsistency(pr: ProfileResume): ConsistencyAnalysis {
  const issues: ConsistencyIssue[] = [];
  const roles = pr.roles ?? [];

  // ---- 1️⃣ Date Overlap Detection
  for (let i = 0; i < roles.length; i++) {
    for (let j = i + 1; j < roles.length; j++) {
      const aStart = parseDate(roles[i].start);
      const aEnd = parseDate(roles[i].end) ?? new Date();
      const bStart = parseDate(roles[j].start);
      const bEnd = parseDate(roles[j].end) ?? new Date();

      if (aStart && bStart) {
        const overlap = aStart <= bEnd && bStart <= aEnd;
        if (overlap) {
          const ra = roleIdOf(roles[i], i);
          const rb = roleIdOf(roles[j], j);
          issues.push({ type: "date_overlap", roleIdA: ra, roleIdB: rb });
        }
      }
    }
  }

  // ---- 2️⃣ Tense vs Date Consistency
  for (let i = 0; i < roles.length; i++) {
    const r = roles[i];
    const rid = roleIdOf(r, i);
    const end = parseDate(r.end);
    const isCurrent = !end || end > new Date();

    (r.bullets ?? []).forEach((b, idx) => {
      const text = typeof b === "string" ? b : b?.text ?? "";  // 🔧 FIX 1
      const tense = detectTense(text);                         // 🔧 FIX 2
      if (isCurrent && tense === "past") {
        issues.push({ type: "tense_vs_dates", roleId: rid, idx, expected: "present" });
      } else if (!isCurrent && tense === "present") {
        issues.push({ type: "tense_vs_dates", roleId: rid, idx, expected: "past" });
      }
    });
  }

  // ---- 3️⃣ Claim Conflict Detection
  for (let i = 0; i < roles.length; i++) {
    const r = roles[i];
    const rid = roleIdOf(r, i);
    const nums = (r.bullets ?? [])
      .map(b => extractNumbers(typeof b === "string" ? b : b?.text ?? ""))  // 🔧 FIX 3
      .flat();

    if (nums.length >= 2) {
      const max = Math.max(...nums);
      const min = Math.min(...nums);
      if (max >= 10 * min && min > 0) {
        issues.push({
          type: "claim_conflict",
          roleId: rid,
          idx: -1,
          note: `Possible numeric inconsistency (${min} vs ${max})`
        });
      }
    }
  }

  const summary = {
    total: issues.length,
    overlaps: issues.filter(i => i.type === "date_overlap").length,
    tense: issues.filter(i => i.type === "tense_vs_dates").length,
    claims: issues.filter(i => i.type === "claim_conflict").length
  };

  return { issues, summary };
}

if (require.main === module) {
  const sample: ProfileResume = {
    roles: [
      {
        company: "Google",
        start: "2020-01-01",
        end: "2023-01-01",
        bullets: [{ text: "Leading a team of 10 engineers" }, { text: "Built analytics dashboards" }]
      },
      {
        company: "Amazon",
        start: "2022-06-01",
        bullets: ["Led project with 5 analysts"]
      }
    ]
  } as any;

  console.log(JSON.stringify(analyzeConsistency(sample), null, 2));
}

export default analyzeConsistency;
