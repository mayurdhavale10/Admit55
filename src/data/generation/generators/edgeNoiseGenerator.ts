// src/data/generation/generators/edgeNoiseGenerator.ts
/**
 * Unified Edge/Noise Resume Generator (Option A: No Skips)
 * Produces:
 *  - data/mba/datasets/edge_noise_sft.jsonl  (one line per candidate)
 *  - .txt resumes in data/mba/resumes_raw/synthetic/processed/edge_noise
 *  - .json labels in data/mba/labels_normalized/synthetic/processed/edge_noise
 *
 * Usage (from repo root):
 *  node -r ts-node/register src/data/generation/generators/edgeNoiseGenerator.ts --count 500 --seed 333
 *
 * Behavior:
 *  - always return exactly `count` samples (retries invalid samples up to MAX_ATTEMPTS)
 *  - produces schema-safe label objects (no undefined keys)
 *  - includes optional test score objects (may be empty)
 */

import fs from "fs/promises";
import path from "path";
import renderer from "../renderer/textRenderer";
import { makeRng } from "../utils/rng";
import { LabelSchema } from "../labels/schema";

const ROOT = path.resolve(process.cwd());
const FEATURE_DIR = path.join(ROOT, "src", "data", "generation", "features");

const OUT_RESUMES_DIR = path.join(
  ROOT,
  "data",
  "mba",
  "resumes_raw",
  "synthetic",
  "processed",
  "edge_noise"
);

const OUT_LABELS_DIR = path.join(
  ROOT,
  "data",
  "mba",
  "labels_normalized",
  "synthetic",
  "processed",
  "edge_noise"
);

const OUT_JSONL = path.join(ROOT, "data", "mba", "datasets", "edge_noise_sft.jsonl");

const DEFAULT_COUNT = 500;
const DEFAULT_SEED = 333;
const MAX_ATTEMPTS = 5;

/* ------------------------------ Utilities -------------------------------- */
async function ensureDir(p: string) {
  try { await fs.mkdir(p, { recursive: true }); } catch { /* ignore */ }
}

async function loadFeature<T = any>(rel: string): Promise<T> {
  const p = path.join(FEATURE_DIR, rel);
  try { return JSON.parse(await fs.readFile(p, "utf-8")) as T; }
  catch { console.warn(`[edge_noise] ⚠ Missing feature: ${rel}`); return {} as T; }
}

function appendJsonlLine(file: string, obj: any) {
  const line = JSON.stringify(obj) + "\n";
  return fs.appendFile(file, line, "utf-8");
}

