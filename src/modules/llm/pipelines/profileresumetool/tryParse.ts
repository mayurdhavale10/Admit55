// src/modules/core-nlp/extractors/tryLLMParseResume.ts
import { createHash } from "crypto";
import { NormalizedProfileZ, type NormalizedProfile } from "@src/modules/schemas/profileresumetool/types";
import { openAiClient } from "@src/modules/llm/provider/adapters/openaiClient";


/* ----------------------------- tiny helpers ----------------------------- */

function sha256(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

const mem = new Map<string, string>(); // key -> JSON string
function cacheGet(key: string) { return mem.get(key) ?? null; }
function cacheSet(key: string, raw: string) { mem.set(key, raw); }

function withTimeout<T>(p: Promise<T>, ms: number) {
  return new Promise<T>((res, rej) => {
    const t = setTimeout(() => rej(new Error("llm_timeout")), ms);
    p.then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); });
  });
}

function tryRepairJson(raw: string): string | null {
  let s = raw.trim();
  const first = s.indexOf("{"); const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) s = s.slice(first, last + 1);
  s = s.replace(/,\s*([}\]])/g, "$1").replace(/“|”/g, '"').replace(/‘|’/g, "'");
  try { JSON.parse(s); return s; } catch { return null; }
}

function splitByRoleBlocks(text: string): string[] {
  const parts = text
    .split(/\n{2,}|(?:^|\n)(?:EMPLOYMENT|EXPERIENCE|WORK|PROFESSIONAL)\b/gi)
    .map(s => s.trim())
    .filter(Boolean);
  if (parts.join("").length < text.replace(/\s+/g, "").length * 0.5) return [text];
  return parts.slice(0, 10);
}

/* ------------------------------ LLM schema ------------------------------ */

const SYSTEM = `
You are a strict JSON generator. Return ONLY valid JSON matching this TypeScript-like schema (omit unknown keys):

{
  "education": [{"school": string, "degree"?: string, "discipline"?: string, "tierHint"?: "tier1"|"tier2"|"other"}],
  "roles": [{"company"?: string, "title"?: string, "start"?: string, "end"?: string, "location"?: string,
             "bullets": [{"text": string,
                          "metrics"?: {"pct"?: number, "value"?: number, "currency"?: string, "multiple"?: number},
                          "scope"?: {"teamSize"?: number, "budget"?: number, "regions"?: string[]}}]}],
  "tests"?: {"type"?: "GMAT"|"GRE", "actual"?: number, "target"?: number, "descriptor"?: string},
  "extracurriculars": [{"text": string, "leadership"?: boolean, "recency"?: "past"|"current"}],
  "international"?: {"regions"?: string[], "months"?: number, "evidence"?: string[]},
  "awards"?: string[]
}
Return ONLY JSON.
`.trim();

async function callGuardedLLM(text: string, timeoutMs = 4500): Promise<{ raw: string; profile: NormalizedProfile }> {
  const user = `Resume text:\n"""${text}"""\nReturn ONLY JSON.`;
  const raw = await withTimeout(openAiClient(`${SYSTEM}\n${user}`), timeoutMs);

  let jsonStr = raw.trim();
  try {
    JSON.parse(jsonStr);
  } catch {
    const repaired = tryRepairJson(jsonStr);
    if (!repaired) throw new Error("llm_invalid_json");
    jsonStr = repaired;
  }

  const parsed = NormalizedProfileZ.safeParse(JSON.parse(jsonStr));
  if (!parsed.success) throw new Error("llm_schema_mismatch");
  return { raw: jsonStr, profile: parsed.data };
}

/* ----------------------------- main function ---------------------------- */

/**
 * Tries LLM parse with caching, role-chunking, timeout, and schema validation.
 * Returns NormalizedProfile or null on any error/timeout.
 */
async function _tryLLMParseResume(
  text: string,
  opts?: { timeoutMs?: number }
): Promise<NormalizedProfile | null> {
  const key = "resume:" + sha256(text);
  const cached = cacheGet(key);
  if (cached) {
    try { return JSON.parse(cached) as NormalizedProfile; } catch { /* ignore */ }
  }

  try {
    const chunks = splitByRoleBlocks(text);

    // Single-shot
    if (chunks.length === 1) {
      const { profile } = await callGuardedLLM(text, opts?.timeoutMs ?? 4500);
      cacheSet(key, JSON.stringify(profile));
      return profile;
    }

    // Map (parallel) → Reduce (merge)
    const partials = await Promise.allSettled(
      chunks.map(c => callGuardedLLM(c, Math.max(2500, (opts?.timeoutMs ?? 4500) - 500)))
    );

    const merged: NormalizedProfile = {
      education: [],
      roles: [],
      extracurriculars: [],
      international: undefined,
      tests: undefined,
      awards: [],
    };

    for (const p of partials) {
      if (p.status !== "fulfilled") continue;
      const prof = p.value.profile;
      if (prof.education?.length) merged.education.push(...prof.education);
      if (prof.roles?.length) merged.roles.push(...prof.roles);
      if (prof.extracurriculars?.length) merged.extracurriculars.push(...prof.extracurriculars);
      if (!merged.international && prof.international) merged.international = prof.international;
      if (!merged.tests && prof.tests) merged.tests = prof.tests;
      if (prof.awards?.length) merged.awards!.push(...prof.awards);
    }

    // Final validation
    const ok = NormalizedProfileZ.safeParse(merged);
    if (!ok.success) throw new Error("merge_schema_mismatch");

    const json = JSON.stringify(ok.data);
    cacheSet(key, json);
    return ok.data;
  } catch {
    return null; // swallow; API will fallback to heuristics
  }
}

/** Default export so `import tryLLMParseResume from '...'` works */
export default _tryLLMParseResume;
/** Named export for `import { tryLLMParseResume } from '...'` */
export const tryLLMParseResume = _tryLLMParseResume;
