// src/tests/scoring-floors-caps.test.ts
import { describe, it, expect } from "vitest";
import { scoreSnapshot } from "@/src/modules/heuristics/profileresumetool/analysis/scoringSnapshot";

describe("Scoring floors & caps", () => {
  it("applies floors (tier1, CEO office) and caps (target-only test)", () => {
    const signals = {
      academics: { tier1: true, rigorousDegree: true },
      test: { target: 720, providedAsTargetOnly: true, descriptor: "Target GMAT 720" },
      impact: { anyPct20Plus: true, anyLargeMoney: true, launchesCount: 6 },
      leadership: { crossFunctional: true, ledBand: "led_4_10", execOffice: true },
      ec: { hasCurrent: false, leadership: false },
      intl: { regionsCount: 3, months: 12 },
      meta: { yoeBand: "5-7", functionArea: "product / strategy" },
      provenance: { method: "llm", confidence: 0.8 },
    } as any;

    const res = scoreSnapshot(signals);
    expect(res.subscores.academics).toBeGreaterThanOrEqual(8);
    expect(res.subscores.leadership).toBeGreaterThanOrEqual(8);
    expect(res.subscores.test).toBeLessThanOrEqual(6); // cap for target-only
  });
});
