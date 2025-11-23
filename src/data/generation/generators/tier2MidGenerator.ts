import fs from "fs/promises";
import path from "path";
import renderer from "../renderer/textRenderer";
import { makeRng } from "../utils/rng";
import { LabelSchema } from "../labels/schema";

/* ----------------------- Paths ----------------------- */
const ROOT = path.resolve(process.cwd());
const FEATURE_DIR = path.join(ROOT, "src", "data", "generation", "features");

const OUT_JSONL = path.join(
  ROOT,
  "data",
  "mba",
  "datasets",
  "sft_tier2_unified.jsonl"
);

const OUT_RESUMES_DIR = path.join(
  ROOT,
  "data",
  "mba",
  "resumes_raw",
  "synthetic",
  "processed",
  "tier2_mid"
);

const OUT_LABELS_DIR = path.join(
  ROOT,
  "data",
  "mba",
  "labels_normalized",
  "synthetic",
  "processed",
  "tier2_mid"
);

const DEFAULT_COUNT = 2000;
const DEFAULT_SEED = 42;

/* ----------------------- Helpers ----------------------- */
async function ensureDir(p: string) {
  try {
    await fs.mkdir(p, { recursive: true });
  } catch {}
}

async function loadFeature(rel: string) {
  const file = path.join(FEATURE_DIR, rel);
  try {
    return JSON.parse(await fs.readFile(file, "utf-8"));
  } catch {
    console.warn(`[tier2] ⚠ Missing feature: ${rel}`);
    return {};
  }
}

function randBetween(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function maybe(rng: () => number, p = 0.5) {
  return rng() < p;
}

function choice<T>(rng: () => number, arr: T[], fallback: T): T {
  if (!arr?.length) return fallback;
  return arr[Math.floor(rng() * arr.length)];
}

function shufflePick<T>(rng: () => number, arr: T[], n = 1) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

/* ----------------------- Flatteners ----------------------- */
type FlatCompany = {
  name: string;
  tierLabel: string;
  tierScore: number;
  approxTier: number;
};

function flattenSchools(json: any): string[] {
  const out: string[] = [];
  const buckets = json?.colleges ?? {};
  for (const k of Object.keys(buckets)) {
    const arr = buckets[k];
    if (!Array.isArray(arr)) continue;
    for (const it of arr) out.push(it?.name ?? it);
  }
  return out;
}

function flattenCompanies(json: any): FlatCompany[] {
  const out: FlatCompany[] = [];
  const tiers = json?.tiers ?? {};
  const tierNames = Object.keys(tiers);
  const approxTier = (label: string) => Math.max(1, tierNames.indexOf(label) + 1);

  for (const label of tierNames) {
    const t = tiers[label] || {};
    const score = typeof t.tier_score === "number" ? t.tier_score : 0.5;

    (t.examples ?? []).forEach((name: string) =>
      out.push({
        name,
        tierLabel: label,
        tierScore: score,
        approxTier: approxTier(label),
      })
    );
  }

  return out.length
    ? out
    : [{ name: "Infosys", tierLabel: "Tier_5", tierScore: 0.6, approxTier: 3 }];
}

function flattenTitles(rc: any): string[] {
  const titles: string[] = [];
  const cats = rc?.role_categories ?? {};
  for (const k of Object.keys(cats)) {
    (cats[k]?.examples ?? []).forEach((t: string) => titles.push(t));
  }
  return Array.from(new Set(titles));
}

function flattenAwards(aw: any): string[] {
  const all: string[] = [];
  const cats = aw?.award_categories ?? {};
  for (const k of Object.keys(cats)) {
    (cats[k]?.examples ?? []).forEach((e: string) => all.push(e));
  }
  return all;
}

/* ----------------------- Role Logic ----------------------- */
function roleLevelFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("intern")) return "intern";
  if (t.includes("junior") || t.includes("assistant")) return "junior";
  if (t.includes("associate") || t.includes("analyst")) return "associate";
  if (t.includes("senior")) return "senior";
  if (t.includes("lead")) return "lead";
  if (t.includes("manager")) return "manager";
  if (t.includes("director")) return "director";
  if (t.includes("vp")) return "vp";
  if (t.includes("head") || t.includes("cxo") || t.includes("chief")) return "cxo";
  return "associate";
}

