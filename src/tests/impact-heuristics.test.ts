// src/tests/impact-heuristics.test.ts
import { describe, it, expect } from "vitest";
import { impactSignalsFromText } from "@/src/modules/heuristics/profileresumetool/content/patterns/detectors/impact";

describe("Impact heuristics", () => {
  it("detects %/x/Crore/AOV/conversion", () => {
    const t = `
      Drove 15% YoY growth; Increased AOV by 9%;
      200Cr transaction value; conversion to 31.2% from 4%;
      Launched 6+ products; 2.3x engagement.
    `;
    const sig = impactSignalsFromText(t);
    expect(sig.anyPct20Plus).toBe(false); // 15% < 20 (example)
    expect(sig.anyLargeMoney).toBe(true); // 200Cr
    expect(sig.launchesCount).toBeGreaterThanOrEqual(1);
  });
});
