// very simple splitter; improves latency & reliability
export function splitByRoleBlocks(text: string): string[] {
  // Split on strong “role” cues
  const parts = text
    .split(/\n{2,}|(?:^|\n)(?:EMPLOYMENT|EXPERIENCE|WORK|PROFESSIONAL)\b/gi)
    .map(s => s.trim())
    .filter(Boolean);

  // If splitter is too aggressive, fall back to whole text
  if (parts.join("").length < text.replace(/\s+/g, "").length * 0.5) {
    return [text];
  }
  return parts.slice(0, 10); // safety cap
}
