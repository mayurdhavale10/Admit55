import type { ProfileResume } from "@/src/modules/schemas/profileresumetool/types";

export type BulletLengthSignal = {
  roleId: string;
  idx: number;
  words: number;
  tooLong: boolean;
  tooShort: boolean;
};

export type LengthAnalysis = {
  perBullet: BulletLengthSignal[];
  avgByRole: Record<string, number>;
  longShare: number;
};

type RoleItem = NonNullable<ProfileResume["roles"]>[number];

function roleIdOf(role: RoleItem, fallbackIndex: number): string {
  const base = (role.company ?? "role").trim().replace(/\s+/g, "-").toLowerCase();
  const start = (role.start ?? String(fallbackIndex)).trim().slice(0, 10);
  return `${base}-${start || fallbackIndex}`;
}

function wordCount(s: string) {
  const m = s.trim().split(/\s+/).filter(Boolean);
  return m.length;
}

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
      const tooLong = wc > 22;
      const tooShort = wc > 0 && wc < 6;
      perBullet.push({ roleId: rid, idx, words: wc, tooLong, tooShort });
      roleTotal += wc;
      if (tooLong) roleLong += 1;
    });

    avgByRole[rid] = bullets.length ? roleTotal / bullets.length : 0;
  });

  const allBullets = (pr.roles ?? []).reduce((acc, role) => acc + (role.bullets?.length ?? 0), 0);
  const allLong = perBullet.filter((p) => p.tooLong).length;
  const longShare = allBullets ? allLong / allBullets : 0;

  return { perBullet, avgByRole, longShare };
}
