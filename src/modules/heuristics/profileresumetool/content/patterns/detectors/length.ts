// src/modules/heuristics/profileresumetool/content/patterns/detectors/length.ts
// 🎯 PURPOSE: Analyze resume bullet lengths to ensure optimal clarity and impact.
// Detects overly long or too-short bullets (for ATS readability and impact balance).

import type { ProfileResume } from "@/src/modules/schemas/profileresumetool/types";

/** Signal structure for each bullet — includes word count + flags */
export type BulletLengthSignal = {
  roleId: string;   // Unique role identifier (e.g., "google-2020")
  idx: number;      // Bullet index within that role
  words: number;    // Word count of bullet
  tooLong: boolean; // Flag: > 22 words → too verbose
  tooShort: boolean;// Flag: < 6 words → too vague
};

/** Aggregated length stats across all roles */
export type LengthAnalysis = {
  perBullet: BulletLengthSignal[];   // Detailed signals per bullet
  avgByRole: Record<string, number>; // Average words per bullet per role
  longShare: number;                 // % share of overly long bullets (0–1)
};

type RoleItem = NonNullable<ProfileResume["roles"]>[number];

/** 🔠 Utility to generate consistent role IDs */
function roleIdOf(role: RoleItem, fallbackIndex: number): string {
  const base = (role.company ?? "role").trim().replace(/\s+/g, "-").toLowerCase();
  const start = (role.start ?? String(fallbackIndex)).trim().slice(0, 10);
  return `${base}-${start || fallbackIndex}`;
}

/** 🧮 Simple word counter */
function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * 🚀 Main function: Analyzes bullet quality across roles.
 * Detects extremes (too short / too long) and computes averages per role.
 */
export function analyzeLength(pr: ProfileResume): LengthAnalysis {
  const perBullet: BulletLengthSignal[] = [];
  const avgByRole: Record<string, number> = {};

  (pr.roles ?? []).forEach((role, rIdx) => {
    const rid = roleIdOf(role, rIdx);
    const bullets = role.bullets ?? [];
    let roleTotal = 0;
    let roleLong = 0;

    bullets.forEach((b, idx) => {
      const text = (b?.text ?? "").trim();
      const wc = wordCount(text);

      // ✅ Heuristic thresholds based on industry best practices:
      //  - Ideal bullet = 8–18 words
      //  - Too short = < 6 words → lacks clarity
      //  - Too long = > 22 words → hard to read or unfocused
      const tooLong = wc > 22;
      const tooShort = wc > 0 && wc < 6;

      perBullet.push({ roleId: rid, idx, words: wc, tooLong, tooShort });
      roleTotal += wc;
      if (tooLong) roleLong += 1;
    });

    avgByRole[rid] = bullets.length ? Number((roleTotal / bullets.length).toFixed(2)) : 0;
  });

  // 🧠 Portfolio-level summary:
  const allBullets = (pr.roles ?? []).reduce((acc, role) => acc + (role.bullets?.length ?? 0), 0);
  const allLong = perBullet.filter((p) => p.tooLong).length;
  const longShare = allBullets ? Number((allLong / allBullets).toFixed(2)) : 0;

  return { perBullet, avgByRole, longShare };
}

/** 🧪 Test mode — run directly for debugging */
if (require.main === module) {
  const mock: ProfileResume = {
    roles: [
      {
        company: "Admit55",
        start: "2024-01",
        end: "2025-01",
        bullets: [
          { text: "Led a team of 5 engineers to launch a new AI resume product." },
          { text: "Reduced latency by 60% across inference pipelines." },
          { text: "Built dashboards." }
        ]
      }
    ]
  } as any;

  console.log(analyzeLength(mock));
}

export default analyzeLength;
