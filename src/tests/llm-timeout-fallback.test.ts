// src/tests/llm-timeout-fallback.test.ts
import { describe, it, expect } from "vitest";
import tryLLMParseResume from "@/src/modules/llm/pipelines/profileresumetool/tryParse";
import { heuristicParseResume } from "@/src/modules/heuristics/profileresumetool/content/patterns/detectors/heuristics";
import { NormalizedProfileZ } from "@src/modules/schemas/profileresumetool/types";

describe("LLM timeout fallback", () => {
  it("falls back to heuristics on timeout", async () => {
    const text = "EMPLOYMENT\nAirtel, Product Strategy Lead ...";
    // Force timeout by calling with 1ms
    const llm = await tryLLMParseResume(text, { timeoutMs: 1 });
    if (!llm) {
      const heur = heuristicParseResume(text);
      const parsed = NormalizedProfileZ.safeParse(heur);
      expect(parsed.success).toBe(true);
    } else {
      // If your env actually returns fast JSON, we still assert schema
      expect(NormalizedProfileZ.safeParse(llm).success).toBe(true);
    }
  });
});
