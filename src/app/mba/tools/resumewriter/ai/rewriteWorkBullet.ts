// src/app/mba/tools/resumewriter/ai/rewriteWorkBullet.ts
"use server";

type RewriteWorkBulletInput = {
  raw: string;

  // from Step 0 (e.g. "consulting", "finance", "product", etc.)
  track?: string;

  // optional context
  targetCompanyOrTeam?: string;
  targetRole?: string;
};

type RewriteWorkBulletResult = {
  ok: boolean;
  rewritten: string; // always 1-line
  highlights?: string[]; // substrings to bold in UI
  error?: string;
};

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_API_URL = "https://api.groq.com/openai/v1";

// guards
const MAX_INPUT_CHARS = 500;
const MAX_OUTPUT_CHARS = 140; // ✅ HARD character limit (including spaces)
const MAX_HIGHLIGHTS = 10; // avoid over-highlighting

function oneLine(s: string) {
  return (s ?? "")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function limitChars(s: string, maxChars: number) {
  const t = oneLine(s);
  if (t.length <= maxChars) return t;

  // Prefer cutting at a word boundary
  const cut = t.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > Math.floor(maxChars * 0.6)) {
    return cut.slice(0, lastSpace).trim();
  }
  return cut.trim();
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build highlight substrings that should be bolded:
 * - money/quant patterns: $30k, ~$20mn, €5m, 10%, 100+, etc.
 * - action/partnership keywords: led/leading, partnered/partnership, negotiated, drove, saved, etc.
 *
 * IMPORTANT: highlights must be EXACT substrings that appear in the final text.
 */
function extractHighlights(finalText: string): string[] {
  const text = oneLine(finalText);
  if (!text) return [];

  const found: string[] = [];

  // 1) Money + big-number patterns (prioritize)
  const moneyPatterns: RegExp[] = [
    /~?\s?[$€£₹]?\s?\d+(\.\d+)?\s?(k|K|m|M|mn|MN|b|B|bn|BN)\b/g, // ~$20mn, 30k, 5m
    /~?\s?[$€£₹]?\s?\d{1,3}(,\d{3})+(\.\d+)?\b/g,              // 1,200,000
    /~?\s?[$€£₹]?\s?\d+(\.\d+)?\s?(million|billion)\b/gi,      // 20 million
  ];

  for (const re of moneyPatterns) {
    const matches = text.match(re) ?? [];
    for (const m of matches) found.push(oneLine(m));
  }

  // 2) Percentages, multipliers, counts (impact signals)
  const impactPatterns: RegExp[] = [
    /\b\d+(\.\d+)?%/g,     // 12%
    /\b\d+(\.\d+)?x\b/gi,  // 2x
    /\b\d+\+\b/g,          // 100+
  ];
  for (const re of impactPatterns) {
    const matches = text.match(re) ?? [];
    for (const m of matches) found.push(oneLine(m));
  }

  // 3) Action / partnership keywords (capture EXACT casing from text)
  const keywordCandidates = [
    "Led",
    "Leading",
    "Managed",
    "Owned",
    "Built",
    "Developed",
    "Drove",
    "Delivered",
    "Launched",
    "Negotiated",
    "Partnered",
    "Partnership",
    "Collaborated",
    "Aligned",
    "Enabled",
    "Secured",
    "Optimized",
    "Streamlined",
    "Reduced",
    "Increased",
    "Improved",
    "Saved",
    "Forecasting",
    "Budgeting",
    "Modeling",
    "Variance analysis",
    "Cash flow",
    "Liquidity",
    "Stakeholders",
    "CXOs",
  ];

  for (const kw of keywordCandidates) {
    const re = new RegExp(`\\b${escapeRegExp(kw)}\\b`, "gi");
    const matches = text.match(re) ?? [];
    for (const m of matches) found.push(m); // keeps exact substring casing from match
  }

  // de-dupe, prefer longer phrases first
  const uniq = Array.from(new Set(found))
    .map((s) => oneLine(s))
    .filter(Boolean);

  uniq.sort((a, b) => b.length - a.length);

  return uniq.slice(0, MAX_HIGHLIGHTS);
}

export async function rewriteWorkBullet(
  input: RewriteWorkBulletInput
): Promise<RewriteWorkBulletResult> {
  const useGroq = (process.env.MBA_USE_GROQ ?? "false").toLowerCase() === "true";

  // Always enforce 1-line + char limit, even without Groq
  if (!useGroq) {
    const rewritten = limitChars(input.raw || "", MAX_OUTPUT_CHARS);
    return { ok: true, rewritten, highlights: extractHighlights(rewritten) };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const rewritten = limitChars(input.raw || "", MAX_OUTPUT_CHARS);
    return {
      ok: false,
      rewritten,
      highlights: extractHighlights(rewritten),
      error: "Missing GROQ_API_KEY",
    };
  }

  const apiUrl = process.env.GROQ_API_URL || DEFAULT_API_URL;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const raw = oneLine((input.raw ?? "").slice(0, MAX_INPUT_CHARS));
  if (!raw) {
    return { ok: false, rewritten: "", highlights: [], error: "Empty bullet" };
  }

  const track = oneLine(input.track || "");
  const targetCompanyOrTeam = oneLine(input.targetCompanyOrTeam || "");
  const targetRole = oneLine(input.targetRole || "");

  const system = [
    "You are an expert MBA resume editor.",
    "Rewrite ONLY the bullet text.",
    "Return exactly ONE line (no newline characters).",
    `HARD LIMIT: <= ${MAX_OUTPUT_CHARS} characters INCLUDING spaces.`,
    "Use strong action verbs, keep ATS-friendly keywords, and keep it crisp.",
    "Do NOT add headings, prefixes, bullet symbols, or formatting.",
    "Never mention that you are an AI.",
  ].join(" ");

  const user = [
    `Track: ${track || "(not provided)"}`,
    `Target role: ${targetRole || "(not provided)"}`,
    `Target company/team: ${targetCompanyOrTeam || "(not provided)"}`,
    "",
    `Rewrite this bullet (single line, <= ${MAX_OUTPUT_CHARS} characters):`,
    raw,
  ].join("\n");

  try {
    const res = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        max_tokens: 80, // ✅ smaller to discourage long outputs (still enforced by limitChars)
        stop: ["\n"],   // ✅ prevent multi-line
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const fallback = limitChars(raw, MAX_OUTPUT_CHARS);
      return {
        ok: false,
        rewritten: fallback,
        highlights: extractHighlights(fallback),
        error: `Groq error ${res.status}: ${txt || res.statusText}`,
      };
    }

    const json: any = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "";

    let rewritten = oneLine(content);
    if (!rewritten) rewritten = raw;

    // ✅ enforce 1-line + HARD char limit
    rewritten = limitChars(rewritten, MAX_OUTPUT_CHARS);

    return {
      ok: true,
      rewritten,
      highlights: extractHighlights(rewritten),
    };
  } catch (e: any) {
    const fallback = limitChars(raw, MAX_OUTPUT_CHARS);
    return {
      ok: false,
      rewritten: fallback,
      highlights: extractHighlights(fallback),
      error: e?.message || "Unknown error",
    };
  }
}
