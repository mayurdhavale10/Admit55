export type GenArgs = { task: string; input: string; maxTokens?: number };

export interface LlmProvider {
  generate(args: GenArgs): Promise<string>;
  embed?(texts: string[]): Promise<number[][]>;
}

// make it async; callers should `await getProvider()`
export async function getProvider(): Promise<LlmProvider> {
  const p = process.env.LLM_PROVIDER ?? "ollama";
  if (p === "openai") {
    const mod = await import("./adapters/openai");
    return mod.openaiProvider as LlmProvider;
  }
  const mod = await import("./adapters/ollama");
  return mod.ollamaProvider as LlmProvider;
}
