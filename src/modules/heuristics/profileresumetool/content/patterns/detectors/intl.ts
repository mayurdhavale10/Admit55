// src/modules/heuristics/profileresumetool/content/patterns/detectors/intl.ts
// 🎯 PURPOSE: Detect international exposure (regions, duration, and evidence phrases)
// from resume text or normalized profile. Used for global exposure scoring in heuristics.

import type { NormalizedProfile } from "@src/modules/schemas/profileresumetool/types";

// 🌍 Common region keywords
const REGION_LEXICON = [
  "SEA", "ASEAN", "APAC", "EMEA", "EU", "Europe", "Africa", "Singapore",
  "Middle East", "GCC", "US", "USA", "North America", "LATAM", "South East Asia",
  "Southeast Asia", "UK", "Indonesia", "Malaysia", "Thailand", "Vietnam",
  "Philippines", "Nigeria", "Kenya", "Canada", "Australia", "Japan"
];

// 🌐 Phrases that imply cross-border/global experience
const PHRASES = [
  "international expansion",
  "launched in",
  "entered",
  "new markets",
  "cross-border",
  "multi-region",
  "multi-country",
  "global",
  "worked with teams in",
  "operated across",
  "regional presence"
];

/** Detects international exposure signals (regions, months, and textual evidence) */
export function detectInternational(profile: NormalizedProfile) {
  const evidence: string[] = [];
  const regions = new Set<string>();
  let months = 0;

  // ✅ Use normalized profile fields if already present
  if (profile.international?.regions) {
    profile.international.regions.forEach(r => regions.add(r));
  }
  if (profile.international?.months) {
    months = Math.max(months, profile.international.months);
  }
  if (profile.international?.evidence) {
    evidence.push(...profile.international.evidence);
  }

  // 🔍 Heuristic scan of each role + bullet text
  for (const r of profile.roles ?? []) {
    for (const b of r.bullets ?? []) {
      const t = b.text ?? "";

      // 🌎 Match region mentions
      for (const rx of REGION_LEXICON) {
        const re = new RegExp(`\\b${rx}\\b`, "i");
        if (re.test(t)) regions.add(rx);
      }

      // 🌍 Match cross-border/global phrases
      for (const p of PHRASES) {
        const re = new RegExp(p, "i");
        if (re.test(t)) evidence.push(p);
      }

      // ⏱️ Duration hints — e.g., “6 months”, “2 years”
      const mMatch = t.match(/\b(\d{1,2})\s*(?:months|mos)\b/i);
      if (mMatch) months = Math.max(months, Number(mMatch[1]));

      const yMatch = t.match(/\b(\d+)\s*years?\b/i);
      if (yMatch) months = Math.max(months, Number(yMatch[1]) * 12);

      // 🌏 Multi-country project mention
      if (/launched in (\d+)\+?\s?(?:countries|markets)/i.test(t)) {
        months = Math.max(months, 6); // assume minimum 6-month involvement
        evidence.push("multi-country launch");
      }
    }
  }

  // ✅ Return final structured signals
  return { regionsCount: regions.size, months, evidence };
}

export default detectInternational;
