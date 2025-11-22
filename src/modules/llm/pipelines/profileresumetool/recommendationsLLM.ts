import { openAiClient } from "@src/modules/llm/provider/adapters/openaiClient";

const SYSTEM = `
You return ONLY compact JSON with tailored actions (no prose). Keys:
{
  "strengths": string[],
  "gaps": string[],
  "next6Weeks": string[],
  "next90Days": string[],
  "essayAngles": string[]
}
Keep each item specific & verifiable. No generic advice.
`;

function withTimeout<T>(p: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("llm_timeout")), ms);
    p.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Generates personalized recommendations using an LLM
 * based on resume snippet + subscores.
 */
export async function recommendationsLLM(
  input: {
    resumeSnippet: string;
    subscores: Record<string, number>;
    persona?: string;
  },
  timeoutMs = 3500
): Promise<null | {
  strengths: string[];
  gaps: string[];
  next6Weeks: string[];
  next90Days: string[];
  essayAngles: string[];
}> {
  const userPrompt = `
Resume snippet:
"""${input.resumeSnippet.slice(0, 3000)}"""

Subscores (0-10): ${JSON.stringify(input.subscores)}
Persona: ${input.persona ?? "general"}
Return ONLY JSON as per schema.
`.trim();

  try {
    // 👇 specify type explicitly to remove "unknown" warnings
    const raw = await withTimeout<string>(
      openAiClient(`${SYSTEM}\n${userPrompt}`),
      timeoutMs
    );

    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    const json = JSON.parse(raw.slice(firstBrace, lastBrace + 1));

    if (!json || !Array.isArray(json.next6Weeks) || !Array.isArray(json.next90Days))
      return null;

    return {
      strengths: json.strengths ?? [],
      gaps: json.gaps ?? [],
      next6Weeks: json.next6Weeks ?? [],
      next90Days: json.next90Days ?? [],
      essayAngles: json.essayAngles ?? [],
    };
  } catch (err) {
    console.error("recommendationsLLM error:", err);
    return null;
  }
}
