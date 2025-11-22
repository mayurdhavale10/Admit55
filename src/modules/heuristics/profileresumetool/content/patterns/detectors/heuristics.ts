// src/modules/heuristics/profileresumetool/content/patterns/detectors/heuristics.ts
import { type NormalizedProfile } from "@src/modules/schemas/profileresumetool/types";

export function heuristicParseResume(text: string): NormalizedProfile {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const roles: NormalizedProfile["roles"] = [];
  let current: any = null;

  for (const ln of lines) {
    if (/^\s*(product|d2c|brand|manager|lead|strategy|engineer|analyst|consultant|founder|director|associate)/i.test(ln) || / - /.test(ln)) {
      if (current) roles.push(current);
      current = {
        title: ln.replace(/^[•\-]\s*/, "").slice(0, 120),
        company: undefined,
        start: "",
        end: "",
        location: "",
        bullets: [] as any[],
      };
    } else if (/^[•\-]/.test(ln) || /\b(led|launched|drove|owned|reduced|increased|grew|improved|managed|built|executed|delivered)\b/i.test(ln)) {
      (current ??= { bullets: [] }).bullets.push({ text: ln.replace(/^[•\-]\s*/, "") });
    }
  }
  if (current) roles.push(current);

  // 🧩 FIXED TEST EXTRACTION (Type-safe)
  const fullText = lines.join(" ");
  const m = fullText.match(/\b(GMAT|GRE|CAT|SAT|IELTS|TOEFL)\b.*?(\d{2,3})/i);

  let tests: NormalizedProfile["tests"];
  if (m) {
    const testType = m[1].toUpperCase();
    const score = Number(m[2]);

    // Only assign GMAT/GRE explicitly (the rest go in descriptor)
    if (testType === "GMAT" || testType === "GRE") {
      tests = { type: testType, target: score, descriptor: m[0] };
    } else {
      tests = { descriptor: m[0], target: score }; // safe fallback
    }
  }

  // 🧩 EDUCATION
  const eduLines = lines.filter(l => /\b(IIM|IIT|ISB|AIIMS|University|Institute|College|School of Business)\b/i.test(l));
  const education = eduLines.slice(0, 4).map(s => ({
    school: s.replace(/[-•]/g, " ").trim().slice(0, 120),
    degree: undefined,
    discipline: undefined,
    tierHint: /\b(IIM|IIT|ISB|AIIMS)\b/i.test(s) ? ("tier1" as const) : undefined,
  }));

  // 🧩 EXTRACURRICULARS
  const extracurriculars = lines
    .filter(l => /\b(ngo|volunteer|club|society|captain|president|leadership|mentor|organizer|community)\b/i.test(l))
    .slice(0, 3)
    .map(t => ({
      text: t,
      leadership: /\b(president|lead|head|captain|chair|founder)\b/i.test(t),
      recency: "current" as const,
    }));

  // 🧩 INTERNATIONAL
  const intlMatch = /\b(africa|singapore|uae|europe|usa|uk|canada|asia|australia|japan|seasia|southeast|asean|global|international)\b/i.test(text);
  const international = intlMatch
    ? { regions: ["global"], months: 6, evidence: ["keywords"] }
    : undefined;

  return {
    education,
    roles,
    tests,
    extracurriculars,
    international,
    awards: undefined,
  };
}

export default heuristicParseResume;
