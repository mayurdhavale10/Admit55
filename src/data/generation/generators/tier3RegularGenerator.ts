// src/data/generation/generators/tier3RegularGenerator.ts
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
  "tier3_regular"
);

const OUT_LABELS_DIR = path.join(
  ROOT,
  "data",
  "mba",
  "labels_normalized",
  "synthetic",
  "processed",
  "tier3_regular"
);

const OUT_JSONL = path.join(
  ROOT,
  "data",
  "mba",
  "datasets",
  "sft_tier3_unified.jsonl"
);

const DEFAULT_COUNT = 2500;
const DEFAULT_SEED = 73;

/* ---------------- utilities ---------------- */
async function ensureDir(p: string) {
  try {
    await fs.mkdir(p, { recursive: true });
  } catch {}
}

async function loadFeature<T = any>(rel: string): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(FEATURE_DIR, rel), "utf8"));
  } catch {
    console.warn(`[tier3] Missing feature: ${rel}`);
    return {} as T;
  }
}

function randBetween(r: () => number, a: number, b: number) {
  return Math.floor(r() * (b - a + 1)) + a;
}
function maybe(r: () => number, p = 0.5) {
  return r() < p;
}
function choice<T>(r: () => number, arr: T[], fb: T): T {
  if (!arr?.length) return fb;
  return arr[Math.floor(r() * arr.length)];
}
function shufflePick<T>(r: () => number, arr: T[], n = 1) {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c.slice(0, Math.min(n, c.length));
}

/* ---------------- flatteners ---------------- */
function flattenSchools(acad: any): string[] {
  const out: string[] = [];
  const buckets = acad?.colleges ?? {};
  for (const k of Object.keys(buckets)) {
    for (const it of buckets[k] ?? []) out.push(it?.name ?? String(it));
  }
  return out;
}

type FlatCompany = {
  name: string;
  tierLabel: string;
  tierScore: number;
  approxTier: number;
};

function flattenCompanies(comp: any): FlatCompany[] {
  const tiers = comp?.tiers ?? {};
  const keys = Object.keys(tiers);
  const approx = (k: string) => Math.max(1, keys.indexOf(k) + 1);

  const out: FlatCompany[] = [];
  for (const k of keys) {
    const def = tiers[k];
    const score = def?.tier_score ?? 0.5;
    (def?.examples ?? []).forEach((name: string) =>
      out.push({
        name,
        tierLabel: k,
        tierScore: score,
        approxTier: approx(k),
      })
    );
  }
  return out;
}

function flattenRoles(roleCats: any): string[] {
  const out = new Set<string>();
  const rc = roleCats?.role_categories ?? {};
  for (const k of Object.keys(rc)) {
    (rc[k]?.examples ?? []).forEach((t: string) => out.add(t));
  }
  return [...out];
}

function flattenAwards(a: any): string[] {
  const out: string[] = [];
  const cat = a?.award_categories ?? {};
  for (const k of Object.keys(cat)) {
    (cat[k]?.examples ?? []).forEach((x: string) => out.push(x));
  }
  return out;
}

