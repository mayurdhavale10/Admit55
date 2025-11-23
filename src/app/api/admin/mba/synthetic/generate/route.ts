import { NextResponse } from "next/server";

// ⭐ FIX: Force Node.js runtime so fs/path/crypto can run
export const runtime = "nodejs";

// Import default exports from generators
import generateTier1Elite from "@/src/data/generation/generators/tier1EliteGenerator";
import generateTier2Mid from "@/src/data/generation/generators/tier2MidGenerator";
import generateTier3Regular from "@/src/data/generation/generators/tier3RegularGenerator";
import generateNonTraditional from "@/src/data/generation/generators/nontraditionalGenerator";
import generateInternational from "@/src/data/generation/generators/internationalGenerator";
import generateEdgeNoise from "@/src/data/generation/generators/edgeNoiseGenerator";

export const dynamic = "force-dynamic";

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

function parseNumber(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) && !Number.isNaN(n)
    ? Math.max(0, Math.floor(n))
    : fallback;
}

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => ({}));
    const tier = String(raw?.tier ?? "tier1_elite") as SupportedTier;

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

    let result: { count: number; outDir?: string; outJsonl?: string };

    switch (tier) {
      case "tier1_elite":
        result = await generateTier1Elite(n, seed);
        break;
      case "tier2_mid":
        result = await generateTier2Mid(n, seed);
        break;
      case "tier3_regular":
        result = await generateTier3Regular(n, seed);
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
      default:
        throw new Error(`Unhandled tier: ${tier}`);
    }

    return NextResponse.json({
      ok: true,
      tier,
      count: result.count,
      output: result.outJsonl ?? result.outDir ?? null,
    });
  } catch (err: any) {
    console.error("[synthetic/generate] ERROR", err);
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}