import type { ProfileResume } from "@/src/modules/schemas/profileresumetool/types";

export type ConsistencyIssue =
  | { type: "date_overlap"; roleIdA: string; roleIdB: string }
  | { type: "tense_vs_dates"; roleId: string; idx: number; expected: "past" | "present" }
  | { type: "claim_conflict"; roleId: string; idx: number; note: string };

export type ConsistencyAnalysis = {
  issues: ConsistencyIssue[];
};

type RoleItem = NonNullable<ProfileResume["roles"]>[number];

function roleIdOf(role: RoleItem, fallbackIndex: number): string {
  const base = (role.company ?? "role").trim().replace(/\s+/g, "-").toLowerCase();
  const start = (role.start ?? String(fallbackIndex)).trim().slice(0, 10);
  return `${base}-${start || fallbackIndex}`;
}

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function analyzeConsistency(pr: ProfileResume): ConsistencyAnalysis {
  const issues: ConsistencyIssue[] = [];
  const roles = pr.roles ?? [];

  // light overlap check
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

  // future: add tense_vs_dates using your verbs analysis; claim_conflict after numeric extraction cross-check
  return { issues };
}
