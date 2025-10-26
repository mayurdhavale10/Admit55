import type { ProfileResume } from "@/src/modules/schemas/profileresumetool/types";
import keywordsCfg from "@/src/config/prompts/keywords.json";

export type KeywordsAnalysis = {
  track: string;
  coverage: number;
  present: string[];
  missing: string[];
  densityByRole: Record<string, number>;
};

type RoleItem = NonNullable<ProfileResume["roles"]>[number];

function roleIdOf(role: RoleItem, fallbackIndex: number): string {
  const base = (role.company ?? "role").trim().replace(/\s+/g, "-").toLowerCase();
  const start = (role.start ?? String(fallbackIndex)).trim().slice(0, 10);
  return `${base}-${start || fallbackIndex}`;
}

export function analyzeKeywords(pr: ProfileResume, track: string): KeywordsAnalysis {
  const cfg = (keywordsCfg as Record<string, string[]>)[track] ?? [];
  const want = cfg.map((s) => s.toLowerCase());
  const presentSet = new Set<string>();
  const densityByRole: Record<string, number> = {};

  (pr.roles ?? []).forEach((role, rIdx) => {
    const rid = roleIdOf(role, rIdx);
    const bullets = role.bullets ?? [];
    let hits = 0;

    bullets.forEach((b) => {
      const t = (b?.text ?? "").toLowerCase();
      let matched = false;
      for (const kw of want) {
        if (t.includes(kw)) {
          presentSet.add(kw);
          matched = true;
        }
      }
      if (matched) hits += 1;
    });

    densityByRole[rid] = bullets.length ? hits / bullets.length : 0;
  });

  const present = Array.from(presentSet);
  const missing = want.filter((w) => !presentSet.has(w));
  const coverage = want.length ? present.length / want.length : 0;

  return { track, coverage, present, missing, densityByRole };
}
