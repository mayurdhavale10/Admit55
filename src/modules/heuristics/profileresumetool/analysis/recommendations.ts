// src/modules/core-gap/profileresumetool/recommendations.ts
import type { ScoreResult } from "./scoringSnapshot";

export type SnapshotRecommendations = {
  strengths: string[];
  gaps: string[];
  next6Weeks: string[];
  next90Days: string[];
  essayAngles: string[];
};

export function buildSnapshotRecommendations(score: ScoreResult): SnapshotRecommendations {
  const s = score.subscores;

  const strengths: string[] = [];
  const gaps: string[] = [];
  const next6Weeks: string[] = [];
  const next90Days: string[] = [];
  const essayAngles: string[] = [];

  // ------ Strengths ------
  if (s.workImpact >= 8) strengths.push("Material business impact signals (≥20% lifts / ₹Cr+ / multi-launches).");
  if (s.leadership >= 8) strengths.push("Executive-level or cross-functional leadership scope.");
  if (s.internationalExposure >= 7) strengths.push("Credible international exposure across regions/time.");
  if (s.academics >= 8) strengths.push("Strong academic foundation / Tier-1 pedigree.");
  if (s.testReadiness >= 8) strengths.push("Competitive test readiness.");

  // ------ Gaps ------
  if (s.extracurriculars <= 5) gaps.push("Extracurricular leadership depth and continuity.");
  if (s.internationalExposure <= 5) gaps.push("Sustained cross-border scope with concrete evidence.");
  if (s.testReadiness <= 6) gaps.push("Evidence of actual test score vs target-only.");
  if (s.workImpact <= 6) gaps.push("Quantified outcome scale (revenue, %, x-multiple, P&L).");
  if (s.leadership <= 6) gaps.push("Explicit people leadership or multi-team ownership.");

  // ------ Plans (personalized by low subscores) ------
  // EC low
  if (s.extracurriculars <= 5) {
    next6Weeks.push(
      "Commit 2–3 hrs/week to a skills-aligned NGO/community. Own a micro-project with a measurable KPI (e.g., +20% throughput)."
    );
    next90Days.push(
      "Hold a formal leadership title in that org; deliver a KPI readout and codify the playbook for repeatability."
    );
  }

  // Intl low
  if (s.internationalExposure <= 5) {
    next6Weeks.push(
      "Attach to a 2-country pilot (or partner team overseas). Own async comms, risk log, and timezone cadence."
    );
    next90Days.push(
      "Ship a cross-border GTM/process deck with metrics (onboarding time, success rate, defects) and scale to a 3rd market."
    );
  }

  // Test low (target-only)
  if (s.testReadiness <= 6) {
    next6Weeks.push("Fix your test plan: weekly mock cadence, quant/IR drills, hit target accuracy on weak sections.");
    next90Days.push("Publish an official or proctored mock score ≥ 720 equivalent (if GMAT) and reference it explicitly.");
  }

  // Impact low
  if (s.workImpact <= 6) {
    next6Weeks.push(
      "Select one product/process with clear P&L linkage. Define a 20% lift or ≥2x multiple target; instrument the baseline."
    );
    next90Days.push(
      "Deliver the lift and present the business impact (₹ / %, x). Get the result acknowledged in performance artifacts."
    );
  }

  // Leadership low
  if (s.leadership <= 6) {
    next6Weeks.push(
      "Lead a cross-functional workstream (product–eng–sales). Define RACI; publish weekly outcomes to stakeholders."
    );
    next90Days.push(
      "Scale scope (multi-team / 5–10 ppl); land a formal lead/POC title and document decisions/impact in a memo."
    );
  }

  // ------ Essay angles (tailored by top strengths) ------
  if (s.workImpact >= 8) essayAngles.push("Outcome-first builder: repeated, measurable lifts tied to revenue/P&L.");
  if (s.leadership >= 8) essayAngles.push("Operator-leader: aligning cross-functional teams to ship fast.");
  if (s.internationalExposure >= 7) essayAngles.push("Global interface: navigating markets, compliance, and timezone complexity.");
  if (s.academics >= 8) essayAngles.push("Analytical rigor: tier-1 academics applied to execution.");
  if (essayAngles.length === 0) {
    essayAngles.push("Growth mindset: identify gaps → build a plan → execute with measurable results.");
  }

  // Fallbacks so UI never looks empty
  if (!strengths.length) strengths.push("You have credible momentum in at least one area — make it undeniable with numbers.");
  if (!next6Weeks.length) next6Weeks.push("Pick one initiative with measurable impact; define KPI and weekly review rhythm.");
  if (!next90Days.length) next90Days.push("Ship a repeatable playbook and secure a formal recognition/title.");

  return { strengths, gaps, next6Weeks, next90Days, essayAngles };
}
