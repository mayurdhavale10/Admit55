// src/data/generation/utils/sampler.ts
// Small utility lib: weighted sampling + helpers.
// Production-minded: deterministic via optional seed, defensive checks.

import crypto from "crypto";

/** Simple seeded RNG wrapper (Mulberry32) for reproducibility when seed provided. */
export function makeRng(seed?: number) {
  if (typeof seed !== "number") {
    return Math.random;
  }
  // Mulberry32
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Choose random element from array (optionally with rng) */
export function choice<T>(arr: T[], rng = Math.random): T | null {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(rng() * arr.length)];
}

/** Weighted sample from an array of {item, weight} */
export function weightedChoice<T>(
  items: T[],
  weights: number[] | undefined,
  rng = Math.random
): T | null {
  if (!items || items.length === 0) return null;
  if (!weights || weights.length !== items.length) return choice(items, rng);
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return choice(items, rng);
  const r = rng() * sum;
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (r <= acc) return items[i];
  }
  return items[items.length - 1];
}

/** Shuffle array in-place */
export function shuffle<T>(a: T[], rng = Math.random) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deterministic id (inc) */
export function makeId(prefix = "CAND", idx = 0) {
  const rnd = crypto.randomBytes(4).toString("hex").slice(0, 6);
  return `${prefix}-${String(idx + 1).padStart(4, "0")}-${rnd}`;
}
export default { makeRng, choice, weightedChoice, shuffle, makeId };
