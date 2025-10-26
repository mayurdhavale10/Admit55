import { BandZ, type Band, type DimensionScore } from "@/src/modules/schemas/profileresumetool/evaluation";
import { DIMENSION_IDS, EVAL_VERSION, PERSONA_KEYS, PERSONA_WEIGHTS, type PersonaKey } from "./constants";
import type { MetricsAnalysis } from "@/src/modules/core-nlp/metrics";
import type { VerbsAnalysis } from "@/src/modules/core-nlp/verbs";
import type { LengthAnalysis } from "@/src/modules/core-nlp/length";
import type { KeywordsAnalysis } from "@/src/modules/core-nlp/keywords";
import type { DedupeAnalysis } from "@/src/modules/core-nlp/dedupe";
import type { ConsistencyAnalysis } from "@/src/modules/core-nlp/consistency";

/** Inputs collected from analyzers */
export type ScoringInputs = {
  persona: PersonaKey;
  metrics: MetricsAnalysis;
  verbs: VerbsAnalysis;
  length: LengthAnalysis;
  keywords: KeywordsAnalysis;
  dedupe: DedupeAnalysis;
  consistency: ConsistencyAnalysis;
};

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

/** Map 0..1 density to 0..5 */
function densityToScore(d: number): number {
  // 0.2 → 1, 0.5 → 3, 0.8+ → 5 (smooth-ish)
  const x = clamp(d, 0, 1);
  if (x >= 0.85) return 5;
  if (x >= 0.7) return 4;
  if (x >= 0.5) return 3;
  if (x >= 0.3) return 2;
  return x > 0 ? 1 : 0;
}

function penaltyToScore(p: number): number {
  // p = share of bad things (0..1). 0 → 5 ; 0.5 → 2 ; 0.8 → 1 ; 1 → 0
  const x = clamp(p, 0, 1);
  if (x <= 0.1) return 5;
  if (x <= 0.2) return 4;
  if (x <= 0.35) return 3;
  if (x <= 0.5) return 2;
  return 1;
}

function bandFromScore(score: number): Band {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Competitive";
  if (score >= 55) return "Stretch";
  return "Not Yet";
}

export function scoreDimensions(input: ScoringInputs): {
  version: string;
  dimensions: DimensionScore[];
  readiness: { score: number; band: Band };
} {
  const { persona, metrics, verbs, length, keywords, consistency } = input;

  // D01 Quant Evidence → metrics.overallDensity
  const d01 = densityToScore(metrics.overallDensity);

  // D09 Communication → length.longShare (penalty), passiveRatio avg (penalty)
  const passiveVals = Object.values(verbs.passiveRatioByRole);
  const passiveAvg = passiveVals.length ? passiveVals.reduce((a, b) => a + b, 0) / passiveVals.length : 0;
  const commPenalty = clamp((length.longShare + passiveAvg) / 2, 0, 1);
  const d09 = penaltyToScore(commPenalty);

  // D06 Industry Depth → keywords.coverage
  const d06 = densityToScore(keywords.coverage);

  // D03 Leadership (placeholder heuristic): lower passive + has numbers → higher
  const d03 = clamp(Math.round((densityToScore(1 - passiveAvg) + d01) / 2), 0, 5);

  // D04 Progression (placeholder): penalize if date overlaps exist
  const hasOverlap = (consistency.issues ?? []).some(i => i.type === "date_overlap");
  const d04 = hasOverlap ? 2 : 3; // neutral-ish until we add real progression calc

  // Fill remaining with neutral baselines (2–3) for now
  // Order must match your DIMENSION_IDS
  const baseline: Record<string, number> = {
    D01_quant: d01,
    D02_impact: 3,
    D03_leadership: d03,
    D04_progression: d04,
    D05_initiative: 3,
    D06_industrydepth: d06,
    D07_international: 2,
    D08_community: 2,
    D09_communication: d09,
    D10_goals: 3,
    D11_schoolfit: 3,
    D12_recommenders: 3,
  };

  const dimensions: DimensionScore[] = DIMENSION_IDS.map(id => ({
    id,
    score: clamp(baseline[id] ?? 3, 0, 5),
    evidence: [] // add references later if you want to surface key signals per dimension
  }));

  // Persona-weighted aggregate 0..100
  const weights = PERSONA_WEIGHTS[persona];
  const maxPerDim = 5;
  let weighted = 0;
  let weightSum = 0;
  for (const d of dimensions) {
    const w = weights[d.id];
    weighted += (d.score / maxPerDim) * w;
    weightSum += w;
  }
  const total = weightSum > 0 ? Math.round((weighted / weightSum) * 100) : 0;
  const band = bandFromScore(total);

  return {
    version: EVAL_VERSION,
    dimensions,
    readiness: { score: total, band }
  };
}
