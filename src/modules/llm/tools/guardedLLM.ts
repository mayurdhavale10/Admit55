import { NormalizedProfileZ, type NormalizedProfile } from "@src/modules/schemas/profileresumetool/types";
import { tryRepairJson } from "../../shared/utils/jsonRepair";
import { openAiClient } from "../provider/adapters/openaiClient";

const SYSTEM = `
You are a strict JSON generator. Return ONLY valid JSON conforming to this TypeScript schema (keys may be omitted if unknown):

{
  "education": [{"school": string, "degree"?: string, "discipline"?: string, "tierHint"?: "tier1"|"tier2"|"other"}],
  "roles": [{"company"?: string,"title"?: string,"start"?: string,"end"?: string,"location"?: string,
             "bullets": [{"text": string, "metrics"?: {"pct"?: number, "value"?: number, "currency"?: string, "multiple"?: number},
                                       "scope"?: {"teamSize"?: number, "budget"?: number, "regions"?: string[]}}]}],
  "tests"?: {"type"?: "GMAT"|"GRE", "actual"?: number, "target"?: number, "descriptor"?: string},
  "extracurriculars": [{"text": string, "leadership"?: boolean, "recency"?: "past"|"current"}],
  "international"?: {"regions"?: string[], "months"?: number, "evidence"?: string[]},
  "awards"?: string[]
}
`;

function withTimeout<T>(p: Promise<T>, ms: number) {
  return new Promise<T>((res, rej) => {
    const t = setTimeout(() => rej(new Error("llm_timeout")), ms);
    p.then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); });
  });
}

export async function callGuardedLLM(text: string, timeoutMs = 4500): Promise<{raw: string, profile: NormalizedProfile}> {
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
