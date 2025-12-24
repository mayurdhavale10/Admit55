// src/app/mba/tools/resumewriter/ai/rewriteWorkProfileBlock.ts
"use server";

/**
 * Rewrites the "Work Profile" block under WORK EXPERIENCE in ONE call:
 * - summaryLine (1 line)
 * - each line.value (1 line each, keeps label intact)
 *
 * Designed to avoid multi-call failures when user clicks "Rewrite all lines".
 */

type WorkProfileLineInput = {
  label: string; // e.g., "Areas of Expertise"
  value: string; // e.g., "Digital Transformation, Data & Analytics Strategy, ..."
};

export type RewriteWorkProfileBlockInput = {
  // the first line under "Management Consultant"
  summaryLine: string;

  // pattern lines (label — value)
  lines: WorkProfileLineInput[];

  // optional context
  track?: string; // "consulting"
  targetCompanyOrTeam?: string;
  targetRole?: string;
  jobDescription?: string;
};

export type RewriteWorkProfileBlockResult = {
  ok: boolean;
  rewritten: {
    summaryLine: string;
    lines: { label: string; value: string }[];
  };
  error?: string;
};

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_API_URL = "https://api.groq.com/openai/v1";

// Guards (tight to keep output clean)
const MAX_SUMMARY_CHARS = 170;
const MAX_VALUE_CHARS = 240;
const MAX_LINES = 12;
const MAX_JD_CHARS = 2500;

function oneLine(s: string) {
  return (s ?? "")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanStr(v: unknown) {
  return oneLine((v ?? "").toString());
}

function limitChars(s: string, maxChars: number) {
  const t = oneLine(s);
  if (t.length <= maxChars) return t;

  const cut = t.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > Math.floor(maxChars * 0.6)) return cut.slice(0, lastSpace).trim();
  return cut.trim();
}

function safeLines(lines: WorkProfileLineInput[]) {
  const arr = Array.isArray(lines) ? lines : [];
  const cleaned = arr
    .map((l) => ({
      label: cleanStr(l?.label),
      value: cleanStr(l?.value),
    }))
    .filter((l) => l.label || l.value);

  return cleaned.slice(0, MAX_LINES);
}

/**
 * Very safe fallback mode (no LLM):
 * - just trims and enforces char limits
 */
function fallbackRewrite(input: RewriteWorkProfileBlockInput): RewriteWorkProfileBlockResult {
  const lines = safeLines(input.lines).map((l) => ({
    label: l.label,
    value: limitChars(l.value, MAX_VALUE_CHARS),
  }));

  return {
    ok: true,
    rewritten: {
      summaryLine: limitChars(input.summaryLine || "", MAX_SUMMARY_CHARS),
      lines,
    },
  };
}

/**
 * Parse the model output safely.
 * Expected JSON:
 * {
 *   "summaryLine": "...",
 *   "lines": [{"label":"Areas of Expertise","value":"..."}, ...]
 * }
 */
function tryParseJson(raw: string) {
  const t = raw.trim();

  // Try direct JSON
  try {
    return JSON.parse(t);
  } catch {}

  // Try to extract a JSON object if model wrapped it
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const slice = t.slice(start, end + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }

  return null;
}

