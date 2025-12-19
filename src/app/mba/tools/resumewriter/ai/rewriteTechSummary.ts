// src/app/mba/tools/resumewriter/ai/rewriteTechSummary.ts
"use server";

type RewriteTechSummaryInput = {
  rawSummary: string;

  // optional JD context
  jobDescription?: string;

  // optional Step-0 / targeting context
  track?: string; // e.g. "tech"
  targetRole?: string;
  targetCompanyOrTeam?: string;
};

type RewriteTechSummaryResult = {
  ok: boolean;
  rewritten: string; // 2–4 lines
  highlights?: string[]; // optional substrings to bold in UI
  error?: string;
};

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_API_URL = "https://api.groq.com/openai/v1";

// guards
const MAX_SUMMARY_CHARS_IN = 1200;
const MAX_JD_CHARS_IN = 4000;

const MAX_OUTPUT_CHARS = 520; // keep it short & ATS-friendly
const MIN_LINES = 2;
const MAX_LINES = 4;

const MAX_HIGHLIGHTS = 10;

function oneLine(s: string) {
  return (s ?? "")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizeLines(s: string) {
  return (s ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function clip(s: string, maxChars: number) {
  const t = (s ?? "").trim();
  if (t.length <= maxChars) return t;
  const cut = t.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > Math.floor(maxChars * 0.65)) return cut.slice(0, lastSpace).trim();
  return cut.trim();
}

function enforce2to4Lines(s: string) {
  const text = normalizeLines(s);

  // Turn big paragraphs into sentences-ish lines
  let lines = text
    .split("\n")
    .map((x) => oneLine(x))
    .filter(Boolean);

  if (lines.length === 1) {
    // Try to split by sentence boundaries if only one line
    lines = lines[0]
      .split(/(?<=[.!?])\s+/)
      .map((x) => oneLine(x))
      .filter(Boolean);
  }

  // If still too few, we keep as is (won't invent content)
  // If too many, merge extras into last allowed line
  if (lines.length > MAX_LINES) {
    const head = lines.slice(0, MAX_LINES - 1);
    const tail = lines.slice(MAX_LINES - 1).join(" ");
    lines = [...head, oneLine(tail)];
  }

  // Ensure at least MIN_LINES (without inventing): if only 1 line, split by commas
  if (lines.length < MIN_LINES && lines[0]) {
    const parts = lines[0].split(/\s*,\s*/).map(oneLine).filter(Boolean);
    if (parts.length >= 2) {
      lines = [parts.slice(0, Math.ceil(parts.length / 2)).join(", "), parts.slice(Math.ceil(parts.length / 2)).join(", ")];
    }
  }

  // Final clean + clip each line softly
  lines = lines.map((l) => oneLine(l)).filter(Boolean);
  if (lines.length === 0) return "";

  // Hard cap total characters (while trying not to destroy line breaks)
  let joined = lines.join("\n");
  if (joined.length > MAX_OUTPUT_CHARS) {
    joined = clip(joined, MAX_OUTPUT_CHARS);
    // re-enforce reasonable line breaks
    const fixed = joined.split("\n").map(oneLine).filter(Boolean);
    joined = fixed.join("\n");
  }

  return joined.trim();
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractHighlights(finalText: string): string[] {
  const text = oneLine(finalText);
  if (!text) return [];

  const found: string[] = [];

  // impact patterns
  const patterns: RegExp[] = [
    /\b\d+(\.\d+)?%/g,
    /\b\d+(\.\d+)?x\b/gi,
    /\b\d+\+\b/g,
    /~?\s?[$€£₹]?\s?\d+(\.\d+)?\s?(k|K|m|M|mn|MN|b|B|bn|BN)\b/g,
  ];

  for (const re of patterns) {
    const matches = text.match(re) ?? [];
    for (const m of matches) found.push(oneLine(m));
  }

  const keywords = [
    "Microservices",
    "Distributed systems",
    "Backend",
    "API",
    "APIs",
    "REST",
    "Kafka",
    "Kubernetes",
    "Docker",
    "AWS",
    "GCP",
    "CI/CD",
    "PostgreSQL",
    "MongoDB",
    "Observability",
    "Performance",
    "Latency",
    "Scalability",
    "Reliability",
    "Ownership",
  ];

  for (const kw of keywords) {
    const re = new RegExp(`\\b${escapeRegExp(kw)}\\b`, "gi");
    const matches = text.match(re) ?? [];
    for (const m of matches) found.push(m);
  }

  const uniq = Array.from(new Set(found)).map(oneLine).filter(Boolean);
  uniq.sort((a, b) => b.length - a.length);
  return uniq.slice(0, MAX_HIGHLIGHTS);
}

export async function rewriteTechSummary(
  input: RewriteTechSummaryInput
): Promise<RewriteTechSummaryResult> {
  const useGroq = (process.env.MBA_USE_GROQ ?? "false").toLowerCase() === "true";

  const rawSummary = clip(oneLine(input.rawSummary || ""), MAX_SUMMARY_CHARS_IN);
  const jd = clip((input.jobDescription ?? "").trim(), MAX_JD_CHARS_IN);

  // No AI mode: just clean + format to 2–4 lines (no rewriting)
  if (!useGroq) {
    const cleaned = enforce2to4Lines(rawSummary);
    return { ok: true, rewritten: cleaned, highlights: extractHighlights(cleaned) };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const cleaned = enforce2to4Lines(rawSummary);
    return {
      ok: false,
      rewritten: cleaned,
      highlights: extractHighlights(cleaned),
      error: "Missing GROQ_API_KEY",
    };
  }

  const apiUrl = process.env.GROQ_API_URL || DEFAULT_API_URL;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  if (!rawSummary) {
    return { ok: false, rewritten: "", highlights: [], error: "Empty summary" };
  }

  const track = oneLine(input.track || "tech");
  const targetRole = oneLine(input.targetRole || "");
  const targetCompanyOrTeam = oneLine(input.targetCompanyOrTeam || "");

  const system = [
    "You are an expert technical resume writer and ATS optimizer.",
    "Rewrite ONLY the candidate summary.",
    `Output must be ${MIN_LINES}-${MAX_LINES} lines (use newline characters).`,
    `Total output must be <= ${MAX_OUTPUT_CHARS} characters.`,
    "Make it sound natural and human; avoid generic AI phrases.",
    "Keep it ATS-friendly: include relevant keywords naturally, no keyword stuffing.",
    "No emojis, no headings, no bullets, no quotes, no placeholders like [X].",
    "Do not invent experiences, companies, degrees, or metrics not present.",
  ].join(" ");

  const user = [
    `Track: ${track || "(not provided)"}`,
    `Target role: ${targetRole || "(not provided)"}`,
    `Target company/team: ${targetCompanyOrTeam || "(not provided)"}`,
    "",
    jd
      ? [
          "Job Description (for tailoring):",
          jd,
          "",
          "Rewrite the summary to align strongly with the JD while staying truthful to the provided summary.",
        ].join("\n")
      : "Rewrite the summary to be tighter, more technical, and ATS-friendly (no JD provided).",
    "",
    "Original Summary:",
    rawSummary,
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
        max_tokens: 160, // enough for 2–4 short lines
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const fallback = enforce2to4Lines(rawSummary);
      return {
        ok: false,
        rewritten: fallback,
        highlights: extractHighlights(fallback),
        error: `Groq error ${res.status}: ${txt || res.statusText}`,
      };
    }

    const json: any = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "";

    // enforce format
    const rewritten = enforce2to4Lines(content || rawSummary) || enforce2to4Lines(rawSummary);

    return {
      ok: true,
      rewritten,
      highlights: extractHighlights(rewritten),
    };
  } catch (e: any) {
    const fallback = enforce2to4Lines(rawSummary);
    return {
      ok: false,
      rewritten: fallback,
      highlights: extractHighlights(fallback),
      error: e?.message || "Unknown error",
    };
  }
}
