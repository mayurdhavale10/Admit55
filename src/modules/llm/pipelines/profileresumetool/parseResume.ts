import { z } from "zod";
import { NormalizedProfileZ, type NormalizedProfile } from "@src/modules/schemas/profileresumetool/types";

/**
 * PUBLIC: Client type for all LLM providers (OpenAI, Anthropic, Ollama, etc.)
 * A callable contract: pass a prompt → get the model’s raw text output.
 */
export type LlmClient = (prompt: string) => Promise<string>;

const SYSTEM_PROMPT = `
You are a strict JSON generator. Output ONLY JSON matching the schema.
Extract resume into:
{
  "education":[{"school":"","degree":"","discipline":"","tierHint":"tier1|tier2|other"}],
  "roles":[{"company":"","title":"","start":"","end":"","location":"","bullets":[{"text":"","metrics":{"pct":0,"value":0,"currency":"","multiple":0},"scope":{"teamSize":0,"budget":0,"regions":[""]}}]}],
  "tests":{"type":"GMAT|GRE","actual":0,"target":0,"descriptor":""},
  "extracurriculars":[{"text":"","leadership":true,"recency":"past|current"}],
  "international":{"regions":[""],"months":0,"evidence":[""]},
  "awards":["..."]
}
No commentary.
`;

/**
 * PUBLIC: Parse a resume using any LLM client.
 * Returns a validated NormalizedProfile + raw JSON string.
 */
export async function parseResumeLLM(opts: {
  client: LlmClient;
  text: string;
  timeoutMs?: number;
}): Promise<{ profile: NormalizedProfile; raw: string }> {
  const { client, text, timeoutMs = 4500 } = opts;

  const userPrompt = `Resume (plain text):\n"""${text}"""\nReturn ONLY JSON.`;

  // Send prompt to the model
  const p = client(`${SYSTEM_PROMPT}\n${userPrompt}`);

  // Apply timeout protection (to prevent hanging LLM calls)
  const raw = await Promise.race<string>([
    p,
    new Promise((_r, rej) => setTimeout(() => rej(new Error("llm_timeout")), timeoutMs)),
  ]);

  // Parse and validate the JSON structure
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("llm_invalid_json");
  }

  // Validate JSON against Zod schema
  const parsed = NormalizedProfileZ.safeParse(json);
  if (!parsed.success) {
    const err = parsed.error; // properly inferred as ZodError
    console.error("LLM schema mismatch:", err.issues);
    throw new Error("llm_schema_mismatch");
  }

  // Return the validated normalized profile
  return { profile: parsed.data, raw };
}