export async function rewriteWorkProfileBlock(
  input: RewriteWorkProfileBlockInput
): Promise<RewriteWorkProfileBlockResult> {
  const useGroq = (process.env.MBA_USE_GROQ ?? "false").toLowerCase() === "true";

  // Always keep predictable output even if user passes junk
  const summaryLine = oneLine((input.summaryLine ?? "").slice(0, 1200));
  const lines = safeLines(input.lines);

  if (!useGroq) {
    return fallbackRewrite({ ...input, summaryLine, lines });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const fb = fallbackRewrite({ ...input, summaryLine, lines });
    return { ...fb, ok: false, error: "Missing GROQ_API_KEY" };
  }

  // If nothing to rewrite, return gracefully
  const hasAny =
    !!cleanStr(summaryLine) || lines.some((l) => cleanStr(l.label) || cleanStr(l.value));
  if (!hasAny) {
    return {
      ok: false,
      rewritten: { summaryLine: "", lines: [] },
      error: "Empty work profile",
    };
  }

  const apiUrl = process.env.GROQ_API_URL || DEFAULT_API_URL;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const track = cleanStr(input.track || "");
  const targetCompanyOrTeam = cleanStr(input.targetCompanyOrTeam || "");
  const targetRole = cleanStr(input.targetRole || "");
  const jd = oneLine((input.jobDescription ?? "").slice(0, MAX_JD_CHARS));

  const system = [
    "You are an expert MBA resume editor specialized in consulting resumes.",
    "Rewrite the Work Profile block content using ATS-friendly consulting language.",
    "Do NOT invent facts, companies, metrics, tools, or numbers.",
    "Keep each output as ONE line (no newlines).",
    `summaryLine HARD LIMIT <= ${MAX_SUMMARY_CHARS} chars.`,
    `each line.value HARD LIMIT <= ${MAX_VALUE_CHARS} chars.`,
    "Preserve labels exactly as provided (do not rename labels).",
    "Return ONLY valid JSON with keys: summaryLine, lines.",
    "lines must be an array of objects: {label, value}.",
  ].join(" ");

  const user = [
    `Track: ${track || "(not provided)"}`,
    `Target role: ${targetRole || "(not provided)"}`,
    `Target company/team: ${targetCompanyOrTeam || "(not provided)"}`,
    jd ? "\nOptional job description (context only):\n" + jd : "",
    "",
    "Rewrite this Work Profile block into improved, crisp lines:",
    "",
    "INPUT SUMMARY LINE:",
    summaryLine || "(empty)",
    "",
    "INPUT LINES (label -> value):",
    ...lines.map((l) => `- ${l.label} -> ${l.value || "(empty)"}`),
    "",
    "OUTPUT FORMAT (JSON ONLY):",
    `{"summaryLine":"...","lines":[{"label":"Areas of Expertise","value":"..."},{"label":"Sectors","value":"..."}]}`,
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
        max_tokens: 260,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const fb = fallbackRewrite({ ...input, summaryLine, lines });
      return {
        ok: false,
        rewritten: fb.rewritten,
        error: `Groq error ${res.status}: ${txt || res.statusText}`,
      };
    }

    const json: any = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "";

    const parsed = tryParseJson(content);

    // If parse fails, fallback safely
    if (!parsed || typeof parsed !== "object") {
      const fb = fallbackRewrite({ ...input, summaryLine, lines });
      return {
        ok: false,
        rewritten: fb.rewritten,
        error: "Model did not return valid JSON",
      };
    }

    // Build output, preserving input labels order
    const outSummary = limitChars(oneLine(parsed.summaryLine ?? ""), MAX_SUMMARY_CHARS);

    const outLinesRaw: any[] = Array.isArray(parsed.lines) ? parsed.lines : [];

    // Map by label (preserve exact labels, keep order from input lines)
    const byLabel = new Map<string, string>();
    for (const item of outLinesRaw) {
      const lbl = cleanStr(item?.label);
      const val = oneLine(item?.value ?? "");
      if (lbl) byLabel.set(lbl, val);
    }

    const outLines = lines.map((l) => ({
      label: l.label,
      value: limitChars(byLabel.get(l.label) ?? l.value, MAX_VALUE_CHARS),
    }));

    // If model returned fewer lines, still keep all input lines with fallbacks
    return {
      ok: true,
      rewritten: {
        summaryLine: outSummary || limitChars(summaryLine, MAX_SUMMARY_CHARS),
        lines: outLines,
      },
    };
  } catch (e: any) {
    const fb = fallbackRewrite({ ...input, summaryLine, lines });
    return {
      ok: false,
      rewritten: fb.rewritten,
      error: e?.message || "Unknown error",
    };
  }
}
