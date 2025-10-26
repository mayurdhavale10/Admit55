// src/modules/schemas/profileresumetool/evaluation.ts
import { z } from "zod";
import {
  DIMENSION_IDS,
  GAP_IDS,
  PERSONA_KEYS,
} from "../../core-gap/profileresumetool/constants";

/** ---- Enums derived from literal ID arrays (safe with Zod v4) ---- */
export const DimensionIdZ = z.enum(DIMENSION_IDS);
export const GapIdZ = z.enum(GAP_IDS);
export const PersonaKeyZ = z.enum(PERSONA_KEYS);

/** ---- Small value enums ---- */
export const SeverityZ = z.enum(["low", "medium", "high"]);
export const EffortZ = z.enum(["S", "M", "L"]);
export const BandZ = z.enum(["Strong", "Competitive", "Stretch", "Not Yet"]);

/** ---- Dimension score ---- */
export const DimensionScoreZ = z.object({
  id: DimensionIdZ,
  score: z.number().min(0).max(5),
  // evidence items can be short quotes OR pointers like "roleId:bulletIdx:start-end"
  evidence: z.array(z.string()).default([]),
});

/** ---- Remedies shown for each gap ---- */
export const RemedyZ = z.object({
  action: z.string(),
  effort: EffortZ,
  proof: z.array(z.string()).default([]),
});

/** ---- Gap item ---- */
export const GapZ = z.object({
  id: GapIdZ,
  dimension: DimensionIdZ,
  severity: SeverityZ,
  title: z.string(),
  evidence: z.array(z.string()).default([]),
  remedies: z.array(RemedyZ).default([]),
  // operational fields to help users plan fixes
  etaWeeks: z.number().int().min(0).default(1),
  // expected lift in readiness points if this gap is addressed
  deltaPoints: z.number().min(0).max(20).default(0),
});

/** ---- Trace/debug info (non-PII metrics) ---- */
export const TraceZ = z.object({
  rulesApplied: z.array(z.string()).default([]),
  // Zod v4 "classic" expects key + value types here:
  extraction: z.record(z.string(), z.any()).default({})
  // alternatively: z.object({}).catchall(z.any()).default({})
});

/** ---- Top-level evaluation output contract ---- */
export const EvaluationOutputZ = z.object({
  version: z.string(),                // e.g., "eval-1.0.0"
  persona: PersonaKeyZ,               // one of your persona keys
  readiness: z.object({
    score: z.number().min(0).max(100),
    band: BandZ,
  }),
  dimensions: z.array(DimensionScoreZ),
  gaps: z.array(GapZ),
  trace: TraceZ,
});

/** ---- TypeScript types (inferred from the schemas) ---- */
export type DimensionId = z.infer<typeof DimensionIdZ>;
export type GapId = z.infer<typeof GapIdZ>;
export type PersonaKey = z.infer<typeof PersonaKeyZ>;

export type Severity = z.infer<typeof SeverityZ>;
export type Effort = z.infer<typeof EffortZ>;
export type Band = z.infer<typeof BandZ>;

export type DimensionScore = z.infer<typeof DimensionScoreZ>;
export type Remedy = z.infer<typeof RemedyZ>;
export type Gap = z.infer<typeof GapZ>;
export type Trace = z.infer<typeof TraceZ>;
export type EvaluationOutput = z.infer<typeof EvaluationOutputZ>;
