// src/modules/heuristics/profileresumetool/content/patterns/detectors/dedupe.ts
// Detects redundant or repeated content — often found when candidates paste the same “responsibilities” across roles.

import type { ProfileResume } from "@src/modules/schemas/profileresumetool/types";

export type DuplicatePair = {
  a: { roleId: string; idx: number };
  b: { roleId: string; idx: number };
  similarity: number;
};

export type DedupeAnalysis = {
  duplicates: DuplicatePair[];
  summary: {
    total: number;
    avgSimilarity: number;
    withinRole: number;
    crossRole: number;
  };
};

type RoleItem = NonNullable<ProfileResume["roles"]>[number];

/** 🔧 Generate stable role ID */
function roleIdOf(role: RoleItem, fallbackIndex: number): string {
  const base = (role.company ?? "role").trim().replace(/\s+/g, "-").toLowerCase();
  const start = (role.start ?? String(fallbackIndex)).trim().slice(0, 10);
  return `${base}-${start || fallbackIndex}`;
}

/** 🔧 Normalize bullet text */
function normalizeText(t: string): string {
  return t
    .toLowerCase()
    .replace(/responsible for|worked on|helped|assisted|contributed to|involved in/g, "")
    .replace(/[.,;:!?"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 🔧 Jaccard similarity (word-set overlap) */
function jaccard(a: string, b: string): number {
  const A = new Set(a.split(/\W+/).filter(Boolean));
  const B = new Set(b.split(/\W+/).filter(Boolean));
  if (!A.size && !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

/** 🔧 Optional n-gram similarity (extra signal) */
function ngramSimilarity(a: string, b: string, n = 3): number {
  const getNgrams = (s: string) =>
    new Set(Array.from({ length: Math.max(0, s.length - n + 1) }, (_, i) => s.slice(i, i + n)));
  const A = getNgrams(a);
  const B = getNgrams(b);
  if (!A.size && !B.size) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

/** 🔧 Combined hybrid similarity metric */
function hybridSimilarity(a: string, b: string): number {
  const j = jaccard(a, b);
  const n = ngramSimilarity(a, b);
  return (0.7 * j + 0.3 * n);
}

/** 🧠 Main analysis */
export function analyzeDuplicates(pr: ProfileResume): DedupeAnalysis {
  const roles = pr.roles ?? [];
  const HIGH_THRESHOLD = 0.85;
  const MED_THRESHOLD = 0.7;

  const items: { roleId: string; idx: number; text: string }[] = [];

  // Flatten all bullets
  roles.forEach((role, rIdx) => {
    const rid = roleIdOf(role, rIdx);
    (role.bullets ?? []).forEach((b, i) => {
      const text = typeof b === "string" ? b : b?.text ?? "";
      if (text.trim()) items.push({ roleId: rid, idx: i, text: normalizeText(text) });
    });
  });

  const duplicates: DuplicatePair[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const sim = hybridSimilarity(items[i].text, items[j].text);
      if (sim >= HIGH_THRESHOLD) {
        const key = [items[i].roleId, items[i].idx, items[j].roleId, items[j].idx].sort().join("-");
        if (seen.has(key)) continue;
        seen.add(key);

        duplicates.push({
          a: { roleId: items[i].roleId, idx: items[i].idx },
          b: { roleId: items[j].roleId, idx: items[j].idx },
          similarity: Number(sim.toFixed(2))
        });
      }
    }
  }

  const withinRole = duplicates.filter(d => d.a.roleId === d.b.roleId).length;
  const crossRole = duplicates.length - withinRole;
  const avgSimilarity =
    duplicates.length > 0
      ? Number(
          (duplicates.reduce((sum, d) => sum + d.similarity, 0) / duplicates.length).toFixed(2)
        )
      : 0;

  return {
    duplicates,
    summary: {
      total: duplicates.length,
      avgSimilarity,
      withinRole,
      crossRole
    }
  };
}

/** 🧪 Quick test (dev only) */
if (require.main === module) {
  const sample: ProfileResume = {
    roles: [
      {
        company: "Google",
        start: "2020-01-01",
        bullets: [
          { text: "Led a team of 5 engineers to develop internal tools" },
          { text: "Responsible for leading a team of five engineers building internal tools" },
          { text: "Built dashboards for analytics" }
        ]
      },
      {
        company: "Amazon",
        start: "2021-06-01",
        bullets: ["Developed dashboards for analytics tracking KPIs"]
      }
    ]
  } as any;

  console.log(JSON.stringify(analyzeDuplicates(sample), null, 2));
}

export default analyzeDuplicates;
