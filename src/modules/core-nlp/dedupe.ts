import type { ProfileResume } from "@/src/modules/schemas/profileresumetool/types";

export type DuplicatePair = {
  a: { roleId: string; idx: number };
  b: { roleId: string; idx: number };
  similarity: number;
};

export type DedupeAnalysis = {
  duplicates: DuplicatePair[];
};

type RoleItem = NonNullable<ProfileResume["roles"]>[number];

function roleIdOf(role: RoleItem, fallbackIndex: number): string {
  const base = (role.company ?? "role").trim().replace(/\s+/g, "-").toLowerCase();
  const start = (role.start ?? String(fallbackIndex)).trim().slice(0, 10);
  return `${base}-${start || fallbackIndex}`;
}

// simple Jaccard similarity over word sets
function jaccard(a: string, b: string): number {
  const A = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const B = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (!A.size && !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

export function analyzeDuplicates(pr: ProfileResume): DedupeAnalysis {
  const items: { roleId: string; idx: number; text: string }[] = [];
  (pr.roles ?? []).forEach((role, rIdx) => {
    const rid = roleIdOf(role, rIdx);
    (role.bullets ?? []).forEach((b, i) => items.push({ roleId: rid, idx: i, text: b?.text ?? "" }));
  });

  const duplicates: DuplicatePair[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const sim = jaccard(items[i].text, items[j].text);
      if (sim >= 0.85) {
        duplicates.push({
          a: { roleId: items[i].roleId, idx: items[i].idx },
          b: { roleId: items[j].roleId, idx: items[j].idx },
          similarity: Number(sim.toFixed(2)),
        });
      }
    }
  }
  return { duplicates };
}
