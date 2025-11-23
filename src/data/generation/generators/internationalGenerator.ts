// src/data/generation/generators/internationalGenerator.ts
/**
 * Unified International Resume Generator
 * Produces:
 *  - data/mba/datasets/international_sft.jsonl
 *  - .txt resumes in data/mba/resumes_raw/synthetic/processed/international/
 *  - .json labels in data/mba/labels_normalized/synthetic/processed/international/
 *
 * Usage:
 *  node -r ts-node/register src/data/generation/generators/internationalGenerator.ts --count 1000 --seed 2025
 */

import fs from "fs/promises";
import path from "path";
import renderer from "../renderer/textRenderer";
import { makeRng } from "../utils/rng";
import { LabelSchema } from "../labels/schema";

/* -------------------------------- Paths ---------------------------------- */
const ROOT = path.resolve(process.cwd());
const FEATURE_DIR = path.join(ROOT, "src", "data", "generation", "features");

const OUT_RESUMES_DIR = path.join(
  ROOT,
  "data",
  "mba",
  "resumes_raw",
  "synthetic",
  "processed",
  "international"
);

const OUT_LABELS_DIR = path.join(
  ROOT,
  "data",
  "mba",
  "labels_normalized",
  "synthetic",
  "processed",
  "international"
);

const OUT_JSONL = path.join(
  ROOT,
  "data",
  "mba",
  "datasets",
  "international_sft.jsonl"
);

const DEFAULT_COUNT = 1000;
const DEFAULT_SEED = 2025;
const MAX_ATTEMPTS = 5;

/* -------------------------------- Utils ---------------------------------- */
async function ensureDir(p: string) {
  try { await fs.mkdir(p, { recursive: true }); } catch {}
}

async function loadFeature<T = any>(rel: string): Promise<T> {
  const p = path.join(FEATURE_DIR, rel);
  try { return JSON.parse(await fs.readFile(p, "utf-8")) as T; }
  catch { console.warn(`[international] ⚠ Missing feature: ${rel}`); return {} as T; }
}

