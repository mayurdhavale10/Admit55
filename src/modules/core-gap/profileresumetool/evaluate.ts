import { analyzeMetrics } from "@/src/modules/core-nlp/metrics";
import { analyzeVerbs } from "@/src/modules/core-nlp/verbs";
import { analyzeLength } from "@/src/modules/core-nlp/length";
import { analyzeKeywords } from "@/src/modules/core-nlp/keywords";
import { analyzeDuplicates } from "@/src/modules/core-nlp/dedupe";
import { analyzeConsistency } from "@/src/modules/core-nlp/consistency";
import { scoreDimensions } from "./scoring";
import { computeGaps } from "./gaps";
import { EVAL_VERSION } from "./constants";
import type { EvaluationOutput, PersonaKey } from "@/src/modules/schemas/profileresumetool/evaluation";
import type { ProfileResume } from "@/src/modules/schemas/profileresumetool/types";

export function evaluateProfile(pr: ProfileResume, opts: { persona: PersonaKey; track?: string }): EvaluationOutput {
  const persona = opts.persona;
  const track = opts.track ?? "product_management";

  const metrics = analyzeMetrics(pr);
  const verbs = analyzeVerbs(pr);
  const length = analyzeLength(pr);
  const keywords = analyzeKeywords(pr, track);
  const duplicates = analyzeDuplicates(pr);
  const consistency = analyzeConsistency(pr);

  const { dimensions, readiness } = scoreDimensions({ persona, metrics, verbs, length, keywords, dedupe: duplicates, consistency });
  const gaps = computeGaps({ metrics, verbs, length, keywords, dedupe: duplicates, consistency });

  return {
    version: EVAL_VERSION,
    persona,
    readiness,
    dimensions,
    gaps,
    trace: {
      rulesApplied: ["score.dimensions.v1", "gaps.core.v1"],
      extraction: {
        metrics: { overallDensity: metrics.overallDensity },
        keywords: { coverage: keywords.coverage },
        length: { longShare: length.longShare }
      }
    }
  };
}
