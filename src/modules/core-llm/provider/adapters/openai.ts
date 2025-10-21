export const openaiProvider = {
  async generate({ input }: { task: string; input: string }) {
    // TODO: call OpenAI chat.completions; placeholder now
    return `LLM(openai) draft for: ${input.slice(0,120)}...`;
  }
};