function randBetween(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function maybe(rng: () => number, p = 0.5) { return rng() < p; }
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

function appendJsonlLine(file: string, obj: any) {
  const line = JSON.stringify(obj) + "\n";
  return fs.appendFile(file, line, "utf-8");
}

function roleLevelFromTitle(title: string) {
  const t = (title || "").toLowerCase();
  if (t.includes("intern")) return "intern";
  if (t.includes("junior") || t.includes("assistant")) return "junior";
  if (t.includes("analyst") || t.includes("associate")) return "associate";
  if (t.includes("senior")) return "senior";
  if (t.includes("lead")) return "lead";
  if (t.includes("manager")) return "manager";
  if (t.includes("director")) return "director";
  if (t.includes("vp")) return "vp";
  if (t.includes("chief") || t.includes("head") || t.includes("cxo")) return "cxo";
  return "associate";
}

/* -------------------------- Flatteners ----------------------------------- */
function flattenInternationalAcademics(src: any): { school: string }[] {
  const out: { school: string }[] = [];
  if (Array.isArray(src?.universities)) {
    for (const u of src.universities) {
      out.push({ school: u?.name ?? String(u) });
    }
  }
  const colleges = src?.colleges ?? {};
  for (const b of Object.keys(colleges)) {
    const arr = colleges[b];
    if (Array.isArray(arr)) for (const it of arr) out.push({ school: it?.name ?? String(it) });
  }
  return out.length ? out : [
    { school: "Stanford University" },
    { school: "Harvard University" },
    { school: "University of Oxford" },
    { school: "National University of Singapore" }
  ];
}

type FlatCompany = { name: string; tierLabel: string; tierScore: number; approxTier: number };
function flattenCompanies(companyTiersJson: any): FlatCompany[] {
  const tiers = companyTiersJson?.tiers ?? {};
  const keys = Object.keys(tiers);
  const approx = (label: string) => Math.max(1, keys.indexOf(label) + 1);

  const out: FlatCompany[] = [];
  for (const k of keys) {
    const def = tiers[k] || {};
    const score = typeof def.tier_score === "number" ? def.tier_score : 0.5;
    (def.examples ?? []).forEach((n: string) =>
      out.push({ name: n, tierLabel: k, tierScore: score, approxTier: approx(k) })
    );
  }

  return out.length ? out : [
    { name: "Google", tierLabel: "Tier_2_Tech_Product", tierScore: 0.92, approxTier: 2 },
    { name: "McKinsey & Company", tierLabel: "Tier_1_Elite_Strategy", tierScore: 1.0, approxTier: 1 }
  ];
}

function flattenGeoCountries(geoJson: any): { country: string; cities: string[] }[] {
  const c = geoJson?.countries ?? {};
  const out: { country: string; cities: string[] }[] = [];
  for (const k of Object.keys(c)) out.push({ country: k, cities: c[k]?.cities ?? [] });
  return out.length ? out : [
    { country: "United States", cities: ["New York", "San Francisco"] },
    { country: "United Kingdom", cities: ["London"] },
    { country: "Singapore", cities: ["Singapore"] }
  ];
}

function flattenRoleExamples(roleCatsJson: any): { category: string; examples: string[] }[] {
  const rc = roleCatsJson?.role_categories ?? {};
  const out: { category: string; examples: string[] }[] = [];
  for (const k of Object.keys(rc)) {
    out.push({ category: k, examples: rc[k]?.examples ?? [] });
  }
  return out.length ? out : [
    { category: "Product", examples: ["Product Manager", "Associate PM"] },
    { category: "Consulting", examples: ["Consultant", "Engagement Manager"] }
  ];
}

/* --------------------------- Candidate Builder --------------------------- */
function buildCandidate(
  rng: () => number,
  schools: { school: string }[],
  companies: FlatCompany[],
  geo: { country: string; cities: string[] }[],
  roleCats: { category: string; examples: string[] }[],
  idx: number
) {
  const acad = choice(rng, schools, { school: "Harvard University" });

  const poolTier1 = companies.filter(c => /Tier_1/i.test(c.tierLabel));
  const poolTier2 = companies.filter(c => /Tier_2/i.test(c.tierLabel));
  const company = choice(rng, poolTier1.concat(poolTier2), {
    name: "Google", tierLabel: "Tier_2_Tech_Product", tierScore: 0.9, approxTier: 2
  });

  const roleCat = choice(rng, roleCats, { category: "Product", examples: ["Product Manager"] });
  const title = choice(rng, roleCat.examples, "Product Manager");

  const yearsExp = randBetween(rng, 4, 14);
  const startYear = 2025 - yearsExp;
  const start = `${startYear}-${String(randBetween(rng, 1, 12)).padStart(2, "0")}`;
  const end = `2025-${String(randBetween(rng, 1, 6)).padStart(2, "0")}`;

  const bullets = shufflePick(rng, [
    "Led cross-border programs driving {{pct}}% growth.",
    "Managed multi-country GTM and localization efforts.",
    "Coordinated with HQ and regional teams to align objectives.",
    "Implemented dashboards improving visibility across {{pct}}% of markets."
  ], 4).map(t => t.replace("{{pct}}", String(randBetween(rng, 10, 45))));

  const loc1 = choice(rng, geo, { country: "Singapore", cities: ["Singapore"] });
  const loc2 = choice(rng, geo, { country: "United Kingdom", cities: ["London"] });

  const summary = `${title} with ${yearsExp}+ years’ experience across ${loc1.country} and ${loc2.country}. Alumni of ${acad.school}.`;

  return {
    id: `INT-${String(idx + 1).padStart(5, "0")}`,
    email: `int_${idx + 1}@example.com`,
    acad,
    company,
    title,
    roleLevel: roleLevelFromTitle(title),
    yearsExp,
    start,
    end,
    achievements: bullets,
    loc1,
    loc2,
    summary
  };
}

/* --------------------- Scoring + Reasoning (Option A) --------------------- */
function computeAcademicsScore(label: any) {
  const ug = label.academics?.ug_tier ?? 3;
  const tierScore = ug === 1 ? 10 : ug === 2 ? 7.5 : ug === 3 ? 5.5 : 4.0;

  const g = label.academics?.test_scores?.GMAT ?? label.academics?.test_scores?.gmat;
  const gScaled = typeof g === "number" ? Math.min(10, (Number(g) / 800) * 10) : null;

  if (gScaled != null) return +(0.6 * tierScore + 0.4 * gScaled).toFixed(2);
  return +tierScore.toFixed(2);
}
function computeIndustryScore(label: any) {
  const tier = label.industry?.company_tier ?? 3;
  const score = Math.max(3, 11 - tier * 2.5);
  return +Math.min(10, score).toFixed(2);
}
function computeLeadershipScore(label: any) {
  const base = label.signals?.leadership ? 7 : 4;
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
  const w = { academics: 0.33, industry: 0.33, leadership: 0.34, gmat: 0.0 };
  const t = scores.academics * w.academics + scores.industry * w.industry + scores.leadership * w.leadership;
  return +(t / (w.academics + w.industry + w.leadership)).toFixed(2);
}
function makeReasoning(label: any, scores: any) {
  return [
    `Academics: UG tier ${label.academics?.ug_tier}${label.academics?.test_scores && Object.keys(label.academics.test_scores).length ? `, tests: ${Object.keys(label.academics.test_scores).join(", ")}` : ""}.`,
    `Company: tier ${label.industry?.company_tier}; role ${label.career?.current_role} (${label.career?.role_level}).`,
    `Leadership: ${label.signals?.leadership ? "present" : "absent"}.`
  ].join(" ");
}
function makeImprovedResume(cand: any, label: any) {
  const bullets = cand.achievements.map((a: string) => `• ${a}`);
  const testLines = label.academics?.test_scores && Object.keys(label.academics.test_scores).length
    ? `Tests: ${Object.entries(label.academics.test_scores).map(([k, v]) => `${k}: ${v}`).join(" | ")}`
    : "";
  return [
    `${cand.title} — ${cand.company.name}`,
    `${cand.start} – ${cand.end}`,
    `Education: ${cand.acad.school}`,
    testLines,
    "",
    "Key achievements:",
    ...bullets,
    "",
    "Suggested keywords: international experience, cross-border GTM, global strategy"
  ].filter(Boolean).join("\n");
}
function makeRecommendations(scores: any) {
  const r: string[] = [];
  if (scores.academics < 6) r.push("Highlight academic achievements; add GPA and coursework.");
  if (scores.leadership < 6) r.push("Add leadership bullets with team size and ownership.");
  if (scores.industry < 6) r.push("Emphasize impact on multi-country projects and global exposure.");
  if (!r.length) r.push("Resume is strong — add more quantified achievements.");
  return r;
}

/* --------------------------------- Main ---------------------------------- */
export default async function generateInternationalUnified(
  count = DEFAULT_COUNT,
  seed = DEFAULT_SEED
) {
  const rng = makeRng(seed);

  const intlJson = await loadFeature("academics/international_uni.json");
  const companyJson = await loadFeature("industry/company_tiers.json");
  const geoJson = await loadFeature("geography/countries.json");
  const roleCatsJson = await loadFeature("jobrole/role_categories.json");
  const awardsJson = await loadFeature("awards/awards.json");

  const schools = flattenInternationalAcademics(intlJson);
  const companies = flattenCompanies(companyJson);
  const geo = flattenGeoCountries(geoJson);
  const roleCats = flattenRoleExamples(roleCatsJson);
  const awards = (awardsJson?.award_categories)
    ? Object.values(awardsJson.award_categories).flatMap((x: any) => x.examples ?? [])
    : [];

  await ensureDir(OUT_RESUMES_DIR);
  await ensureDir(OUT_LABELS_DIR);
  await ensureDir(path.dirname(OUT_JSONL));

  // Reset JSONL
  try { await fs.unlink(OUT_JSONL); } catch {}
  await fs.writeFile(OUT_JSONL, "", "utf-8");

  console.log(`[international] Generating ${count} unified samples...`);

  let produced = 0;
  let attempts = 0;
  let idx = 0;

  while (produced < count) {
    if (attempts > MAX_ATTEMPTS) {
      console.warn(`[international] ⚠ Too many retries at index ${idx}. Skipping.`);
      attempts = 0;
      idx++;
      continue;
    }

    const c = buildCandidate(rng, schools, companies, geo, roleCats, idx);

    // label
    const testScores = maybe(rng, 0.35) ? { gmat: randBetween(rng, 650, 740) } : {};
    const labelRaw = {
      schemaVersion: "v1",
      tier: "international",
      academics: {
        ug_tier: 1,
        ug_institution: c.acad.school,
        pg_institution: maybe(rng, 0.30) ? "INSEAD" : "",
        test_scores: testScores
      },
      career: {
        total_years: c.yearsExp,
        current_role: c.title,
        role_level: c.roleLevel,
        transitions: maybe(rng, 0.3) ? [{ from_role: "Associate", to_role: c.title }] : []
      },
      industry: {
        sector: /consult/i.test(c.title) ? "Consulting" : "Technology",
        company_tier: c.company.approxTier <= 2 ? 1 : 2,
        regions: ["IN", "INTL"]
      },
      signals: {
        leadership: maybe(rng, 0.5),
        impact: true,
        international: true,
        tools: shufflePick(rng, ["Excel", "Power BI", "SQL", "Python"], 2)
      },
      geo: {
        primary_country: c.loc1.country,
        secondary_countries: [c.loc2.country]
      },
      extras: {
        awards: maybe(rng, 0.2) ? [choice(rng, awards, "Global Excellence Award")] : [],
        social_work: maybe(rng, 0.2)
      },
      meta: {
        generator: "internationalGenerator_unified",
        seed,
        version: "v1"
      }
    };

    const parsed = LabelSchema.safeParse(labelRaw);
    if (!parsed.success) {
      attempts++;
      idx++;
      continue;
    }

    attempts = 0;

    const resumeText = renderer.renderText({
      name: c.id,
      email: c.email,
      summary: c.summary,
      education: c.acad.school,
      role: c.title,
      company: c.company.name,
      duration: `${c.start} – ${c.end}`,
      achievements: c.achievements
    });

    // scoring
    const academics = computeAcademicsScore(parsed.data);
    const industry = computeIndustryScore(parsed.data);
    const leadership = computeLeadershipScore(parsed.data);
    const gmat = computeGMATScore(parsed.data);
    const overall = computeOverall({ academics, industry, leadership, gmat });

    const scores = { academics, industry, leadership, gmat, overall };
    const reasoning = makeReasoning(parsed.data, scores);
    const improved_resume = makeImprovedResume(c, parsed.data);
    const recommendations = makeRecommendations(scores);

    const record = {
      id: c.id,
      email: c.email,
      resume_text: resumeText,
      label: parsed.data,
      scores,
      reasoning,
      improved_resume,
      recommendations,
      meta: { generatedAt: new Date().toISOString(), seed, generator: "internationalGenerator_unified" }
    };

    // Write line to JSONL
    await appendJsonlLine(OUT_JSONL, record);

    // Write INDIVIDUAL files
    const base = `Candidate-${String(produced + 1).padStart(4, "0")}`;

    await fs.writeFile(
      path.join(OUT_RESUMES_DIR, `${base}.txt`),
      resumeText,
      "utf-8"
    );

    await fs.writeFile(
      path.join(OUT_LABELS_DIR, `${base}.json`),
      JSON.stringify(parsed.data, null, 2),
      "utf-8"
    );

    produced++;
    if (produced % 50 === 0)
      console.log(`[international] ${produced}/${count}`);

    idx++;
  }

  console.log(`[international] ✅ Done. Wrote ${produced} samples → ${OUT_JSONL}`);
  return { count: produced, outJsonl: OUT_JSONL };
}

/* -------------------------------- CLI ----------------------------------- */
if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    const args: Record<string, string | boolean> = {};
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
    await generateInternationalUnified(count, seed);
  })();
}