/* ---------------- helpers ---------------- */
function roleLevelFromTitle(t: string): string {
  t = t.toLowerCase();
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

function mapCompanyTier(label: string): number {
  if (/Tier_1/i.test(label)) return 1;
  if (/Tier_2|Tier_3/i.test(label)) return 2;
  return 3;
}

/* ---------------- candidate ---------------- */
function buildCandidate(pools: any, rng: () => number, idx: number) {
  const school = choice(rng, pools.schools, "University of Mumbai");
  const company = choice(rng, pools.companies, {
    name: "TCS",
    tierLabel: "Tier_5_Common_IT_Majors",
    tierScore: 0.5,
    approxTier: 3,
  });
  const title = choice(rng, pools.titles, "Operations Executive");

  const years = randBetween(rng, 1, 6);
  const end = 2025;
  const start = end - years;

  return {
    id: `Candidate-T3-${String(idx + 1).padStart(5, "0")}`,
    email: `t3_${idx}@example.com`,
    school,
    company,
    title,
    years,
    summary: `${title} with ${years}+ years at ${company.name}.`,
    startDate: `${start}-01`,
    endDate: `${end}-12`,
    achievements: shufflePick(rng, [
      "Improved operations by 20%.",
      "Reduced delays by implementing new SOPs.",
      "Built reports and managed client communication.",
    ], 3),
    award: maybe(rng, 0.15) ? "Best Performer" : null,
  };
}

/* ---------------- generator ---------------- */
export default async function generateTier3(
  count = DEFAULT_COUNT,
  seed = DEFAULT_SEED
) {
  const rng = makeRng(seed);

  const acad = await loadFeature("academics/tier3_regular.json");
  const comp = await loadFeature("industry/company_tiers.json");
  const roles = await loadFeature("jobrole/role_categories.json");
  const awardsFile = await loadFeature("awards/awards.json");

  const schools = flattenSchools(acad);
  const companies = flattenCompanies(comp);
  const titles = flattenRoles(roles);
  const awards = flattenAwards(awardsFile);

  await ensureDir(OUT_RESUMES_DIR);
  await ensureDir(OUT_LABELS_DIR);
  await ensureDir(path.dirname(OUT_JSONL));

  await fs.writeFile(OUT_JSONL, ""); // clear JSONL

  let written = 0;

  for (let i = 0; i < count; i++) {
    const c = buildCandidate({ schools, companies, titles, awards }, rng, i);

    const labelRaw = {
      schemaVersion: "v1",
      tier: "tier3_regular",
      academics: {
        ug_tier: 3,
        ug_institution: c.school,
        pg_institution: maybe(rng, 0.15)
          ? "Local University MBA"
          : undefined,
        test_scores: maybe(rng, 0.2)
          ? { gmat: randBetween(rng, 580, 650) }
          : {},
      },
      career: {
        total_years: c.years,
        current_role: c.title,
        role_level: roleLevelFromTitle(c.title),
        transitions: maybe(rng, 0.15)
          ? [{ from_role: "Executive", to_role: c.title }]
          : [],
      },
      industry: {
        sector: "Corporate/MNC",
        company_tier: mapCompanyTier(c.company.tierLabel),
        regions: ["IN"],
      },
      signals: {
        leadership: maybe(rng, 0.25),
        impact: true,
        international: maybe(rng, 0.10),
        tools: shufflePick(rng, ["Excel", "PowerPoint", "SQL"], 2),
      },
      geo: {
        primary_country: "IN",
        secondary_countries: [],
      },
      extras: {
        awards: c.award ? [c.award] : [],
        social_work: maybe(rng, 0.10),
      },
      meta: {
        generator: "tier3RegularGenerator",
        seed,
        version: "v1",
      },
    };

    const parsed = LabelSchema.safeParse(labelRaw);
    const label = parsed.success ? parsed.data : LabelSchema.parse(labelRaw);

    const resume = renderer.renderText({
      name: c.id,
      email: c.email,
      summary: c.summary,
      education: c.school,
      role: c.title,
      company: c.company.name,
      duration: `${c.startDate} – ${c.endDate}`,
      achievements: c.achievements,
    });

    // write txt + json
    const fname = `Candidate-${String(i + 1).padStart(4, "0")}`;
    await fs.writeFile(
      path.join(OUT_RESUMES_DIR, `${fname}.txt`),
      resume,
      "utf8"
    );
    await fs.writeFile(
      path.join(OUT_LABELS_DIR, `${fname}.json`),
      JSON.stringify(label, null, 2),
      "utf8"
    );

    // write JSONL
    await fs.appendFile(
      OUT_JSONL,
      JSON.stringify({ id: c.id, resume_text: resume, label }) + "\n"
    );

    written++;
  }

  return {
    ok: true,
    tier: "tier3_regular",
    count: written,
    output: OUT_RESUMES_DIR,
    labels: OUT_LABELS_DIR,
  };
}
