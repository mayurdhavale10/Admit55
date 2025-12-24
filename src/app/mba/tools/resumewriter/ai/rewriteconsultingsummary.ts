// src/app/mba/tools/resumewriter/ai/rewriteconsultingsummary.ts
"use server";

type RewriteConsultingSummaryInput = {
  raw: string;

  // from Step 0 (career path), ex: "consulting"
  track?: string;

  // optional context
  targetCompanyOrTeam?: string;
  targetRole?: string;

  // ✅ optional JD for extra context (can be empty)
  jobDescription?: string;
};

type RewriteConsultingSummaryResult = {
  ok: boolean;
  rewritten: string; // always 1-line
  highlights?: string[];
  error?: string;
};

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_API_URL = "https://api.groq.com/openai/v1";

// guards
const MAX_INPUT_CHARS = 900; // summary can be longer than bullets
const MAX_JD_CHARS = 2500;   // optional JD cap
const MAX_OUTPUT_CHARS = 220; // summary line target (tight)
const MAX_HIGHLIGHTS = 10;

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

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractHighlights(finalText: string): string[] {
  const text = oneLine(finalText);
  if (!text) return [];

  const found: string[] = [];

  // numbers + impact
  const patterns: RegExp[] = [
    /\b\d+(\.\d+)?%\b/g,
    /\b\d+(\.\d+)?x\b/gi,
    /\b\d+\+\b/g,
    /~?\s?[$€£₹]?\s?\d+(\.\d+)?\s?(k|K|m|M|mn|MN|b|B|bn|BN)\b/g,
    /~?\s?[$€£₹]?\s?\d{1,3}(,\d{3})+(\.\d+)?\b/g,
  ];

  for (const re of patterns) {
    const matches = text.match(re) ?? [];
    for (const m of matches) found.push(oneLine(m));
  }

  const keywords = [
    "Digital",
    "Analytics",
    "Strategy",
    "Transformation",
    "Consulting",
    "Stakeholders",
    "CXOs",
    "Operating model",
    "Cost",
    "Savings",
    "Growth",
    "GTM",
    "Procurement",
    "ESG",
    "Data",
    "AI",
    "ML",
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

export async function rewriteconsultingsummary(
  input: RewriteConsultingSummaryInput
): Promise<RewriteConsultingSummaryResult> {
  const useGroq = (process.env.MBA_USE_GROQ ?? "false").toLowerCase() === "true";

  // fallback mode (no LLM)
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
    return { ok: false, rewritten: "", highlights: [], error: "Empty summary" };
  }

  const track = cleanStr(input.track || "");
  const targetCompanyOrTeam = cleanStr(input.targetCompanyOrTeam || "");
  const targetRole = cleanStr(input.targetRole || "");
  const jd = oneLine((input.jobDescription ?? "").slice(0, MAX_JD_CHARS));

  const system = [
    "You are an expert MBA resume editor specialized in consulting resumes.",
    "Rewrite ONLY the summary line(s) into ONE crisp ATS-friendly line.",
    `HARD LIMIT: <= ${MAX_OUTPUT_CHARS} characters INCLUDING spaces.`,
    "Keep it credible: do not invent facts, companies, or numbers.",
    "Use consulting language: strategy, transformation, stakeholders, impact.",
    "Do NOT add headings, prefixes, bullet symbols, or formatting.",
    "Return exactly ONE line (no newline characters).",
  ].join(" ");

  const user = [
    `Track: ${track || "(not provided)"}`,
    `Target role: ${targetRole || "(not provided)"}`,
    `Target company/team: ${targetCompanyOrTeam || "(not provided)"}`,
    jd ? "\nOptional job description (context only):\n" + jd : "",
    "",
    `Rewrite this consulting summary into ONE line (<= ${MAX_OUTPUT_CHARS} chars):`,
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
        max_tokens: 110,
        stop: ["\n"],
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

    rewritten = limitChars(rewritten, MAX_OUTPUT_CHARS);

    return { ok: true, rewritten, highlights: extractHighlights(rewritten) };
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
