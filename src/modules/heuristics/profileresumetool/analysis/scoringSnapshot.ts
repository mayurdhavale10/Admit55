// src/modules/core-gap/profileresumetool/scoringSnapshot.ts
import type { SignalBundle } from "@src/modules/schemas/profileresumetool/types";

export type Subscores = {
  academics: number;
  testReadiness: number;
  workImpact: number;
  leadership: number;
  extracurriculars: number;
  internationalExposure: number;
  /** @deprecated – use testReadiness. Kept for backward-compat in tests. */
  test?: number;
};

export type ScoreResult = {
  subscores: Subscores;
  band: "Needs Focus" | "Emerging" | "Competitive" | "Strong" | "Top 10%";
};

// Back-compat alias if other files imported this name:
export type SnapshotScoreResult = ScoreResult;

export function scoreSnapshot(s: SignalBundle): ScoreResult {
  // ----- Academics -----
  let academics = 5;
  if (s.academics.rigorousDegree) academics += 1;
  if (s.academics.tier1) academics = Math.max(academics, 8); // FLOOR
  academics = clamp01(academics);

  // ----- Test -----
  let test = 5;
  if (s.test.actual) {
    const eq = s.test.actual;
    if (eq >= 740) test = 9;
    else if (eq >= 720) test = 8;
    else if (eq >= 700) test = 7;
    else if (eq >= 660) test = 6;
    else test = 5;
  } else if (s.test.target) {
    // CAP 6 when target-only
    test = Math.min(6, 5 + (s.test.target >= 720 ? 1 : 0));
  }
  test = clamp01(test);

  // ----- Work Impact -----
  let impact = 4;
  if (s.impact.anyPct20Plus) impact = Math.max(impact, 8);
  if (s.impact.anyLargeMoney) impact = Math.max(impact, 8);
  if (s.impact.launchesCount >= 2) impact = Math.max(impact, 8);
  if (s.impact.launchesCount >= 4) impact = Math.max(impact, 9);
  impact = clamp01(impact);

  // ----- Leadership -----
  let leadership = 4;
  if (s.leadership.crossFunctional) leadership += 1;
  const bandBoost =
    s.leadership.ledBand === "led_10_plus"
      ? 3
      : s.leadership.ledBand === "led_4_10"
      ? 2
      : s.leadership.ledBand === "led_1_3"
      ? 1
      : 0;
  leadership += bandBoost;
  if (s.leadership.execOffice) leadership = Math.max(leadership, 8); // FLOOR for CEO’s Office/Strategy Lead
  leadership = clamp01(leadership);

  // ----- ECs -----
  let ec = 3;
  if (s.ec.hasCurrent) ec += 2;
  if (s.ec.leadership) ec += 2;
  ec = clamp01(ec);

  // ----- International -----
  let intl = 2;
  if (s.intl.regionsCount >= 2) intl = Math.max(intl, 6);
  if (s.intl.regionsCount >= 3) intl = Math.max(intl, 7);
  if (s.intl.months >= 6) intl = Math.max(intl, 7);
  if (s.intl.months >= 12) intl = Math.max(intl, 8);
  intl = clamp01(intl);

  const subscores: Subscores = {
    academics,
    testReadiness: test,
    workImpact: impact,
    leadership,
    extracurriculars: ec,
    internationalExposure: intl,
    // legacy alias for older tests:
    test,
  };

  const weights = {
    academics: 0.15,
    testReadiness: 0.20,
    workImpact: 0.30,
    leadership: 0.20,
    extracurriculars: 0.05,
    internationalExposure: 0.10,
  };

  const overall =
    academics * weights.academics +
    test * weights.testReadiness +
    impact * weights.workImpact +
    leadership * weights.leadership +
    ec * weights.extracurriculars +
    intl * weights.internationalExposure;

  const band: ScoreResult["band"] =
    overall >= 8.8
      ? "Top 10%"
      : overall >= 7.8
      ? "Strong"
      : overall >= 6.8
      ? "Competitive"
      : overall >= 5.5
      ? "Emerging"
      : "Needs Focus";

  return { subscores, band };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(10, Math.round(n)));
}