function mapTier(label: string): number {
  if (/Tier_1/i.test(label)) return 1;
  if (/Tier_2|Tier_3/i.test(label)) return 2;
  return 3;
}

/* ----------------------- Candidate Template ----------------------- */
function buildCandidate(
  pools: { schools: string[]; companies: FlatCompany[]; titles: string[]; awards: string[] },
  rng: () => number,
  i: number
) {
  const school = choice(rng, pools.schools, "NMIMS Mumbai");
  const company = choice(rng, pools.companies, {
    name: "Infosys",
    tierLabel: "Tier_5",
    tierScore: 0.6,
    approxTier: 3,
  });

  const title = choice(rng, pools.titles, "Consultant");

  const yearsExp = randBetween(rng, 3, 8);

  const endYear = 2025;
  const startYear = endYear - yearsExp;

  const start = `${startYear}-${String(randBetween(rng, 1, 12)).padStart(2, "0")}`;
  const end = `${endYear}-${String(randBetween(rng, 1, 12)).padStart(2, "0")}`;

  const achievements = shufflePick(rng, [
    "Delivered projects improving efficiency by 15%.",
    "Handled key client accounts in analytics.",
    "Built reports and dashboards using Power BI.",
  ], 3);

  const award = maybe(rng, 0.2)
    ? choice(rng, pools.awards, "Top Performer")
    : null;

  return {
    id: `Candidate-T2-${String(i + 1).padStart(5, "0")}`,
    email: `t2_${i}@example.com`,
    school,
    company,
    title,
    yearsExp,
    start,
    end,
    achievements,
    summary: `${title} with ${yearsExp}+ years in ${company.name}, graduate of ${school}.`,
    award,
  };
}

/* ----------------------- JSONL writer ----------------------- */
async function writeJsonl(file: string, obj: any) {
  await fs.appendFile(file, JSON.stringify(obj) + "\n", "utf-8");
}

