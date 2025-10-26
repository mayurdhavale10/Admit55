import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/src/modules/repo-profileresumetool/profiles";
import { analyzeMetrics } from "@/src/modules/core-nlp/metrics";
import { analyzeVerbs } from "@/src/modules/core-nlp/verbs";
import { analyzeLength } from "@/src/modules/core-nlp/length";
import { analyzeKeywords } from "@/src/modules/core-nlp/keywords";
import { analyzeDuplicates } from "@/src/modules/core-nlp/dedupe";
import { analyzeConsistency } from "@/src/modules/core-nlp/consistency";
import { pickTopBullets } from "@/src/modules/core-gap/profileresumetool/topBullets";

type Body = { userId?: string; track?: string };

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId, track = "product_management" } = (await req.json()) as Body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const pr = await getProfile(userId);
    if (!pr) {
      return NextResponse.json({ error: "profile not found" }, { status: 404 });
    }

    const metrics = analyzeMetrics(pr);
    const verbs = analyzeVerbs(pr);
    const length = analyzeLength(pr);
    const keywords = analyzeKeywords(pr, track);
    const duplicates = analyzeDuplicates(pr);
    const consistency = analyzeConsistency(pr);
    const topBulletsToFix = pickTopBullets({ metrics, verbs, length, keywords });

    return NextResponse.json({
      track,
      metrics,
      verbs,
      length,
      keywords,
      duplicates,
      consistency,
      topBulletsToFix,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("ANALYZE_ROUTE_ERROR:", message); // console allowed safely
    return NextResponse.json({ error: "internal_error", message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic"; // ensures fresh per-request compute
