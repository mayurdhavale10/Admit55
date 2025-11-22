// src/lib/mba/ml/standardize.ts
/**
 * Resume Text Standardizer
 * Cleans, normalizes, and standardizes resume text for both training & inference.
 * This directly improves tokenization consistency and model F1 scores.
 */

export function standardizeResumeText(text: string): string {
  if (!text) return "";

  // --- Unicode normalization (NFKC makes characters consistent)
  text = text.normalize("NFKC");

  // --- Fix common encoding artifacts (Windows-1252 / UTF8 mismatch)
  const encFixes: Record<string, string> = {
    "â€”": "—",
    "â€“": "–",
    "â€¢": "•",
    "â€˜": "'",
    "â€™": "'",
    "â€œ": '"',
    "â€": '"',
    "Â": "",
  };
  for (const [bad, good] of Object.entries(encFixes)) {
    text = text.replace(new RegExp(bad, "g"), good);
  }

  // --- Expand common abbreviations (resume domain)
  const expansions: Record<string, string> = {
    "\\bEngrs?\\b": "engineers",
    "\\bMgrs?\\b": "managers",
    "\\bProj\\b": "project",
    "\\bIntl\\b": "international",
    "\\bOrg\\b": "organization",
    "\\bOps\\b": "operations",
    "\\bDept\\b": "department",
    "\\bUniv\\b": "university",
    "\\bInst\\b": "institute",
    "\\bGovt\\b": "government",
    "\\bMgmt\\b": "management",
    "\\bExec\\b": "executive",
    "\\bAsst\\b": "assistant",
  };
  for (const [pattern, repl] of Object.entries(expansions)) {
    text = text.replace(new RegExp(pattern, "gi"), repl);
  }

  // --- Fix spacing & punctuation
  text = text
    .replace(/\s+/g, " ") // collapse multiple spaces
    .replace(/\s*([.,!?;:])\s*/g, "$1 ") // normalize punctuation spacing
    .replace(/\s*\n\s*/g, " ") // remove newlines
    .trim();

  // --- Ensure consistent case (capitalize sentences)
  text = text.replace(/(^\w|\.\s+\w)/g, (m) => m.toUpperCase());

  // --- Remove unwanted symbols or emojis (safety)
  text = text.replace(/[^\x00-\x7F]+/g, ""); // keep only ASCII range

  return text.trim();
}

/**
 * Standardize multiple resumes at once (used for dataset cleaning).
 */
export function batchStandardize(texts: string[]): string[] {
  return texts.map((t) => standardizeResumeText(t));
}
