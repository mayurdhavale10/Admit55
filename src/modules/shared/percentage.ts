import * as math from "mathjs";

// Extract all percentages (handles "25%", "20 %", "0.25", "increased by 20%")
export function extractPercentages(text: string): number[] {
  const matches = text.match(/(\d+(?:\.\d+)?)\s?%/g) || [];
  const values = matches.map(m => {
    const n = parseFloat(m.replace(/%/g, ""));
    return isFinite(n) ? n : 0;
  });

  // Also handle implicit ratios like "2x", "1.5x"
  const mults = text.match(/(\d+(?:\.\d+)?)\s?[xX]\b/g) || [];
  mults.forEach(m => {
    const n = parseFloat(m.toLowerCase().replace(/x/g, ""));
    if (isFinite(n)) values.push((n - 1) * 100); // convert 2x → 100%
  });

  return values;
}

// Smart comparison
export function isStrongImpact(values: number[], threshold = 20): boolean {
  if (!values.length) return false;
  const max = Math.max(...values);
  return Number(math.compare(max, threshold)) >= 0;  // true if >= threshold (safe float comparison)
}

// Weighted scoring (returns confidence)
export function scorePercentages(values: number[]): { score: number; confidence: number } {
  if (!values.length) return { score: 0, confidence: 0 };
  const max = Math.max(...values);
  const capped = Math.min(100, max);
  return {
    score: Math.min(1, capped / 50), // 50% = full impact
    confidence: values.length > 2 ? 1 : 0.7
  };
}