function maybe(rng: () => number, p = 0.5) { return rng() < p; }
function randBetween(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function choice<T>(rng: () => number, arr: T[] = [], fallback: T): T {
  if (!arr?.length) return fallback;
  return arr[Math.floor(rng() * arr.length)];
}
function shufflePick<T>(rng: () => number, arr: T[] = [], n = 1) {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c.slice(0, Math.min(n, c.length));
}

/* --------------------------- Noise Helpers -------------------------------- */
type NoiseProfile = {
  dropPunct: number;
  upper: number;
  lower: number;
  duplicateWord: number;
  smallTypo: number;
  truncate: number;
};

const NOISE: NoiseProfile = {
  dropPunct: 0.12,
  upper: 0.08,
  lower: 0.08,
  duplicateWord: 0.06,
  smallTypo: 0.08,
  truncate: 0.05,
};

function applyNoise(rng: () => number, s: string, np: NoiseProfile = NOISE) {
  let out = s;
  if (!out) return out;
  if (maybe(rng, np.dropPunct)) out = out.replace(/[.,;:]/g, "");
  if (maybe(rng, np.upper)) out = out.toUpperCase();
  if (maybe(rng, np.lower)) out = out.toLowerCase();
  if (maybe(rng, np.duplicateWord)) out = out.replace(/\b(\w{4,})\b/, "$1 $1");
  if (maybe(rng, np.smallTypo)) out = out.replace(/tion\b/g, "tioon").replace(/ment\b/g, "mnet");
  if (maybe(rng, np.truncate)) out = out.slice(0, Math.max(30, Math.floor(out.length * 0.7)));
  return out;
}

/* --------------------------- Flatteners ---------------------------------- */
function flattenSchools(...jsons: any[]): string[] {
  const out: string[] = [];
  for (const acadJson of jsons) {
    const buckets = acadJson?.colleges ?? {};
    for (const b of Object.keys(buckets)) {
      const arr = buckets[b];
      if (!Array.isArray(arr)) continue;
      for (const it of arr) out.push(it?.name ?? String(it));
    }
  }
  return out.length ? out : ["Generic College"];
}

type FlatCompany = { name: string; tierLabel: string; approxTier: number };
function flattenCompanies(companyTiersJson: any): FlatCompany[] {
  const tiers = companyTiersJson?.tiers ?? {};
  const keys = Object.keys(tiers);
  const approx = (label: string) => Math.max(1, keys.indexOf(label) + 1);

  const out: FlatCompany[] = [];
  for (const k of keys) {
    const def = tiers[k] ?? {};
    (def.examples ?? []).forEach((n: string) =>
      out.push({ name: n, tierLabel: k, approxTier: approx(k) })
    );
  }
  return out.length ? out : [{ name: "TCS", tierLabel: "Tier_5_Common_IT", approxTier: 3 }];
}

function flattenCities(geoJson: any): { city: string; country: string }[] {
  const out: { city: string; country: string }[] = [];
  const countries = geoJson?.countries ?? {};
  for (const c of Object.keys(countries)) {
    (countries[c]?.cities ?? []).forEach((city: string) =>
      out.push({ city, country: c })
    );
  }
  return out.length ? out : [{ city: "Mumbai", country: "IN" }];
}

function flattenTitles(roleCatsJson: any, titleSynJson: any): string[] {
  const out: string[] = [];

  const rc = roleCatsJson?.role_categories ?? {};
  for (const k of Object.keys(rc)) (rc[k]?.examples ?? []).forEach((t: string) => out.push(t));

  const ts = titleSynJson?.title_synonyms ?? {};
  for (const k of Object.keys(ts)) {
    out.push(k);
    (ts[k] ?? []).forEach((t: string) => out.push(t));
  }

  return Array.from(new Set(out)).filter(Boolean);
}

/* ------------------------ Role Level -------------------------------------- */
function roleLevelFromTitle(t: string): string {
  const s = (t || "").toLowerCase();
  if (s.includes("intern")) return "intern";
  if (s.includes("junior") || s.includes("assistant")) return "junior";
  if (s.includes("analyst") || s.includes("associate")) return "associate";
  if (s.includes("senior")) return "senior";
  if (s.includes("lead")) return "lead";
  if (s.includes("manager")) return "manager";
  if (s.includes("director")) return "director";
  if (s.includes("vp")) return "vp";
  if (s.includes("chief") || s.includes("head") || s.includes("cxo")) return "cxo";
  return "associate";
}

/* ------------------------ Candidate Builder -------------------------------- */
function buildCandidate(
  pools: {
    schools: string[];
    titles: string[];
    companies: FlatCompany[];
    cities: { city: string; country: string }[];
  },
  rng: () => number,
  idx: number
) {
  const school = choice(rng, pools.schools, "Unknown Institute");
  const title = choice(rng, pools.titles, "Analyst");
  const company = choice(rng, pools.companies, {
    name: "SomeCo",
    tierLabel: "Tier_3",
    approxTier: 3,
  });
  const loc = choice(rng, pools.cities, { city: "Mumbai", country: "IN" });

  const yearsExp = randBetween(rng, 1, 12);

  const startYear = 2025 - yearsExp;
  const start = `${startYear}-${String(randBetween(rng, 1, 12)).padStart(2, "0")}`;
  const end = `2025-${String(randBetween(rng, 1, 12)).padStart(2, "0")}`;

  const summary = applyNoise(rng, `${title} with ${yearsExp}+ years in ${loc.country}`);
  const bullets = shufflePick(rng, [
    "Improved process efficiency by 20%.",
    "Built dashboards improving visibility.",
    "Reduced operational costs by 15%.",
    "Managed vendor relationships.",
  ], 3).map((b) => applyNoise(rng, b));

  return {
    id: `EDGE-${String(idx + 1).padStart(5, "0")}`,
    email: `edge_${idx + 1}@example.com`,
    school,
    title,
    company,
    yearsExp,
    summary,
    achievements: bullets,
    location: `${loc.city}, ${loc.country}`,
    start,
    end,
    roleLevel: roleLevelFromTitle(title),
  };
}

/* ------------------------ Scoring + Reasoning Helpers --------------------- */
function computeAcademicsScore(label: any) {
  const ug = label.academics?.ug_tier ?? 3;
  const tierScore = ug === 1 ? 10 : ug === 2 ? 7.5 : ug === 3 ? 5.5 : 4.0;
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
  const base = label.signals?.leadership ? 7.0 : 4.0;
  const rl = label.career?.role_level ?? "associate";
  const boost = /senior|lead|manager|director|vp|cxo/i.test(rl) ? 1.5 : 0;
  return +Math.min(10, base + boost).toFixed(2);
}
function computeGMATScore(label: any) {
  const g = label.academics?.test_scores?.GMAT ?? label.academics?.test_scores?.gmat;
  if (!g) return null;
  return +Math.min(10, (Number(g) / 800) * 10).toFixed(2);
}
function computeOverall(scores: { academics: number; industry: number; leadership: number; gmat?: number | null }) {
  const weights = { academics: 0.33, industry: 0.33, leadership: 0.34, gmat: 0.0 };
  let total = 0;
  let weightSum = 0;
  total += scores.academics * weights.academics; weightSum += weights.academics;
  total += scores.industry * weights.industry; weightSum += weights.industry;
  total += scores.leadership * weights.leadership; weightSum += weights.leadership;
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
  const bullets = (cand.achievements ?? []).map((a: string) => `• ${a}`);
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
    "Suggested keywords: analytics, automation, process-improvement, dashboards"
  ].filter(Boolean).join("\n");
}
function makeRecommendations(scores: any) {
  const recs: string[] = [];
  if (scores.academics < 6) recs.push("Consider stronger certifications or quantifiable academic projects; list CGPA and grading scale.");
  if (scores.leadership < 6) recs.push("Add leadership bullets with headcount and stakeholder level.");
  if (scores.industry < 6) recs.push("Emphasize marquee clients, measurable impact ($ or %), and cross-border exposure.");
  if (!recs.length) recs.push("Resume is solid — add concrete metrics for each achievement (%, $ saved, team size).");
  return recs;
}