/* ----------------------- Main Generator ----------------------- */
export default async function generateTier2(count = DEFAULT_COUNT, seed = DEFAULT_SEED) {
  const rng = makeRng(seed);

  const acadJson = await loadFeature("academics/tier2_mid.json");
  const compJson = await loadFeature("industry/company_tiers.json");
  const roleJson = await loadFeature("jobrole/role_categories.json");
  const awardsJson = await loadFeature("awards/awards.json");

  const schools = flattenSchools(acadJson);
  const companies = flattenCompanies(compJson);
  const titles = flattenTitles(roleJson);
  const awards = flattenAwards(awardsJson);

  await ensureDir(OUT_RESUMES_DIR);
  await ensureDir(OUT_LABELS_DIR);
  await ensureDir(path.dirname(OUT_JSONL));

  await fs.writeFile(OUT_JSONL, "", "utf-8");

  const manifest: any[] = [];

  for (let i = 0; i < count; i++) {
    const c = buildCandidate({ schools, companies, titles, awards }, rng, i);

    /* ---------- Build Label ---------- */
    const rawLabel = {
      schemaVersion: "v1",
      tier: "tier2_mid",
      academics: {
        ug_tier: 2,
        ug_institution: c.school,
        pg_institution: maybe(rng, 0.3) ? "NMIMS Mumbai" : undefined,

        // optional GMAT / CAT / XAT
        test_scores: maybe(rng, 0.3)
          ? {
              gmat: maybe(rng, 0.5) ? randBetween(rng, 580, 700) : undefined,
              cat: maybe(rng, 0.3) ? randBetween(rng, 70, 99) : undefined,
              xat: maybe(rng, 0.15) ? randBetween(rng, 50, 95) : undefined,
            }
          : undefined,
      },

      career: {
        total_years: c.yearsExp,
        current_role: c.title,
        role_level: roleLevelFromTitle(c.title),
        transitions: maybe(rng, 0.2)
          ? [{ from_role: "Analyst", to_role: c.title }]
          : [],
      },

      industry: {
        sector: /consult/i.test(c.title) ? "Consulting" : "Corporate/MNC",
        company_tier: mapTier(c.company.tierLabel),
        regions: ["IN"],
      },

      signals: {
        leadership: maybe(rng, 0.4),
        impact: true,
        international: maybe(rng, 0.1),
        tools: shufflePick(rng, ["Excel", "Power BI", "PowerPoint", "SQL"], 2),
      },

      geo: {
        primary_country: "IN",
        secondary_countries: maybe(rng, 0.1) ? ["SG"] : [],
      },

      extras: {
        awards: c.award ? [c.award] : [],
        social_work: maybe(rng, 0.15),
      },

      meta: {
        generator: "tier2MidGenerator",
        seed,
        version: "v1",
      },
    };

    /* ---------- SAFE PARSE: NEVER SKIPS ---------- */
    const parsed = LabelSchema.safeParse(rawLabel);
    const label = parsed.success ? parsed.data : LabelSchema.parse(rawLabel);

    /* ---------- Resume text ---------- */
    const resumeText = renderer.renderText({
      name: c.id,
      email: c.email,
      summary: c.summary,
      education: c.school,
      role: c.title,
      company: c.company.name,
      duration: `${c.start} – ${c.end}`,
      achievements: c.achievements,
    });

    /* ---------- Scores ---------- */
    const academicsScore = label.academics.ug_tier === 2 ? 7 : 5;
    const industryScore = 8 - label.industry.company_tier * 2;
    const leadershipScore = label.signals.leadership ? 7.5 : 4;

    const gmatScore =
      label.academics.test_scores?.gmat != null
        ? Math.min(10, label.academics.test_scores.gmat / 80)
        : 0;

    const overall =
      (academicsScore + industryScore + leadershipScore + gmatScore) / 4;

    /* ---------- Improvement + Recommendations ---------- */
    const reasoning = `UG Tier: ${label.academics.ug_tier}. Experience ${label.career.total_years} years at ${c.company.name}. Leadership: ${label.signals.leadership}.`;

    const recommendations = [];
    if (!label.signals.leadership)
      recommendations.push("Add leadership bullets.");
    if (!label.extras.awards?.length)
      recommendations.push("Add awards/achievements.");
    if (!label.academics.test_scores)
      recommendations.push("Include GMAT/CAT score.");

    const improvement = renderer.renderText({
      name: c.id,
      email: c.email,
      summary: `${c.title} with ${c.yearsExp}+ years experience.`,
      education: c.school,
      role: c.title,
      company: c.company.name,
      duration: `${c.start} – ${c.end}`,
      achievements: c.achievements.map(
        (a: string, i: number) => `${i + 1}. ${a} (impact quantified)`
      ),
    });

    /* ---------- Final JSONL record ---------- */
    const record = {
      id: c.id,
      resume_text: resumeText,
      label,
      scores: {
        academics: Number(academicsScore.toFixed(1)),
        industry: Number(industryScore.toFixed(1)),
        leadership: Number(leadershipScore.toFixed(1)),
        gmat: Number(gmatScore.toFixed(1)),
        overall: Number(overall.toFixed(2)),
      },
      reasoning,
      improvement,
      recommendations,
      meta: {
        generated_at: new Date().toISOString(),
        seed,
        generator: "tier2MidGenerator",
      },
    };

    await writeJsonl(OUT_JSONL, record);

    /* ---------- Save per-file resume + label ---------- */
    const base = `Candidate-${String(i + 1).padStart(4, "0")}`;
    await fs.writeFile(path.join(OUT_RESUMES_DIR, `${base}.txt`), resumeText);
    await fs.writeFile(
      path.join(OUT_LABELS_DIR, `${base}.json`),
      JSON.stringify(label, null, 2)
    );

    manifest.push({ id: c.id });

    if ((i + 1) % 50 === 0)
      console.log(`[tier2] ${i + 1}/${count}`);
  }

  await fs.writeFile(
    path.join(OUT_RESUMES_DIR, `manifest_tier2_${Date.now()}.json`),
    JSON.stringify(
      { count: manifest.length, generatedAt: new Date().toISOString(), samples: manifest },
      null,
      2
    )
  );

  console.log(`[tier2] DONE — ${manifest.length}/${count} samples`);
  return { ok: true, tier: "tier2_mid", count: manifest.length, outJsonl: OUT_JSONL };
}
