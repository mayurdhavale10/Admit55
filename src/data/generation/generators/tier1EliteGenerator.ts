// src/data/generation/generators/tier1EliteGenerator.ts
/**
 * Tier-1 unified JSONL generator (Option A).
 * Produces:
 *  - data/mba/datasets/sft_score_regression_text.jsonl  (one line per candidate)
 *  - .txt resumes in data/mba/resumes_raw/synthetic/processed/tier1_elite
 *  - .json labels in data/mba/labels_normalized/synthetic/processed/tier1_elite
 *
 * Usage (from repo root):
 *  node -r ts-node/register src/data/generation/generators/tier1EliteGenerator.ts --count 1000 --seed 42
 *
 * The generator is careful to:
 *  - always return exactly `count` samples (skips invalid and retries up to a safe max)
 *  - produce schema-safe label objects (no undefined keys)
 *  - include optional test score objects (may be empty) and many exam types
 */

import fs from "fs/promises";
import path from "path";
import renderer from "../renderer/textRenderer";
import { makeRng } from "../utils/rng";
import { LabelSchema } from "../labels/schema";

const ROOT = path.resolve(process.cwd());
const FEATURE_DIR = path.join(ROOT, "src", "data", "generation", "features");
const OUT_RESUMES_DIR = path.join(ROOT, "data", "mba", "resumes_raw", "synthetic", "processed", "tier1_elite");
const OUT_LABELS_DIR = path.join(ROOT, "data", "mba", "labels_normalized", "synthetic", "processed", "tier1_elite");
const OUT_JSONL = path.join(ROOT, "data", "mba", "datasets", "sft_tier1_elite_text.jsonl");

const DEFAULT_COUNT = 1000;
const DEFAULT_SEED = 42;
const MAX_ATTEMPTS = 5; // if label invalid, retry building candidate (to ensure exact count)

