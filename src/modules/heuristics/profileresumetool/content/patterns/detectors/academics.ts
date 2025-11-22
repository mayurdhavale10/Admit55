// src/modules/heuristics/profileresumetool/content/patterns/detectors/academics.ts
// Finds out how academically rigorous or prestigious the person’s education background is.

import tiers from "../schoolTiers.json" assert { type: "json" };
import type { NormalizedProfile } from "@src/modules/schemas/profileresumetool/types";

/**
 * Strong / analytical disciplines considered "rigorous".
 */
const RIGOR_DEGREES = [
  "engineering",
  "computer science",
  "math",
  "physics",
  "chemistry",
  "economics",
  "statistics",
  "operations research",
  "finance",
  "data science",
  "machine learning",
  "information technology",
  "mechanical",
  "electrical",
  "civil engineering",
  "biotechnology"
];

/**
 * Normalize text for fuzzy matching
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[.,\-_/]/g, " ").trim();
}

/**
 * Compute fuzzy match score between two strings (Jaccard-like)
 */
function fuzzyMatchScore(a: string, b: string): number {
  const A = new Set(a.split(/\s+/));
  const B = new Set(b.split(/\s+/));
  const intersection = [...A].filter(x => B.has(x)).length;
  return intersection / Math.max(A.size, B.size);
}

/**
 * Detect academic pedigree (tier + rigor) from profile.education[]
 */
export function detectAcademics(profile: NormalizedProfile) {
  const educationEntries = profile.education ?? [];

  let bestMatch = {
    tier: 6,
    weight: 0.9,
    confidence: 0,
    matchedInstitution: null as string | null,
    rigorousDegree: false
  };

  for (const edu of educationEntries) {
    const schoolRaw = (edu.school || "").toLowerCase();
    const disciplineRaw = (edu.discipline || edu.degree || "").toLowerCase();
    const tierHint = (edu.tierHint || "").toLowerCase();

    // ---- Check degree rigor
    if (!bestMatch.rigorousDegree) {
      if (RIGOR_DEGREES.some(d => disciplineRaw.includes(d))) {
        bestMatch.rigorousDegree = true;
      }
    }

    // ---- Tier hint override (from LLM or source)
    if (tierHint && tierHint.includes("tier1")) {
      bestMatch = {
        ...bestMatch,
        tier: 1,
        weight: 1.45,
        confidence: 1,
        matchedInstitution: "tierHint (LLM)"
      };
      continue;
    }

    // ---- Check school against tier list
    const normalizedSchool = normalize(schoolRaw);
    let localBest = { tier: 6, weight: 0.9, confidence: 0, matchedInstitution: null as string | null };

    for (const tier of (tiers as any).tiers) {
      for (const inst of tier.institutions) {
        const score = fuzzyMatchScore(normalizedSchool, normalize(inst));
        if (score >= 0.6 && score > localBest.confidence) {
          localBest = {
            tier: tier.id,
            weight: tier.weight,
            confidence: score,
            matchedInstitution: inst
          };
        }
      }
    }

    // ---- Keep best overall match
    if (localBest.confidence > bestMatch.confidence) {
      bestMatch = { ...bestMatch, ...localBest };
    }
  }

  // ---- Fallback: if no school found, default to lowest tier
  if (!bestMatch.matchedInstitution) {
    bestMatch.tier = 6;
    bestMatch.weight = 0.9;
    bestMatch.confidence = 0;
  }

  return {
    tier: bestMatch.tier,
    weight: bestMatch.weight,
    confidence: bestMatch.confidence,
    matchedInstitution: bestMatch.matchedInstitution,
    rigorousDegree: bestMatch.rigorousDegree
  };
}

/**
 * Example usage (debugging)
 */
if (require.main === module) {
  const sampleProfile: NormalizedProfile = {
    education: [
      { school: "AIIMS Delhi", degree: "MBBS", discipline: "Medicine" },
      { school: "IIT Bombay", degree: "B.Tech", discipline: "Computer Science" }
    ]
  } as any;

  console.log(detectAcademics(sampleProfile));
}

export default detectAcademics;
