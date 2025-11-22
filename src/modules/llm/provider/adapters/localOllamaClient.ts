import type { LlmClient } from "@src/modules/llm/pipelines/profileresumetool/parseResume";

/**
 * Local Ollama adapter implementing the unified LlmClient interface.
 * Callable just like OpenAI: await localOllamaClient(prompt)
 */
export const localOllamaClient: LlmClient = async (prompt: string) => {
  const model = process.env.OLLAMA_MODEL || "llama3.2";

  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });

  if (!res.ok) throw new Error(`ollama_${res.status}`);

  const json = await res.json();
  const content = json?.response;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("ollama_empty");
  }

  return content.trim();
};

export default localOllamaClient;
