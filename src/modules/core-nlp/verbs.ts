import type { ProfileResume } from "@/src/modules/schemas/profileresumetool/types";
import verbsCfg from "@/src/config/prompts/verbs.json";

export type BulletVerbSignal = {
  roleId: string;
  idx: number;
  actionVerb: boolean;
  supportVerb: boolean;
  passiveLikely: boolean;
  tense: "past" | "present" | "mixed" | "unknown";
};

export type VerbsAnalysis = {
  perBullet: BulletVerbSignal[];
  passiveRatioByRole: Record<string, number>;
  tenseMismatches: { roleId: string; idx: number; expected: "past" | "present" }[];
};

type RoleItem = NonNullable<ProfileResume["roles"]>[number];

function roleIdOf(role: RoleItem, fallbackIndex: number): string {
  const base = (role.company ?? "role").trim().replace(/\s+/g, "-").toLowerCase();
  const start = (role.start ?? String(fallbackIndex)).trim().slice(0, 10);
  return `${base}-${start || fallbackIndex}`;
}

function startsWithAny(text: string, verbs: string[]): boolean {
  const t = text.toLowerCase().trim();
  return verbs.some((v) => t.startsWith(v + " ") || t === v);
}

function passiveHeuristic(text: string): boolean {
  const t = text.toLowerCase();
  return /\b(was|were|been|being|is|are)\b.*\bby\b/.test(t) || (verbsCfg.passivePatterns ?? []).some((p) => t.includes(p));
}

function guessTense(text: string): "past" | "present" | "mixed" | "unknown" {
  const t = text.toLowerCase();
  const hasPast = /\b(led|owned|drove|launched|built|created|designed|delivered|reduced|increased|improved|executed|managed|implemented|developed|scaled|optimized|negotiated)\b/.test(
    t
  );
  const hasPresent = /\b(lead|own|drive|launch|build|create|design|deliver|reduce|increase|improve|execute|manage|implement|develop|scale|optimize|negotiate)\b/.test(
    t
  );
  if (hasPast && hasPresent) return "mixed";
  if (hasPast) return "past";
  if (hasPresent) return "present";
  return "unknown";
}

export function analyzeVerbs(pr: ProfileResume): VerbsAnalysis {
  const perBullet: BulletVerbSignal[] = [];
  const passiveRatioByRole: Record<string, number> = {};
  const tenseMismatches: { roleId: string; idx: number; expected: "past" | "present" }[] = [];

  (pr.roles ?? []).forEach((role, rIdx) => {
    const rid = roleIdOf(role, rIdx);
    const bullets = role.bullets ?? [];
    let passiveCount = 0;

    bullets.forEach((b, idx) => {
      const text = (b?.text ?? "").trim();
      const actionVerb = startsWithAny(text, verbsCfg.actionVerbs ?? []);
      const supportVerb = startsWithAny(text, verbsCfg.supportVerbs ?? []);
      const passiveLikely = passiveHeuristic(text);
      const tense = guessTense(text);

      if (passiveLikely) passiveCount += 1;

      const expected: "past" | "present" | undefined = role.end ? "past" : undefined;
      if (expected && tense !== expected && tense !== "unknown") {
        tenseMismatches.push({ roleId: rid, idx, expected });
      }

      perBullet.push({ roleId: rid, idx, actionVerb, supportVerb, passiveLikely, tense });
    });

    passiveRatioByRole[rid] = bullets.length ? passiveCount / bullets.length : 0;
  });

  return { perBullet, passiveRatioByRole, tenseMismatches };
}
