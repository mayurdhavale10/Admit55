"use server";

type RewriteAchievementInput = {
  title: string;
  subtitle?: string;
  details?: string;

  // optional JD context
  jobDescription?: string;

  // optional targeting
  track?: string;
  targetRole?: string;
  targetCompanyOrTeam?: string;
};

type RewriteAchievementResult = {
  ok: boolean;
  title: string;
  subtitle: string;
  details: string;
  error?: string;
};

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_API_URL = "https://api.groq.com/openai/v1";

const MAX_TITLE = 58;
const MAX_SUBTITLE = 70;
const MAX_DETAILS = 120;

function oneLine(s: string) {
  return (s ?? "").replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}

function clampText(s: string, max: number) {
  const t = oneLine(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > Math.floor(max * 0.6)) return cut.slice(0, lastSpace).trim();
  return cut.trim();
}

export async function rewriteAchievement(
  input: RewriteAchievementInput
): Promise<RewriteAchievementResult> {
  const useGroq = (process.env.MBA_USE_GROQ ?? "false").toLowerCase() === "true";

  const rawTitle = oneLine(input.title);
  const rawSubtitle = oneLine(input.subtitle ?? "");
  const rawDetails = oneLine(input.details ?? "");

  // fallback mode (no api calls)
  if (!useGroq) {
    return {
      ok: true,
      title: clampText(rawTitle, MAX_TITLE),
      subtitle: clampText(rawSubtitle, MAX_SUBTITLE),
      details: clampText(rawDetails, MAX_DETAILS),
    };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      title: clampText(rawTitle, MAX_TITLE),
      subtitle: clampText(rawSubtitle, MAX_SUBTITLE),
      details: clampText(rawDetails, MAX_DETAILS),
      error: "Missing GROQ_API_KEY",
    };
  }

  const apiUrl = process.env.GROQ_API_URL || DEFAULT_API_URL;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const jd = oneLine(input.jobDescription ?? "");
  const track = oneLine(input.track ?? "");
  const targetRole = oneLine(input.targetRole ?? "");
  const targetCompanyOrTeam = oneLine(input.targetCompanyOrTeam ?? "");

  const system = [
    "You are an expert MBA/Tech resume editor.",
    "Rewrite achievements to sound human, ATS-friendly, and credible (no AI-y fluff).",
    "Return STRICTLY 3 lines in this exact format:",
    "TITLE: ...",
    "SUBTITLE: ...",
    "DETAILS: ...",
    `Limits: TITLE <= ${MAX_TITLE} chars, SUBTITLE <= ${MAX_SUBTITLE} chars, DETAILS <= ${MAX_DETAILS} chars.`,
    "Keep the employer/product names if present. Preserve truthfulness; do not invent metrics.",
    "If job description is provided, align keywords but stay natural.",
    "No extra text, no bullets, no markdown.",
  ].join(" ");

  const user = [
    `Track: ${track || "(not provided)"}`,
    `Target role: ${targetRole || "(not provided)"}`,
    `Target company/team: ${targetCompanyOrTeam || "(not provided)"}`,
    jd ? `Job description:\n${jd}\n` : "Job description: (not provided)\n",
    "Rewrite this achievement:",
    `TITLE: ${rawTitle}`,
    `SUBTITLE: ${rawSubtitle}`,
    `DETAILS: ${rawDetails}`,
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
        max_tokens: 140,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return {
        ok: false,
        title: clampText(rawTitle, MAX_TITLE),
        subtitle: clampText(rawSubtitle, MAX_SUBTITLE),
        details: clampText(rawDetails, MAX_DETAILS),
        error: `Groq error ${res.status}: ${txt || res.statusText}`,
      };
    }

    const json: any = await res.json();
    const content = oneLine(json?.choices?.[0]?.message?.content ?? "");

    // parse strict format
    const titleLine = content.match(/TITLE:\s*(.*?)(?:SUBTITLE:|$)/i)?.[1] ?? rawTitle;
    const subtitleLine = content.match(/SUBTITLE:\s*(.*?)(?:DETAILS:|$)/i)?.[1] ?? rawSubtitle;
    const detailsLine = content.match(/DETAILS:\s*(.*)$/i)?.[1] ?? rawDetails;

    return {
      ok: true,
      title: clampText(titleLine, MAX_TITLE),
      subtitle: clampText(subtitleLine, MAX_SUBTITLE),
      details: clampText(detailsLine, MAX_DETAILS),
    };
  } catch (e: any) {
    return {
      ok: false,
      title: clampText(rawTitle, MAX_TITLE),
      subtitle: clampText(rawSubtitle, MAX_SUBTITLE),
      details: clampText(rawDetails, MAX_DETAILS),
      error: e?.message || "Unknown error",
    };
  }
}
