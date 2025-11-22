// src/modules/heuristics/profileresumetool/content/patterns/detectors/leadership.ts
// 🎯 PURPOSE: Detect and score leadership, ownership, and collaboration signals from resume text.
// Used by the heuristic scoring engine to quantify managerial strength and leadership diversity.

import leadershipPatterns from "../leadershipPhrases.json";

/** Heuristic output type for leadership signals */
export type LeadershipSignal = {
  leadershipScore: number;  // 0–1 normalized leadership strength
  categories: string[];     // categories hit, e.g. ["strong", "xfn", "strategic"]
  matchedPhrases: string[]; // matched raw patterns for audit/debug
};

/** 
 * Detect leadership & collaboration indicators.
 * Weighted scoring ensures balanced influence of categories.
 */
export function detectLeadershipSignals(text: string): LeadershipSignal {
  const t = (text || "").toLowerCase();
  let score = 0;
  const categories: string[] = [];
  const matchedPhrases: string[] = [];

  // 🧭 Leadership dimension weights
  const weights: Record<string, number> = {
    strong: 0.18,            // Direct ownership, formal leadership, team building
    xfn: 0.14,               // Cross-functional collaboration
    mentorship: 0.10,        // Coaching / team growth / people development
    strategic: 0.20,         // Direction-setting, vision, roadmap
    influence: 0.18,         // Decision-making, C-suite or executive impact
    client_leadership: 0.15, // External-facing / account or client management
    initiative: 0.12,        // Self-driven or founder-like initiatives
    change: 0.10             // Transformation, restructuring, change management
  };

  // 🧩 Match patterns from leadershipPhrases.json
  for (const [category, patterns] of Object.entries(leadershipPatterns)) {
    for (const p of patterns) {
      // Match using fuzzy substring (case-insensitive)
      const re = new RegExp(`\\b${p.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(t)) {
        categories.push(category);
        matchedPhrases.push(p);
        score += weights[category] ?? 0.1;
        break; // avoid double-counting per category
      }
    }
  }

  // 🔧 Bonus heuristics: infer leadership even if explicit keywords are missing
  if (/team of \d+|managed \d+ people|led a team|head of/i.test(t)) {
    if (!categories.includes("strong")) {
      categories.push("strong");
      matchedPhrases.push("team size indicator");
      score += 0.15;
    }
  }
  if (/stakeholder|cross-functional|sales and product|engineering and design/i.test(t)) {
    if (!categories.includes("xfn")) {
      categories.push("xfn");
      matchedPhrases.push("cross-functional collaboration");
      score += 0.1;
    }
  }

  // 🔢 Normalize final score to 0–1
  const leadershipScore = Math.min(1, Number(score.toFixed(2)));

  return { leadershipScore, categories, matchedPhrases };
}

/** 
 * 🧪 Test block for standalone execution
 * Run `ts-node leadership.ts` to see sample output
 */
if (require.main === module) {
  const sample =
    "Spearheaded a cross-functional team of 10 engineers and designers, defined strategy, and mentored interns while driving client success initiatives.";
  console.log(detectLeadershipSignals(sample));
}

export default detectLeadershipSignals;
