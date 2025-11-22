export function htmlToText(s: string): string {
  // cheap sanitize for now; replace later with a robust lib if needed
  return s.replace(/<[^>]+>/g, " ").replace(/\r/g, "").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
