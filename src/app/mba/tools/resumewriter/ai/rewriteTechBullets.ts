// src/app/mba/tools/resumewriter/ai/rewriteTechBullets.ts
"use server";

type RewriteTechBulletsInput = {
  raw: string;
  role?: string;
  company?: string;
  location?: string;
  mode: "bullets" | "paragraph";
};

type RewriteTechBulletsResult = {
  ok: boolean;
  bullets: string[];
  error?: string;
};

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_API_URL = "https://api.groq.com/openai/v1";
const MAX_INPUT_CHARS = 3000;
const MAX_BULLET_CHARS = 180;

function oneLine(s: string) {
  return (s ?? "").replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}

function normalizeToBulletLines(input: string): string[] {
  const s = (input ?? "").replace(/\r/g, "").trim();
  if (!s) return [];

  const lines = s.split("\n").map((l) => l.trim()).filter(Boolean);
  const looksBulletish = lines.length >= 2 && lines.filter((l) => /^(\*|-|•|\d+[\).\]])\s+/.test(l)).length >= Math.ceil(lines.length * 0.5);

  if (looksBulletish) {
    return lines.map((l) => l.replace(/^(\*|-|•|\d+[\).\]])\s+/, "").trim()).filter(Boolean);
  }

  const chunks = s.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const bullets: string[] = [];
  for (const p of chunks) {
    const sentences = p.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((x) => x.trim()).filter(Boolean);
    if (sentences.length <= 1) bullets.push(p);
    else bullets.push(...sentences);
  }
  return bullets;
}

export async function rewriteTechBullets(input: RewriteTechBulletsInput): Promise<RewriteTechBulletsResult> {
  const useGroq = (process.env.MBA_USE_GROQ ?? "false").toLowerCase() === "true";

  if (!useGroq) {
    const bullets = normalizeToBulletLines(input.raw || "");
    return { ok: true, bullets };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const bullets = normalizeToBulletLines(input.raw || "");
    return { ok: false, bullets, error: "Missing GROQ_API_KEY" };
  }

  const apiUrl = process.env.GROQ_API_URL || DEFAULT_API_URL;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const raw = (input.raw ?? "").slice(0, MAX_INPUT_CHARS).trim();
  if (!raw) {
    return { ok: false, bullets: [], error: "Empty input" };
  }

  const role = oneLine(input.role || "");
  const company = oneLine(input.company || "");
  const location = oneLine(input.location || "");

  const system = `You are an expert tech resume writer. Your ONLY job is to transform work summaries into EXACTLY 8 detailed, high-impact bullet points.

CRITICAL REQUIREMENTS:
- Output EXACTLY 8 bullets. Not 3, not 5, not 10. EXACTLY 8.
- Each bullet must be 100-180 characters long (substantial and detailed)
- Each bullet must be ONE line (no line breaks within a bullet)
- Start each with a strong action verb
- Include specific technologies, metrics, and impact
- Cover different aspects: development, architecture, optimization, collaboration, leadership, impact, scalability, innovation

BULLET STRUCTURE TEMPLATE:
[Action Verb] [what you built/did] using [technologies/tools] [achieving/enabling] [quantified impact/outcome]

Example: "Architected microservices-based API platform using Node.js, PostgreSQL and Redis, processing 50K+ daily requests with 99.9% uptime and reducing infrastructure costs by 30%"

OUTPUT FORMAT:
Return ONLY 8 bullet points, one per line.
NO numbering, NO symbols (•, -, *), NO explanations.
Just the 8 bullets, nothing else.`;

  const user = `Role: ${role || "Software Engineer"}
Company: ${company || "Tech Company"}
Location: ${location || "Remote"}

WORK SUMMARY:
${raw}

Convert this into EXACTLY 8 detailed, impactful bullet points (100-180 chars each).`;

  try {
    const res = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        max_tokens: 2000,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const fallback = normalizeToBulletLines(raw);
      return { ok: false, bullets: fallback, error: `Groq error ${res.status}: ${txt || res.statusText}` };
    }

    const json: any = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "";

    let bullets = normalizeToBulletLines(content);
    
    if (bullets.length === 0) {
      bullets = normalizeToBulletLines(raw);
    }

    bullets = bullets.map((b) => {
      const line = oneLine(b);
      return line.length > MAX_BULLET_CHARS ? line.slice(0, MAX_BULLET_CHARS).trim() : line;
    }).filter(Boolean);

    return { ok: true, bullets };
  } catch (e: any) {
    const fallback = normalizeToBulletLines(raw);
    return { ok: false, bullets: fallback, error: e?.message || "Unknown error" };
  }
}