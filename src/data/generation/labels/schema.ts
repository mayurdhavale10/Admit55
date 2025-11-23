// src/data/generation/labels/schema.ts
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                               ENUM DEFINITIONS                             */
/* -------------------------------------------------------------------------- */

export const TierEnum = z.enum([
  "tier1_elite",
  "tier2_mid",
  "tier3_regular",
  "nontraditional",
  "international",
  "edge_noise",
]);
export type Tier = z.infer<typeof TierEnum>;

export const RoleLevelEnum = z.enum([
  "intern",
  "junior",
  "associate",
  "senior",
  "lead",
  "manager",
  "director",
  "vp",
  "cxo",
]);
export type RoleLevel = z.infer<typeof RoleLevelEnum>;

/* ISO uppercase helper */
const ISO = z.string().min(2).transform(s => s.toUpperCase());

/* -------------------------------------------------------------------------- */
/*                          ACADEMIC TEST SCORE SCHEMA                        */
/* -------------------------------------------------------------------------- */

export const TestScoreSchema = z
  .object({
    /** Global exams */
    gmat: z.coerce.number().int().min(200).max(800).optional(),
    gre: z
      .object({
        v: z.coerce.number().int().min(130).max(170).optional(),
        q: z.coerce.number().int().min(130).max(170).optional(),
        w: z.coerce.number().min(0).max(6).optional(),
      })
      .strict()
      .optional(),

    /** Indian MBA exams */
    cat: z.coerce.number().min(0).max(100).optional(),
    xat: z.coerce.number().min(0).max(100).optional(),
    nmat: z.coerce.number().min(0).max(360).optional(),
    snap: z.coerce.number().min(0).max(60).optional(),
    cmat: z.coerce.number().min(0).max(400).optional(),
    mat: z.coerce.number().min(200).max(800).optional(),
    atma: z.coerce.number().min(0).max(100).optional(),
    mah_cet: z.coerce.number().min(0).max(200).optional(),
    tancet: z.coerce.number().min(0).max(100).optional(),
    tsicet: z.coerce.number().min(0).max(200).optional(),
    apicet: z.coerce.number().min(0).max(200).optional(),
    ibsat: z.coerce.number().min(0).max(100).optional(),
    micat: z.coerce.number().min(0).max(50).optional(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                              FULL ACADEMICS                                */
/* -------------------------------------------------------------------------- */

export const AcademicsSchema = z
  .object({
    ug_tier: z.coerce.number().int().min(1).max(4),
    ug_institution: z.string().min(1),
    pg_institution: z.string().optional(),
    test_scores: TestScoreSchema.optional(), // optional object
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                             CAREER SUB-SCHEMA                              */
/* -------------------------------------------------------------------------- */

export const CareerTransitionSchema = z
  .object({
    from_role: z.string().min(1),
    to_role: z.string().min(1),
  })
  .strict();

export const CareerSchema = z
  .object({
    total_years: z.coerce.number().min(0).max(50),
    current_role: z.string().min(1),
    role_level: RoleLevelEnum,
    transitions: z.array(CareerTransitionSchema).default([]),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                               INDUSTRY SCHEMA                              */
/* -------------------------------------------------------------------------- */

export const IndustrySchema = z
  .object({
    sector: z.string().min(1),
    company_tier: z.coerce.number().int().min(1).max(3),
    regions: z.array(ISO).default([]),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                              SIGNALS SCHEMA                                */
/* -------------------------------------------------------------------------- */

export const SignalsSchema = z
  .object({
    leadership: z.coerce.boolean().default(false),
    impact: z.coerce.boolean().default(false),
    international: z.coerce.boolean().default(false),
    tools: z.array(z.string()).default([]),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                GEO SCHEMA                                  */
/* -------------------------------------------------------------------------- */

export const GeoSchema = z
  .object({
    primary_country: ISO,
    secondary_countries: z.array(ISO).default([]),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                               EXTRAS SCHEMA                                */
/* -------------------------------------------------------------------------- */

export const ExtrasSchema = z
  .object({
    awards: z.array(z.string()).default([]),
    social_work: z.coerce.boolean().default(false),
  })
  .strict()
  .default({
    awards: [],
    social_work: false,
  });

/* -------------------------------------------------------------------------- */
/*                           FINAL LABEL ROOT SCHEMA                          */
/* -------------------------------------------------------------------------- */

export const LabelSchema = z
  .object({
    schemaVersion: z.literal("v1").default("v1"),
    tier: TierEnum,
    academics: AcademicsSchema,
    career: CareerSchema,
    industry: IndustrySchema,
    signals: SignalsSchema,
    geo: GeoSchema,
    extras: ExtrasSchema,
    meta: z
      .object({
        generator: z.string().optional(),
        seed: z.coerce.number().optional(),
        version: z.string().optional(),
      })
      .strict()
      .default({}),
  })
  .strict();

export type Label = z.infer<typeof LabelSchema>;

/* -------------------------------------------------------------------------- */
/*                           VALIDATION HELPERS                               */
/* -------------------------------------------------------------------------- */

export function validateLabels(input: unknown) {
  const parsed = LabelSchema.safeParse(input);
  if (parsed.success) return { ok: true as const, data: parsed.data };

  const errors = parsed.error!.issues.map(
    (i: z.ZodIssue) => `${i.path.join(".")}: ${i.message}`
  );
  return { ok: false as const, errors };
}

export function validateLabelArray(input: unknown[]) {
  const valid: Label[] = [];
  const invalid: { index: number; errors: string[] }[] = [];

  input.forEach((item, i) => {
    const res = validateLabels(item);
    if (res.ok) valid.push(res.data);
    else invalid.push({ index: i, errors: res.errors });
  });

  return { ok: invalid.length === 0, valid, invalid };
}

/* -------------------------------------------------------------------------- */
/*                                  EXAMPLE                                   */
/* -------------------------------------------------------------------------- */

export const __example__: Label = {
  schemaVersion: "v1",
  tier: "tier1_elite",
  academics: {
    ug_tier: 1,
    ug_institution: "IIT Bombay",
    pg_institution: "IIM Ahmedabad",
    test_scores: {
      gmat: 750,
      cat: 99.5,
      xat: 98,
    },
  },
  career: {
    total_years: 5,
    current_role: "Product Manager",
    role_level: "manager",
    transitions: [],
  },
  industry: {
    sector: "Tech",
    company_tier: 1,
    regions: ["IN", "US"],
  },
  signals: {
    leadership: true,
    impact: true,
    international: true,
    tools: ["SQL"],
  },
  geo: { primary_country: "IN", secondary_countries: ["US"] },
  extras: { awards: ["Top Performer"], social_work: true },
  meta: { generator: "example", seed: 1, version: "v1" },
};
