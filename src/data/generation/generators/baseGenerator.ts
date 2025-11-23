// src/data/generation/generators/baseGenerator.ts
// -----------------------------------------------------------
// ⚙️ Base Generator Utility — Shared Across All Tier Generators
// -----------------------------------------------------------

import fs from "fs/promises";
import path from "path";
import sampler from "../utils/sampler";
import renderer from "../renderer/textRenderer";
import type { Pools } from "../types/features";
import { LabelSchema } from "../labels/schema";

/* -------------------------------------------------------------------------- */
/* 🧮 Random helpers (pure, seed passed at call sites)                        */
/* -------------------------------------------------------------------------- */
export function randBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
export function maybe(rng: () => number, p = 0.5): boolean {
  return rng() < p;
}
export function shufflePick<T>(rng: () => number, arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

/* -------------------------------------------------------------------------- */
/* 🗂️ Directory & file helpers                                               */
/* -------------------------------------------------------------------------- */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {
    /* no-op */
  }
}

/** Load JSON feature safely (UTF-8 + empty fallback). */
export async function loadFeature<T = any>(relPath: string): Promise<T> {
  const abs = path.resolve("src/data/generation/features", relPath);
  try {
    const data = await fs.readFile(abs, "utf-8");
    return JSON.parse(data) as T;
  } catch {
    console.warn(`[baseGenerator] ⚠️ Missing feature: ${relPath} → using empty fallback`);
    return {} as T;
  }
}

/* -------------------------------------------------------------------------- */
/* ✨ Text renderer passthrough                                               */
/* -------------------------------------------------------------------------- */
export function composeText(candidate: any): string {
  return renderer.renderText(candidate);
}

/* -------------------------------------------------------------------------- */
/* 🧠 Schema-aware normalizer                                                 */
/*  - Accepts already-normalized blocks and passes them through.              */
/*  - Falls back to minimal, schema-shaped objects when given loose data.     */
/* -------------------------------------------------------------------------- */
export function composeNormalized(candidateId: string, candidate: any): any {
  // Academics block: if it already looks normalized, keep it.
  const academicsBlock =
    candidate.academics &&
    (candidate.academics.ug_institution !== undefined ||
      candidate.academics.ug_tier !== undefined ||
      candidate.academics.test_scores !== undefined)
      ? candidate.academics
      : {
          ug_institution:
            candidate.education ??
            candidate.school ??
            (Array.isArray(candidate.academics) && candidate.academics[0]?.school) ??
            "",
          ug_tier: candidate.ugTier ?? undefined,
          test_scores: candidate.test_scores ?? undefined,
        };

  // Industry block passthrough or minimal fallback
  const industryBlock =
    candidate.industry &&
    (candidate.industry.company_tier_num !== undefined ||
      candidate.industry.company !== undefined ||
      candidate.industry.sector !== undefined)
      ? candidate.industry
      : {
          sector: candidate.sector ?? undefined,
          company: candidate.company ?? undefined,
        };

  const normalized = {
    id: candidateId,
    name: candidate.name ?? "",
    email: candidate.email ?? "",
    summary: candidate.summary ?? "",
    academics: academicsBlock, // object (schema expects an object, not an array)
    career: {
      total_years:
        candidate.totalYears ??
        candidate.yearsExp ??
        undefined,
      current_role:
        candidate.currentRole ??
        candidate.role ??
        undefined,
      role_level: candidate.roleLevel ?? undefined,
      transitions: candidate.transitions ?? [],
    },
    industry: industryBlock,
    signals: candidate.signals ?? {},
    geo: candidate.geo ?? {},
    extras: {
      awards: candidate.awards ?? [],
      social_work: candidate.social_work ?? false,
    },
    // Optional meta passthrough (won’t harm schema if it ignores unknown keys)
    meta: candidate.meta ?? undefined,
    tier: candidate.tier ?? undefined,
    schemaVersion: candidate.schemaVersion ?? "v1",
  };

  // Soft-validate: warn but don’t throw to keep generation flowing
  const parsed = LabelSchema.safeParse(normalized);
  if (!parsed.success) {
    console.warn(`[${candidateId}] ⚠️ LabelSchema validation failed`, parsed.error.issues);
  }

  return normalized;
}

