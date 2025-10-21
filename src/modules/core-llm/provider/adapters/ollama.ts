export const ollamaProvider = {
  async generate({ input }: { task: string; input: string }) {
    // TODO: call local model via HTTP; for now return a placeholder
    return `LLM(ollama) draft for: ${input.slice(0,120)}...`;
  }
};
