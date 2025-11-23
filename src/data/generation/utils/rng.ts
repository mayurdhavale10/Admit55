// src/data/generation/utils/rng.ts
// Simple deterministic PRNG (Mulberry32 algorithm)

export function makeRng(seed: number = Date.now()): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Example:
 * const rng = makeRng(42);
 * console.log(rng()); // deterministic between runs
 */