/* ------------------------------ Utilities -------------------------------- */
async function ensureDir(p: string) {
  try { await fs.mkdir(p, { recursive: true }); } catch { /* ignore */ }
}
async function loadFeature<T = any>(rel: string): Promise<T> {
  const p = path.join(FEATURE_DIR, rel);
  try { return JSON.parse(await fs.readFile(p, "utf-8")) as T; }
  catch { console.warn(`[tier1] ⚠ Missing feature: ${rel}`); return {} as T; }
}
function choice<T>(rng: () => number, arr: T[] = [], fallback: T): T {
  if (!arr?.length) return fallback;
  return arr[Math.floor(rng() * arr.length)];
}
function randBetween(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function maybe(rng: () => number, p = 0.5) { return rng() < p; }
function shufflePick<T>(rng: () => number, arr: T[] = [], n = 1) {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c.slice(0, Math.min(n, c.length));
}
async function appendJsonlLine(file: string, obj: any) {
  const line = JSON.stringify(obj) + "\n";
  await fs.appendFile(file, line, "utf-8");
}

/* ----------------------------- Flatteners -------------------------------- */
function flattenSchools(acadJson: any): string[] {
  const out: string[] = [];
  const buckets = acadJson?.colleges ?? {};
  for (const b of Object.keys(buckets)) {
    const arr = buckets[b]; if (!Array.isArray(arr)) continue;
    for (const it of arr) out.push(it?.name ?? String(it));
  }
  return out.length ? out : ["Indian Institute of Technology Bombay"];
}
type FlatCompany = { name: string; tierLabel: string; tierScore: number; approxTier: number };
function flattenCompanies(companyTiersJson: any): FlatCompany[] {
  const tiersObj = companyTiersJson?.tiers ?? {};
  const keys = Object.keys(tiersObj);
  const approx = (label: string) => Math.max(1, keys.indexOf(label) + 1);
  const out: FlatCompany[] = [];
  for (const k of keys) {
    const def = tiersObj[k] || {};
    const score = typeof def.tier_score === "number" ? def.tier_score : 0.5;
    (def.examples ?? []).forEach((n: string) =>
      out.push({ name: n, tierLabel: k, tierScore: score, approxTier: approx(k) })
    );
  }
  return out.length ? out : [{ name: "McKinsey & Company", tierLabel: "Tier_1_Elite_Strategy", tierScore: 1.0, approxTier: 1 }];
}
function flattenTitles(roleCatsJson: any): string[] {
  const titles: string[] = [];
  const rc = roleCatsJson?.role_categories ?? {};
  for (const k of Object.keys(rc)) {
    (rc[k]?.examples ?? []).forEach((t: string) => titles.push(t));
  }
  return Array.from(new Set(titles)).filter(Boolean);
}
function flattenAwards(awardsJson: any): string[] {
  const cat = awardsJson?.award_categories ?? {};
  const all: string[] = [];
  for (const k of Object.keys(cat)) (cat[k]?.examples ?? []).forEach((e: string) => all.push(e));
  return all;
}

/* ---------------------------- Helper Functions --------------------------- */
function roleLevelFromTitle(title: string): string {
  const t = (title || "").toLowerCase();
  if (t.includes("intern")) return "intern";
  if (t.includes("junior") || t.includes("assistant")) return "junior";
  if (t.includes("analyst") || t.includes("associate")) return "associate";
  if (t.includes("senior")) return "senior";
  if (t.includes("lead")) return "lead";
  if (t.includes("manager")) return "manager";
  if (t.includes("director")) return "director";
  if (t.includes("vp")) return "vp";
  if (t.includes("partner") || t.includes("principal") || t.includes("cxo") || t.includes("chief") || t.includes("head")) return "cxo";
  return "manager";
}

/* ------------------------------ Candidate -------------------------------- */
function buildCandidate(pools: {
  schools: string[];
  companies: FlatCompany[];
  titles: string[];
  awards: string[];
}, rng: () => number, idx: number) {
  const school = choice(rng, pools.schools, "Indian Institute of Technology Bombay");
  const company = choice(rng, pools.companies, { name: "McKinsey & Company", tierLabel: "Tier_1_Elite_Strategy", tierScore: 1.0, approxTier: 1 });
  const title = choice(rng, pools.titles, "Consultant");
  const yearsExp = randBetween(rng, 4, 12);
  const endYear = 2025;
  const startYear = endYear - yearsExp;
  const start = `${startYear}-${String(randBetween(rng, 1, 12)).padStart(2, "0")}`;
  const end = `${endYear}-${String(randBetween(rng, 1, 12)).padStart(2, "0")}`;
  const summary = `${title} with ${yearsExp}+ years in ${company.name}, graduated from ${school}.`;
  const achievements = shufflePick(rng, [
    "Led cross-functional teams across geographies to deliver impact.",
    "Designed GTM strategy leading to 25% revenue growth.",
    "Streamlined business operations through analytics and automation.",
    "Delivered a strategic initiative improving margins by 6%.",
    "Built dashboards and automated reports used by CXO-level stakeholders."
  ], 3);
  const award = maybe(rng, 0.25) ? choice(rng, pools.awards, "Top Performer Award") : null;

  // Optional test scores: only for a small subset (configurable)
  // We provide a full object (maybe empty) to avoid undefined keys in label.
  const examsPool = [
    "GMAT","CAT","XAT","CMAT","MAT","SNAP","NMAT","ATMA",
    "MAH_MBA_CET","TANCET","TSICET","APICET","IBSAT","MICAT"
  ];
  const hasAnyTest = maybe(rng, 0.12); // ~12% will have a test entry (tweakable)
  const test_scores: Record<string, number | undefined> = {};
  if (hasAnyTest) {
    // randomly fill 1 or 2 exam scores
    const nScores = randBetween(rng, 1, 2);
    const picks = shufflePick(rng, examsPool, nScores);
    for (const e of picks) {
      // realistic ranges
      const v = e === "GMAT" ? randBetween(rng, 650, 780)
              : e === "CAT" ? randBetween(rng, 80, 100) // percentile
              : randBetween(rng, 60, 99);
      test_scores[e] = v;
    }
  }
  // keep an empty object if none
  return {
    id: `Candidate-T1-${String(idx + 1).padStart(5, "0")}`,
    email: `t1_${idx}@example.com`,
    school,
    company,
    title,
    start,
    end,
    summary,
    achievements,
    yearsExp,
    award,
    test_scores
  };
}

/* ------------------------ Scoring + Reasoning Helpers --------------------- */
function computeAcademicsScore(label: any) {
  const ug = label.academics?.ug_tier ?? 3;
  const tierScore = ug === 1 ? 10 : ug === 2 ? 7.5 : 5;
  // if GMAT present, combine (other exams not scaled here)
  const gmat = label.academics?.test_scores?.GMAT ?? label.academics?.test_scores?.gmat;
  const gmatScaled = typeof gmat === "number" ? Math.min(10, (Number(gmat) / 800) * 10) : null;
  if (gmatScaled != null) return +(0.6 * tierScore + 0.4 * gmatScaled).toFixed(2);
  return +tierScore.toFixed(2);
}
function computeIndustryScore(label: any) {
  const tier = label.industry?.company_tier ?? 3;
  const score = Math.max(3, 11 - tier * 2.5); // tweakable
  return +Math.min(10, score).toFixed(2);
}
function computeLeadershipScore(label: any) {
  const base = label.signals?.leadership ? 7.5 : 4.0;
  const rl = label.career?.role_level ?? "manager";
  const boost = /senior|lead|manager|director|vp|cxo/i.test(rl) ? 1.5 : 0;
  return +Math.min(10, base + boost).toFixed(2);
}
function computeGMATScore(label: any) {
  const g = label.academics?.test_scores?.GMAT ?? label.academics?.test_scores?.gmat;
  if (!g) return null;
  return +Math.min(10, (Number(g) / 800) * 10).toFixed(2);
}
function computeOverall(scores: { academics: number; industry: number; leadership: number; gmat?: number | null }) {
  const weights = { academics: 0.33, industry: 0.33, leadership: 0.34, gmat: 0.0 }; // gmat only nudges via academics
  let total = 0;
  let weightSum = 0;
  total += scores.academics * weights.academics; weightSum += weights.academics;
  total += scores.industry * weights.industry; weightSum += weights.industry;
  total += scores.leadership * weights.leadership; weightSum += weights.leadership;
  // gmat already blended into academics; we don't double count.
  return +((total / weightSum)).toFixed(2);
}
function makeReasoning(label: any, scores: any) {
  const parts: string[] = [];
  parts.push(`Academics: UG tier ${label.academics?.ug_tier ?? "N/A"}${label.academics?.test_scores && Object.keys(label.academics.test_scores).length ? `, tests: ${Object.keys(label.academics.test_scores).join(", ")}` : ""}.`);
  parts.push(`Company: tier ${label.industry?.company_tier ?? "N/A"}; role ${label.career?.current_role ?? "N/A"} (${label.career?.role_level ?? "N/A"}).`);
  parts.push(`Leadership signal: ${label.signals?.leadership ? "present" : "absent"}.`);
  return parts.join(" ");
}
function makeImprovedResume(cand: any, label: any) {
  const bullets = (cand.achievements ?? []).map((a: string, idx: number) => `• ${a}`);
  const testLines = label.academics?.test_scores && Object.keys(label.academics.test_scores).length
    ? `Tests: ${Object.entries(label.academics.test_scores).map(([k, v]) => `${k}: ${v}`).join(" | ")}`
    : "";
  const pg = label.academics?.pg_institution ? `PG: ${label.academics.pg_institution}` : "";
  return [
    `${cand.title} — ${cand.company.name}`,
    `${cand.start} – ${cand.end}`,
    `Education: ${cand.school} ${pg}`.trim(),
    testLines,
    "",
    "Key achievements:",
    ...bullets,
    "",
    "Suggested keywords: leadership, strategy, analytics, automation"
  ].filter(Boolean).join("\n");
}
function makeRecommendations(scores: any) {
  const recs: string[] = [];
  if (scores.academics < 6) recs.push("Consider stronger PG programs or certifications; quantify CGPA and projects.");
  if (scores.leadership < 6) recs.push("Add leadership bullets with headcount and stakeholder level.");
  if (scores.industry < 6) recs.push("Emphasize marquee clients, impact ($ or %), and cross-border exposure.");
  if (!recs.length) recs.push("Resume is strong — add concrete metrics for each achievement (%, $ saved, team size).");
  return recs;
}

/* ------------------------------- Main Gen -------------------------------- */
export default async function generateTier1Unified(count = DEFAULT_COUNT, seed = DEFAULT_SEED) {
  const rng = makeRng(seed);
  const acadJson = await loadFeature("academics/tier1_elite.json");
  const companyJson = await loadFeature("industry/company_tiers.json");
  const roleCats = await loadFeature("jobrole/role_categories.json");
  const awardsJson = await loadFeature("awards/awards.json");

  const schools = flattenSchools(acadJson);
  const companies = flattenCompanies(companyJson);
  const titles = flattenTitles(roleCats);
  const awards = flattenAwards(awardsJson);

  await ensureDir(OUT_RESUMES_DIR);
  await ensureDir(OUT_LABELS_DIR);
  await ensureDir(path.dirname(OUT_JSONL));

  // Overwrite JSONL if exists to guarantee exact n lines for each run
  try { await fs.unlink(OUT_JSONL); } catch { /* ignore */ }
  await fs.writeFile(OUT_JSONL, "", "utf-8");

  console.log(`[tier1] Generating ${count} Tier-1 unified JSONL resumes...`);

  const manifest: any[] = [];
  let produced = 0;
  let attemptsForThisIndex = 0;
  let i = 0;
  while (produced < count) {
    if (attemptsForThisIndex > MAX_ATTEMPTS) {
      // if repeated failures, log and continue to next (still try to hit count overall)
      console.warn(`[tier1] ⚠ Too many attempts for sample index ${i}. Continuing.`);
      attemptsForThisIndex = 0;
      i++;
    }
    const cand = buildCandidate({ schools, companies, titles, awards }, rng, i);
    // Build label with all keys present (no undefined keys)
    // test_scores: provide an object (maybe empty) to avoid undefined fields
    const testScores = Object.keys(cand.test_scores ?? {}).length ? cand.test_scores : {}; // keep empty object if none

    const label = {
      schemaVersion: "v1",
      tier: "tier1_elite",
      academics: {
        ug_tier: 1,
        ug_institution: cand.school,
        pg_institution: maybe(rng, 0.4) ? "IIM Ahmedabad" : "",
        test_scores: Object.keys(testScores).length ? testScores : {}, // empty object allowed
      },
      career: {
        total_years: cand.yearsExp,
        current_role: cand.title,
        role_level: roleLevelFromTitle(cand.title),
        transitions: maybe(rng, 0.3) ? [{ from_role: "Analyst", to_role: cand.title }] : [],
      },
      industry: {
        sector: /consult/i.test(cand.title) ? "Consulting" : "Corporate/MNC",
        company_tier: cand.company.approxTier,
        regions: ["IN", "US"],
      },
      signals: {
        leadership: maybe(rng, 0.7),
        impact: true,
        international: maybe(rng, 0.25),
        tools: shufflePick(rng, ["Excel", "Power BI", "SQL", "Python", "Communication"], 3),
      },
      geo: {
        primary_country: "IN",
        secondary_countries: maybe(rng, 0.2) ? ["US"] : [],
      },
      extras: {
        awards: cand.award ? [cand.award] : [],
        social_work: maybe(rng, 0.25),
      },
      meta: {
        generator: "tier1EliteGenerator_unified",
        seed,
        version: "v1",
      },
    };

    // Validate label with LabelSchema
    const parsed = LabelSchema.safeParse(label);
    if (!parsed.success) {
      // If label fails validation, try a few more times (rare)
      console.warn(`[tier1] ❌ Invalid label (retry): ${cand.id}`);
      console.dir(parsed.error.issues, { depth: null });
      attemptsForThisIndex++;
      i++;
      continue;
    }

    // Reset attempts counter on success
    attemptsForThisIndex = 0;

    // Create resume text using existing renderer (keeps formatting consistent)
    const resumeText = renderer.renderText({
      name: cand.id,
      email: cand.email,
      summary: cand.summary,
      education: cand.school,
      role: cand.title,
      company: cand.company.name,
      duration: `${cand.start} – ${cand.end}`,
      achievements: cand.achievements,
    });

    // Compute training scores
    const academics = computeAcademicsScore(parsed.data);
    const industry = computeIndustryScore(parsed.data);
    const leadership = computeLeadershipScore(parsed.data);
    const gmat = computeGMATScore(parsed.data);
    const overall = computeOverall({ academics, industry, leadership, gmat });

    const scores = { academics, industry, leadership, gmat, overall };
    const reasoning = makeReasoning(parsed.data, scores);
    const improved_resume = makeImprovedResume(cand, parsed.data);
    const recommendations = makeRecommendations(scores);

    const record = {
      id: cand.id,
      email: cand.email,
      resume_text: resumeText,
      label: parsed.data,
      scores,
      reasoning,
      improved_resume,
      recommendations,
      meta: { generatedAt: new Date().toISOString(), seed, generator: "tier1EliteGenerator_unified" }
    };

    // write JSONL line (append)
    try {
      await appendJsonlLine(OUT_JSONL, record);
      // also write per-sample text/json for debug/inspection
      const base = `Candidate-${String(produced + 1).padStart(4, "0")}`;
      await fs.writeFile(path.join(OUT_RESUMES_DIR, `${base}.txt`), resumeText, "utf-8");
      await fs.writeFile(path.join(OUT_LABELS_DIR, `${base}.json`), JSON.stringify(parsed.data, null, 2), "utf-8");

      manifestPush(manifest, cand.id, base);
      produced++;
      if (produced % 50 === 0) console.log(`[tier1] ✅ ${produced}/${count}`);
    } catch (e) {
      console.error(`[tier1] ❌ Failed to write sample ${cand.id}:`, e);
      // don't increment produced; try next i
    }

    i++;
  }

  // final manifest file
  await ensureDir(OUT_RESUMES_DIR);
  await fs.writeFile(path.join(OUT_RESUMES_DIR, `manifest_tier1_${Date.now()}.json`),
    JSON.stringify({ count: produced, generatedAt: new Date().toISOString(), seed }, null, 2), "utf-8");

  console.log(`[tier1] ✅ Done. Wrote ${produced} lines to ${OUT_JSONL}`);
  return { count: produced, outJsonl: OUT_JSONL };
}

/* small helper for manifest */
function manifestPush(man: any[], id: string, file: string) {
  man.push({ id, file });
}

/* ------------------------------- CLI wrapper ----------------------------- */
// run with: node -r ts-node/register src/data/generation/generators/tier1EliteGenerator.ts --count 1000 --seed 42
if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    const args: Record<string, string|boolean> = {};
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (a.startsWith("--")) {
        const k = a.replace(/^--/, "");
        const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
        args[k] = v;
      }
    }
    const count = args.count ? Number(args.count) : DEFAULT_COUNT;
    const seed = args.seed ? Number(args.seed) : DEFAULT_SEED;
    try {
      await generateTier1Unified(count, seed);
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  })();
}
