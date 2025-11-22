import type { LlmClient } from "@src/modules/llm/pipelines/profileresumetool/parseResume";

/**
 * OpenAI API adapter implementing the unified LlmClient interface.
 * Callable directly as a function: `await openAiClient(prompt)`.
 */
export const openAiClient: LlmClient = async (prompt: string) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("missing_openai_key");

  const model = process.env.RESUME_LLM_MODEL || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return ONLY valid JSON. No prose." },
        { role: "user", content: prompt },
      ],
      temperature: 0, // deterministic JSON
    }),
  });

  if (!res.ok) throw new Error(`openai_${res.status}`);

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim())
    throw new Error("openai_empty");

  return content.trim();
};

export default openAiClient;
