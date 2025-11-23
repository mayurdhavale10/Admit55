// src/data/generation/generators/nontraditionalGenerator.ts
// FINAL SCHEMA-SAFE VERSION — NEVER SKIPS, ALWAYS EXACT COUNT

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
  "nontraditional"
);

const OUT_LABELS_DIR = path.join(
  ROOT,
  "data",
  "mba",
  "labels_normalized",
  "synthetic",
  "processed",
  "nontraditional"
);

const OUT_JSONL = path.join(
  ROOT,
  "data",
  "mba",
  "datasets",
  "sft_nontraditional_unified.jsonl"
);

const DEFAULT_COUNT = 1000;
const DEFAULT_SEED = 101;

/* UTILITIES */
async function ensureDir(p: string) { try { await fs.mkdir(p, { recursive: true }); } catch {} }

async function loadFeature<T = any>(rel: string): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(FEATURE_DIR, rel), "utf8")) as T;
  } catch {
    console.warn(`[nontraditional] Missing feature: ${rel}`);
    return {} as T;
  }
}

function rand(r: () => number, a: number, b: number) {
  return Math.floor(r() * (b - a + 1)) + a;
}
const maybe = (r: () => number, p = 0.5) => r() < p;

function choice<T>(r: () => number, arr: T[], fb: T): T {
  if (!arr?.length) return fb;
  return arr[Math.floor(r() * arr.length)];
}

function shufflePick<T>(r: () => number, arr: T[], n: number) {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c.slice(0, Math.min(n, c.length));
}

/* HELPERS */
function flattenAwards(json: any): string[] {
  const cat = json?.award_categories ?? {};
  const out: string[] = [];
  for (const k of Object.keys(cat)) {
    (cat[k]?.examples ?? []).forEach((x: string) => out.push(x));
  }
  return out;
}

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
  if (t.includes("chief") || t.includes("head") || t.includes("cxo") || t.includes("founder"))
    return "cxo";
  return "associate";
}

const mapOrgTier = (x: string) =>
  /startup/i.test(x) ? 2 :
  /ngo|trust|school|hospital|clinic/i.test(x) ? 3 : 3;

/* BUILD CANDIDATE */
function buildCandidate(r: () => number, awards: string[], idx: number) {
  const domains = ["Medicine", "Law", "Arts", "Design", "Media", "Teaching", "Sports"];
  const domain = choice(r, domains, "Arts");

  const degree = domain === "Law" ? "LLB"
    : domain === "Medicine" ? "MBBS"
    : domain === "Design" ? "B.Des"
    : domain === "Teaching" ? "B.Ed"
    : "BA";

  const schools = [
    "Govt. State University",
    "National Law University (Regional)",
    "Public Medical College",
    "Fine Arts Institute",
    "Design Academy",
    "Central University"
  ];

  const school = choice(r, schools, "State University");

  const titles: Record<string, string[]> = {
    Medicine: ["Resident Doctor", "Medical Officer", "Healthcare Analyst"],
    Law: ["Associate Lawyer", "Legal Consultant", "Compliance Officer"],
    Arts: ["Visual Artist", "Program Coordinator", "Curator"],
    Design: ["UX Designer", "Product Designer", "Graphic Designer"],
    Media: ["Journalist", "Content Writer", "Producer"],
    Teaching: ["Lecturer", "Teacher", "Curriculum Designer"],
    Sports: ["Coach", "Event Manager", "Athlete Coordinator"]
  };

  const title = choice(r, titles[domain] ?? ["Professional"], "Professional");
  const org = choice(r, ["NGO", "Startup", "College", "Hospital", "Studio"], "NGO");

  const years = rand(r, 3, 10);
  const startYear = 2025 - years;

  const achievements = shufflePick(r, [
    "Drove community impact improving outreach by {{pct}}%.",
    "Executed programs improving efficiency.",
    "Collaborated with stakeholders across domains.",
    "Built initiatives improving adoption of new workflows.",
  ], 3).map(x => x.replace("{{pct}}", String(rand(r, 10, 40))));

  return {
    id: `NT-${String(idx + 1).padStart(4, "0")}`,
    email: `nt_${idx}@example.com`,
    domain,
    degree,
    school,
    org,
    title,
    years,
    start: `${startYear}-01`,
    end: `2025-12`,
    achievements,
    award: maybe(r, 0.3) ? choice(r, awards, "Community Impact Award") : null,
  };
}

/* MAIN */
export default async function generateNonTraditional(
  count = DEFAULT_COUNT,
  seed = DEFAULT_SEED
) {
  const rng = makeRng(seed);
  const awardsJson = await loadFeature("awards/awards.json");
  const awards = flattenAwards(awardsJson);

  await ensureDir(OUT_RESUMES_DIR);
  await ensureDir(OUT_LABELS_DIR);
  await ensureDir(path.dirname(OUT_JSONL));

  await fs.writeFile(OUT_JSONL, ""); // clear

  console.log(`[nontraditional] Generating ${count}...`);

  let written = 0;

  for (let i = 0; i < count; i++) {
    const c = buildCandidate(rng, awards, i);

    /* SAFE SCHEMA */
    const labelRaw = {
      schemaVersion: "v1",
      tier: "nontraditional",
      academics: {
        ug_tier: 3,
        ug_institution: c.school,
        pg_institution: maybe(rng, 0.25) ? "ISB PGP" : undefined,
        test_scores: maybe(rng, 0.25) ? { gmat: rand(rng, 580, 700) } : {},
      },
      career: {
        total_years: c.years,
        current_role: c.title,
        role_level: roleLevelFromTitle(c.title),
        transitions: [{ from_role: c.domain, to_role: "Managerial" }],
      },
      industry: {
        sector: c.domain,
        company_tier: mapOrgTier(c.org),
        regions: ["IN"],
      },
      signals: {
        leadership: maybe(rng, 0.4),
        impact: true,
        international: maybe(rng, 0.15),
        tools: shufflePick(rng, ["Excel", "PowerPoint", "SQL"], 2),
      },
      geo: {
        primary_country: "IN",
        secondary_countries: maybe(rng, 0.15) ? ["SG"] : [],
      },
      extras: {
        awards: c.award ? [c.award] : [],
        social_work: maybe(rng, 0.35),
      },
      meta: {
        generator: "nontraditionalGenerator",
        seed,
        version: "v1",
      },
    };

    const parsed = LabelSchema.safeParse(labelRaw);
    const label = parsed.success ? parsed.data : LabelSchema.parse(labelRaw);

    const resumeText = renderer.renderText({
      name: c.id,
      email: c.email,
      summary: `${c.domain} professional with ${c.years}+ years’ experience.`,
      education: `${c.degree} — ${c.school}`,
      role: c.title,
      company: c.org,
      duration: `${c.start} – ${c.end}`,
      achievements: c.achievements,
    });

    const base = `Candidate-${String(i + 1).padStart(4, "0")}`;

    await fs.writeFile(
      path.join(OUT_RESUMES_DIR, `${base}.txt`),
      resumeText,
      "utf8"
    );

    await fs.writeFile(
      path.join(OUT_LABELS_DIR, `${base}.json`),
      JSON.stringify(label, null, 2),
      "utf8"
    );

    await fs.appendFile(
      OUT_JSONL,
      JSON.stringify({ id: c.id, resume_text: resumeText, label }) + "\n"
    );

    written++;
  }

  console.log(`[nontraditional] DONE — ${written}/${count}`);

  return {
    ok: true,
    tier: "nontraditional",
    count: written,
    output: OUT_RESUMES_DIR,
    labels: OUT_LABELS_DIR,
  };
}