/* -------------------------------------------------------------------------- */
/* 🚀 Master function — generate candidates for a tier                        */
/*  - Seedable for reproducibility                                            */
/*  - Loads all pools once                                                    */
/*  - Writes normalized JSON + rendered TXT + manifest                        */
/* -------------------------------------------------------------------------- */
export async function generateTierCandidates(
  tierName: string,
  count: number,
  builderFn: (pools: Pools, index: number, rng: () => number) => any,
  seed = 42
): Promise<void> {
  const rng = sampler.makeRng(seed);

  const OUT_RESUMES_DIR = path.resolve("data/mba/resumes_raw/synthetic/processed", tierName);
  const OUT_LABELS_DIR = path.resolve("data/mba/labels_normalized/synthetic/processed", tierName);

  await ensureDir(OUT_RESUMES_DIR);
  await ensureDir(OUT_LABELS_DIR);

  /* ------------------------ Load feature pools (robust) ------------------- */
  // Awards + extracurriculars are stored in different files across your datasets.
  // We try both and merge what we find.
  const awardsJson = await loadFeature<any>("awards/awards.json");
  const socialWorkJson = await loadFeature<any>("socialwork/social_work.json"); // if you keep this
  const impactSocialJson = await loadFeature<any>("impact/social_impact.json"); // or this alternative

  const extrasFromSocialWork =
    (socialWorkJson?.social_work && Array.isArray(socialWorkJson.social_work.CSR_Initiatives?.examples)
      ? socialWorkJson.social_work.CSR_Initiatives.examples
      : []
    ).concat(
      Array.isArray(socialWorkJson?.social_work?.NGO_Volunteering?.examples)
        ? socialWorkJson.social_work.NGO_Volunteering.examples
        : []
    );

  const extrasFromImpact = Array.isArray(impactSocialJson?.examples)
    ? impactSocialJson.examples
    : [];

  const pools: Pools = {
    academics: {
      tier1_elite: await loadFeature("academics/tier1_elite.json"),
      tier2_mid: await loadFeature("academics/tier2_mid.json"),
      tier3_regular: await loadFeature("academics/tier3_regular.json"),
      nontraditional: await loadFeature("academics/nontraditional.json"),
      international_uni: await loadFeature("academics/international_uni.json"),
    } as any,
    industry: await loadFeature("industry/company_tiers.json"),
    jobrole: {
      role_categories: await loadFeature("jobrole/role_categories.json"),
      title_synonyms: await loadFeature("jobrole/title_synonyms.json"),
    } as any,
    geography: await loadFeature("geography/countries.json"),
    other: {
      extracurriculars: [...extrasFromSocialWork, ...extrasFromImpact],
      awards: awardsJson?.elite ?? [],
    },
  };

  console.log(`\n[${tierName}] 🧩 Generating ${count} candidates (seed=${seed})...`);
  const manifest: Array<{ id: string; jsonPath: string; txtPath: string }> = [];

  for (let i = 0; i < count; i++) {
    const candidateId = sampler.makeId(tierName.toUpperCase(), i);
    const candidate = builderFn(pools, i, rng);
    const normalized = composeNormalized(candidateId, candidate);

    // Render: if your text renderer expects specific keys, it should handle `normalized`.
    const text = composeText(normalized);

    const jsonPath = path.join(OUT_LABELS_DIR, `${candidateId}.json`);
    const txtPath = path.join(OUT_RESUMES_DIR, `${candidateId}.txt`);

    await fs.writeFile(jsonPath, JSON.stringify(normalized, null, 2), "utf-8");
    await fs.writeFile(txtPath, text, "utf-8");

    if ((i + 1) % 50 === 0) {
      console.log(`✅ [${tierName}] ${i + 1}/${count} generated`);
    }

    manifest.push({ id: candidateId, jsonPath, txtPath });
  }

  /* ------------------------- Manifest for tracking ----------------------- */
  const manifestPath = path.join(OUT_RESUMES_DIR, `manifest_${tierName}_${Date.now()}.json`);
  await fs.writeFile(
    manifestPath,
    JSON.stringify(
      {
        tier: tierName,
        total: count,
        seed,
        generatedAt: new Date().toISOString(),
        sampleCount: manifest.length,
        preview: manifest.slice(0, 5),
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`📦 [${tierName}] Generation complete → ${manifestPath}`);
}

/* -------------------------------------------------------------------------- */
/* 🧰 Export shared utilities                                                 */
/* -------------------------------------------------------------------------- */
export default {
  generateTierCandidates,
  randBetween,
  maybe,
  shufflePick,
  loadFeature,
  ensureDir,
  composeNormalized,
  composeText,
};
