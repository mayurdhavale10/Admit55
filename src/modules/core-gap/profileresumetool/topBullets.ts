import type { MetricsAnalysis } from "@/src/modules/core-nlp/metrics";
import type { VerbsAnalysis } from "@/src/modules/core-nlp/verbs";
import type { LengthAnalysis } from "@/src/modules/core-nlp/length";
import type { KeywordsAnalysis } from "@/src/modules/core-nlp/keywords";

export type FixCandidate = {
  roleId: string;
  idx: number;
  score: number;              // higher = needs attention first
  reasons: string[];          // human-readable flags
};

export function pickTopBullets(input: {
  metrics: MetricsAnalysis;
  verbs: VerbsAnalysis;
  length: LengthAnalysis;
  keywords: KeywordsAnalysis;
}): FixCandidate[] {
  const { metrics, verbs, length, keywords } = input;

  // index helpers
  const mByKey = new Map<string, (typeof metrics.perBullet)[number]>();
  metrics.perBullet.forEach(b => mByKey.set(`${b.roleId}:${b.idx}`, b));

  const vByKey = new Map<string, (typeof verbs.perBullet)[number]>();
  verbs.perBullet.forEach(b => vByKey.set(`${b.roleId}:${b.idx}`, b));

  const lByKey = new Map<string, (typeof length.perBullet)[number]>();
  length.perBullet.forEach(b => lByKey.set(`${b.roleId}:${b.idx}`, b));

  const candidates: FixCandidate[] = [];

  // union of keys from length (covers all bullets); it’s okay if others miss some
  length.perBullet.forEach((b) => {
    const key = `${b.roleId}:${b.idx}`;
    const m = mByKey.get(key);
    const v = vByKey.get(key);

    let score = 0;
    const reasons: string[] = [];

    // heuristics (weights are tunable)
    if (!m?.hasNumber) { score += 3; reasons.push("no-metric"); }
    if (b.tooLong)     { score += 2; reasons.push("long>22"); }
    if (b.tooShort)    { score += 1; reasons.push("short<6"); }
    if (v?.passiveLikely) { score += 2; reasons.push("passive-voice"); }
    if (v && !v.actionVerb && !v.supportVerb) { score += 1; reasons.push("weak-verb"); }

    // keyword blend (prefer bullets that currently match none, to spread keywords elsewhere)
    // We can't attribute per-bullet keyword hits without heavier NLP, so nudge bullets
    // when overall coverage is low.
    if (keywords.coverage < 0.5) { score += 1; reasons.push("missing-keywords"); }

    if (score > 0) {
      candidates.push({ roleId: b.roleId, idx: b.idx, score, reasons });
    }
  });

  // sort by score desc, stable
  candidates.sort((a, b) => b.score - a.score || a.roleId.localeCompare(b.roleId) || a.idx - b.idx);
  return candidates.slice(0, 5);
}
