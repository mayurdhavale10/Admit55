// src/modules/schemas/profileresumetool/types.ts
import { z } from "zod";

/** Existing types you already had (keep): */
export type ProfileResume = {
  userId: string;
  basics?: Record<string, unknown>;
  education?: Array<Record<string, unknown>>;
  tests?: Record<string, unknown>;
  roles?: Array<{
    company?: string;
    title?: string;
    start?: string;
    end?: string;
    bullets?: Array<{ text: string }>;
  }>;
  stories?: Array<Record<string, unknown>>;
  goals?: Record<string, unknown>;
  updatedAt: Date;
};

export const ProfileResumeZ = z.object({
  userId: z.string(),
  // 👇 z.record now includes a key schema (z.string()) to satisfy Zod v4 classic
  basics: z.record(z.string(), z.unknown()).optional(),
  education: z.array(z.record(z.string(), z.unknown())).optional(),
  tests: z.record(z.string(), z.unknown()).optional(),
  roles: z
    .array(
      z.object({
        company: z.string().optional(),
        title: z.string().optional(),
        start: z.string().optional(),
        end: z.string().optional(),
        bullets: z.array(z.object({ text: z.string() })).optional(),
      })
    )
    .optional(),
  stories: z.array(z.record(z.string(), z.unknown())).optional(),
  goals: z.record(z.string(), z.unknown()).optional(),
  updatedAt: z.date(),
});

/** NEW: Normalized structures for LLM + heuristics */
export const NormalizedBulletZ = z.object({
  text: z.string(),
  metrics: z
    .object({
      pct: z.number().optional(),
      value: z.number().optional(),
      currency: z.string().optional(),
      multiple: z.number().optional(), // e.g., 2.3x
    })
    .optional(),
  scope: z
    .object({
      teamSize: z.number().optional(),
      budget: z.number().optional(),
      regions: z.array(z.string()).optional(),
    })
    .optional(),
});

export const NormalizedRoleZ = z.object({
  company: z.string().optional(),
  title: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  location: z.string().optional(),
  bullets: z.array(NormalizedBulletZ).default([]),
});

export const NormalizedEducationZ = z.object({
  school: z.string(),
  degree: z.string().optional(),
  discipline: z.string().optional(),
  tierHint: z.enum(["tier1", "tier2", "other"]).optional(),
});

export const NormalizedTestsZ = z.object({
  type: z.enum(["GMAT", "GRE"]).optional(),
  actual: z.number().optional(),
  target: z.number().optional(),
  descriptor: z.string().optional(),
});

export const NormalizedExtracurricularZ = z.object({
  text: z.string(),
  leadership: z.boolean().optional(),
  recency: z.enum(["past", "current"]).optional(),
});

export const NormalizedInternationalZ = z.object({
  regions: z.array(z.string()).optional(),
  months: z.number().optional(),
  evidence: z.array(z.string()).optional(),
});

export const NormalizedProfileZ = z.object({
  education: z.array(NormalizedEducationZ).default([]),
  roles: z.array(NormalizedRoleZ).default([]),
  tests: NormalizedTestsZ.optional(),
  extracurriculars: z.array(NormalizedExtracurricularZ).default([]),
  international: NormalizedInternationalZ.optional(),
  awards: z.array(z.string()).optional(),
});
export type NormalizedProfile = z.infer<typeof NormalizedProfileZ>;

/** Provenance + Signals */
export const ParseProvenanceZ = z.object({
  method: z.enum(["llm", "heuristic", "mixed"]),
  confidence: z.number().min(0).max(1),
  model: z.string().optional(),
  latencyMs: z.number().optional(),
});
export type ParseProvenance = z.infer<typeof ParseProvenanceZ>;

export const SignalBundleZ = z.object({
  academics: z.object({
    tier1: z.boolean().default(false),
    rigorousDegree: z.boolean().default(false),
  }),
  test: z.object({
    actual: z.number().optional(),
    target: z.number().optional(),
    descriptor: z.string().optional(),
    providedAsTargetOnly: z.boolean().default(false),
  }),
  impact: z.object({
    anyPct20Plus: z.boolean().default(false),
    anyLargeMoney: z.boolean().default(false),
    launchesCount: z.number().default(0),
  }),
  leadership: z.object({
    crossFunctional: z.boolean().default(false),
    ledBand: z
      .enum(["none_ic", "informal", "led_1_3", "led_4_10", "led_10_plus"])
      .default("informal"),
    execOffice: z.boolean().default(false),
  }),
  ec: z.object({
    hasCurrent: z.boolean().default(false),
    leadership: z.boolean().default(false),
  }),
  intl: z.object({
    regionsCount: z.number().default(0),
    months: z.number().default(0),
  }),
  meta: z.object({
    yoeBand: z.string().optional(),
    functionArea: z.string().optional(),
  }),
  provenance: ParseProvenanceZ,
});
export type SignalBundle = z.infer<typeof SignalBundleZ>;
