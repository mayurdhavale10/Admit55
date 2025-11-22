import { NextResponse } from "next/server";

// Explicitly import all generators
import generateTier1Raw from "@src/data/generation/generators/tier1EliteGenerator";
import generateTier2Raw from "@src/data/generation/generators/tier2MidGenerator";
import generateTier3Raw from "@src/data/generation/generators/tier3RegularGenerator";
import generateNonTraditionalRaw from "@src/data/generation/generators/nontraditionalGenerator";
import generateInternationalRaw from "@src/data/generation/generators/internationalGenerator";
import generateEdgeNoiseRaw from "@src/data/generation/generators/edgeNoiseGenerator";

/* -------------------------------------------------------------------------- */
/*                          STANDARDIZED GENERATOR TYPE                       */
/* -------------------------------------------------------------------------- */

type GeneratorFn = (
  count: number,
  seed?: number
) => Promise<{
  count: number;
  outDir?: string;
  labelsDir?: string;
}>;

/* ------------------------ CAST TO STANDARD SIGNATURE ---------------------- */
const generateTier1 = generateTier1Raw as GeneratorFn;
const generateTier2 = generateTier2Raw as GeneratorFn;
const generateTier3 = generateTier3Raw as GeneratorFn;
const generateNonTraditional = generateNonTraditionalRaw as GeneratorFn;
const generateInternational = generateInternationalRaw as GeneratorFn;
const generateEdgeNoise = generateEdgeNoiseRaw as GeneratorFn;

/* ----------------------- NEXT.JS DYNAMIC CONFIG --------------------------- */
export const dynamic = "force-dynamic";

/* ------------------------------ SUPPORTED TIERS --------------------------- */
type SupportedTier =
  | "tier1_elite"
  | "tier2_mid"
  | "tier3_regular"
  | "nontraditional"
  | "international"
  | "edge_noise";

const SUPPORTED_TIERS: SupportedTier[] = [
  "tier1_elite",
  "tier2_mid",
  "tier3_regular",
  "nontraditional",
  "international",
  "edge_noise",
];

/* ---------------------------- Utility Functions --------------------------- */

function parseNumber(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) && !Number.isNaN(n)
    ? Math.max(0, Math.floor(n))
    : fallback;
}

/* --------------------------------- ROUTE ---------------------------------- */

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => ({}));

    const tier = String(raw?.tier ?? "tier1_elite") as SupportedTier;

    // Default counts per tier
    const defaultCount =
      tier === "tier1_elite"
        ? 1000
        : tier === "tier2_mid"
        ? 2000
        : tier === "tier3_regular"
        ? 4500
        : tier === "nontraditional"
        ? 1000
        : tier === "international"
        ? 1000
        : tier === "edge_noise"
        ? 500
        : 1000;

    const n = parseNumber(raw?.n, defaultCount);
    const seed = parseNumber(raw?.seed, 42);

    if (!SUPPORTED_TIERS.includes(tier)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Unsupported tier: ${tier}. Supported: ${SUPPORTED_TIERS.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    console.log(
      `[API] Generating ${n} resumes for tier=${tier} (seed=${seed})`
    );

    let result: Awaited<ReturnType<GeneratorFn>>;

    /* ---------------------------- DISPATCH GENERATOR ---------------------------- */
    switch (tier) {
      case "tier1_elite":
        result = await generateTier1(n, seed);
        break;
      case "tier2_mid":
        result = await generateTier2(n, seed);
        break;
      case "tier3_regular":
        result = await generateTier3(n, seed);
        break;
      case "nontraditional":
        result = await generateNonTraditional(n, seed);
        break;
      case "international":
        result = await generateInternational(n, seed);
        break;
      case "edge_noise":
        result = await generateEdgeNoise(n, seed);
        break;
    }

    /* ---------------------------- SUCCESS RESPONSE ---------------------------- */
    return NextResponse.json({
      ok: true,
      tier,
      count: result?.count ?? n,
      output: result?.outDir ?? null,
      labels: result?.labelsDir ?? null,
    });
  } catch (err: any) {
    console.error("[synthetic/generate] ERROR", err);
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
