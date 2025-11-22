// src/modules/heuristics/profileresumetool/content/patterns/detectors/role.ts
// 🎯 PURPOSE: Extract distinct job roles (header + bullets) from raw resume text.
// Used in heuristic parsing pipelines to segment experience sections.

export type RawRole = {
  header: string;   // e.g., "Product Manager – Swiggy"
  bullets: string[]; // Individual achievement/impact lines
};

/**
 * Keywords commonly found in job titles.
 * These help identify where a new "role" begins.
 */
const HEADER_HINTS = [
  "product", "manager", "lead", "director", "engineer", "consultant", "analyst",
  "founder", "intern", "program", "strategy", "operations", "marketing", "finance",
  "ceo", "cto", "office", "head", "pm", "data", "growth", "associate", "developer",
  "designer", "coordinator", "executive", "specialist", "entrepreneur", "architect"
];

/**
 * 🚀 Splits resume text into structured role segments.
 * Handles PDF noise, non-standard bullet symbols, and multiline achievements.
 */
export function chunkRolesFromText(text: string): RawRole[] {
  if (!text || typeof text !== "string") return [];

  // ✅ Step 1: Normalize spacing and remove broken formatting
  const clean = text
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ") // non-breaking spaces
    .replace(/\t+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();

  const lines = clean.split(/\n/).map(l => l.trim()).filter(Boolean);
  const roles: RawRole[] = [];
  let current: RawRole | null = null;

  // ✅ Step 2: Iterate through lines to detect role headers and bullets
  for (const line of lines) {
    const isHeader =
      /^[A-Z].{0,120}$/.test(line) &&
      HEADER_HINTS.some(h => line.toLowerCase().includes(h));

    // New header line → close current role, start a new one
    if (isHeader) {
      if (current && current.bullets.length > 0) {
        roles.push(current);
      }
      current = { header: line, bullets: [] };
      continue;
    }

    // ✅ Step 3: Detect bullets or metric/verb-rich sentences
    if (/^[•\-\u2022]/.test(line)) {
      (current ??= { header: "Experience", bullets: [] }).bullets.push(
        line.replace(/^[•\-\u2022]\s?/, "").trim()
      );
      continue;
    }

    if (
      /\b(led|managed|delivered|built|designed|improved|increased|reduced|achieved|developed|executed|coordinated|launched|analyzed|optimized)\b/i.test(line) ||
      /\d/.test(line)
    ) {
      (current ??= { header: "Experience", bullets: [] }).bullets.push(line);
      continue;
    }

    // ✅ Step 4: Merge wrapped or continuation lines
    if (current && current.bullets.length > 0) {
      const lastIdx = current.bullets.length - 1;
      current.bullets[lastIdx] += " " + line;
    }
  }

  // ✅ Step 5: Push last captured role
  if (current && current.bullets.length > 0) roles.push(current);

  // ✅ Step 6: Clean up duplicates and tiny fragments
  const deduped = roles
    .map(r => ({
      header: r.header.trim(),
      bullets: Array.from(new Set(r.bullets.map(b => b.trim()))).filter(b => b.length > 3)
    }))
    .filter(r => r.bullets.length > 0);

  return deduped;
}

/**
 * 🧪 Local test utility (optional)
 * Example: ts-node src/modules/.../role.ts
 */
if (require.main === module) {
  const sample = `
  Product Manager – Swiggy
  • Led AI-driven feature launch increasing conversion by 20%
  • Collaborated with 5 teams across design, ops, and data
  Data Analyst – Deloitte
  - Built dashboards reducing reporting time by 30%
  - Presented findings to senior stakeholders
  `;
  console.log(chunkRolesFromText(sample));
}

export default chunkRolesFromText;