/* ------------------------------- Main Gen -------------------------------- */
export default async function generateEdgeNoiseUnified(count = DEFAULT_COUNT, seed = DEFAULT_SEED) {
  const rng = makeRng(seed);

  const tier1 = await loadFeature("academics/tier1_elite.json");
  const tier2 = await loadFeature("academics/tier2_mid.json");
  const tier3 = await loadFeature("academics/tier3_regular.json");
  const companiesJson = await loadFeature("industry/company_tiers.json");
  const geoJson = await loadFeature("geography/countries.json");
  const roleCatJson = await loadFeature("jobrole/role_categories.json");
  const titleSynJson = await loadFeature("jobrole/title_synonyms.json");
  const awardsJson = await loadFeature("awards/awards.json");

  const schools = flattenSchools(tier1, tier2, tier3);
  const companies = flattenCompanies(companiesJson);
  const cities = flattenCities(geoJson);
  const titles = flattenTitles(roleCatJson, titleSynJson);
  const awards = (awardsJson?.award_categories) ? Object.values(awardsJson.award_categories).flatMap((c: any) => c.examples ?? []) : [];

  await ensureDir(OUT_RESUMES_DIR);
  await ensureDir(OUT_LABELS_DIR);
  await ensureDir(path.dirname(OUT_JSONL));

  // Overwrite JSONL if exists to guarantee exact n lines for each run
  try { await fs.unlink(OUT_JSONL); } catch {}
  await fs.writeFile(OUT_JSONL, "", "utf-8");

  console.log(`[edge_noise] Generating ${count} Edge/Noise unified JSONL resumes...`);

  const manifest: any[] = [];
  let produced = 0;
  let attemptsForThisIndex = 0;
  let i = 0;
  while (produced < count) {
    if (attemptsForThisIndex > MAX_ATTEMPTS) {
      console.warn(`[edge_noise] ⚠ Too many attempts for sample index ${i}. Continuing.`);
      attemptsForThisIndex = 0;
      i++;
    }

    const cand = buildCandidate({ schools, titles, companies, cities }, rng, i);

    // Build label with all keys present (no undefined keys)
    const testScores = Object.keys(maybe(rng, 0.2) ? { gmat: randBetween(rng, 580, 720) } : {}).length ? { gmat: randBetween(rng, 580, 720) } : {};
    const label = {
      schemaVersion: "v1",
      tier: "edge_noise",
      academics: {
        ug_tier: randBetween(rng, 2, 4),
        ug_institution: cand.school,
        pg_institution: maybe(rng, 0.15) ? "Local PG Institute" : "",
        test_scores: Object.keys(testScores).length ? testScores : {},
      },
      career: {
        total_years: cand.yearsExp,
        current_role: cand.title,
        role_level: cand.roleLevel,
        transitions: maybe(rng, 0.25) ? [{ from_role: "Analyst", to_role: cand.title }] : [],
      },
      industry: {
        sector: /analyst|data|engineer/i.test(cand.title) ? "Technology" : "Corporate/MNC",
        company_tier: Math.max(1, Math.min(5, cand.company.approxTier)),
        regions: ["IN"],
      },
      signals: {
        leadership: maybe(rng, 0.3),
        impact: maybe(rng, 0.7),
        international: maybe(rng, 0.15),
        tools: shufflePick(rng, ["Excel", "SQL", "PowerPoint", "Python"], 2),
      },
      geo: {
        primary_country: cand.location.split(", ").pop() ?? "IN",
        secondary_countries: [],
      },
      extras: {
        awards: maybe(rng, 0.1) ? [choice(rng, awards, "Local Achievement Award")] : [],
        social_work: maybe(rng, 0.2),
      },
      meta: {
        generator: "edgeNoiseGenerator_unified",
        seed,
        version: "v1",
      },
    };

    const parsed = LabelSchema.safeParse(label);
    if (!parsed.success) {
      console.warn(`[edge_noise] ❌ Invalid label (retry): ${cand.id}`);
      console.dir(parsed.error.issues, { depth: null });
      attemptsForThisIndex++;
      i++;
      continue;
    }

    attemptsForThisIndex = 0;

    // Create resume text using existing renderer
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

    // Compute scores
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
      meta: { generatedAt: new Date().toISOString(), seed, generator: "edgeNoiseGenerator_unified" }
    };

    try {
      await appendJsonlLine(OUT_JSONL, record);

      const base = `Candidate-${String(produced + 1).padStart(4, "0")}`;
      await fs.writeFile(path.join(OUT_RESUMES_DIR, `${base}.txt`), resumeText, "utf-8");
      await fs.writeFile(path.join(OUT_LABELS_DIR, `${base}.json`), JSON.stringify(parsed.data, null, 2), "utf-8");

      manifestPush(manifest, cand.id, base);
      produced++;
      if (produced % 50 === 0) console.log(`[edge_noise] ✅ ${produced}/${count}`);
    } catch (e) {
      console.error(`[edge_noise] ❌ Failed to write sample ${cand.id}:`, e);
      // do not increment produced; move on
    }

    i++;
  }

  // final manifest file
  await ensureDir(OUT_RESUMES_DIR);
  await fs.writeFile(path.join(OUT_RESUMES_DIR, `manifest_edge_noise_${Date.now()}.json`),
    JSON.stringify({ count: produced, generatedAt: new Date().toISOString(), seed }, null, 2), "utf-8");

  console.log(`[edge_noise] ✅ Done. Wrote ${produced} lines to ${OUT_JSONL}`);
  return { count: produced, outJsonl: OUT_JSONL };
}

/* small helper for manifest */
function manifestPush(man: any[], id: string, file: string) {
  man.push({ id, file });
}

/* ------------------------------- CLI wrapper ----------------------------- */
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
      await generateEdgeNoiseUnified(count, seed);
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  })();
}
