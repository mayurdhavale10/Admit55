// src/modules/core-nlp/impact.ts
// Detects quantifiable impact in resume bullets — the “so what?” factor AdComs and recruiters care about (numbers, results, scale).


import { detectCurrencySymbol, normalizeCurrencyValue } from "@src/modules/shared/currency";
import { extractPercentages, scorePercentages } from "@src/modules/shared/percentage";

export type ImpactSignals = {
  anyPct20Plus: boolean;
  pctScore: number;
  anyLargeMoney: boolean;
  moneyValue?: number;
  launchesCount: number;
  confidence: number;
};

// --- Global-safe RegExp helper
function ensureGlobal(re: RegExp, addFlags = "g"): RegExp {
  if (re.global) return re;
  const flagsSet = new Set((re.flags + addFlags).split(""));
  return new RegExp(re.source, Array.from(flagsSet).join(""));
}

// --- Safe matchAll wrapper
function safeMatchAll(text: string, re: RegExp): IterableIterator<RegExpMatchArray> {
  return text.matchAll(ensureGlobal(re));
}

// --- Numeric cleanup helper
function toNum(s: string): number {
  const n = Number(s.replace(/[, ]+/g, ""));
  return isFinite(n) ? n : 0;
}

// ----------------------------------------------------
// 🔍 MAIN DETECTOR
// ----------------------------------------------------
export function impactSignalsFromText(text: string): ImpactSignals {
  const t = String(text || "");

  // --- Patterns
  const launchNumRe = /launched\s+(\d+)\+?\s+(?:new\s+)?(?:products?|features?)/gi;
  const launchGenericRe = /\b(?:launched|shipped|rolled\s*out|released|deployed|implemented)\b[^.]*\b(?:product|feature)s?\b/gi;

  // --- Context keywords (kept for biasing future heuristics)
  const contextRe = /\b(?:aov|conversion|mom|yoy|p&l|gtm|transaction value|revenue|uplift)\b/gi;

  // ----------------------------------------------------
  // 🧮 1️⃣ Percentages (using helper)
  // ----------------------------------------------------
  const pctValues = extractPercentages(t);
  const { score: pctScore } = scorePercentages(pctValues);
  const anyPct20Plus = pctValues.some(v => v >= 20);

  // ----------------------------------------------------
  // 💰 2️⃣ Currency / Money (using helper)
  // ----------------------------------------------------
  let anyLargeMoney = false;
  let moneyValue: number | undefined = undefined;

  const currencyRegex = /(?:₹|rs\.?\s?|inr\s?|usd\s?|\$|eur|€|gbp|£|sgd|cad|aud|aed|¥|jpy|hkd|₩)?\s?\d+[,\d]*(?:\.\d+)?\s?(m|k|million|billion|crore|lakh)?/gi;
  for (const m of safeMatchAll(t, currencyRegex)) {
    const raw = m[0];
    const symbol = detectCurrencySymbol(raw);
    const normalizedVal = normalizeCurrencyValue(raw);

    if (normalizedVal && normalizedVal >= 100000) {
      anyLargeMoney = true;
      moneyValue = normalizedVal;
      break;
    }
  }

  // ----------------------------------------------------
  // 🚀 3️⃣ Launches
  // ----------------------------------------------------
  let launchesCount = 0;
  for (const m of safeMatchAll(t, launchNumRe)) {
    launchesCount += toNum(m[1]) || 0;
  }

  if (launchesCount === 0) {
    let generic = 0;
    for (const _ of safeMatchAll(t, launchGenericRe)) generic += 1;
    if (generic > 0) launchesCount = generic;
  }

  // ----------------------------------------------------
  // 📈 4️⃣ Confidence Calculation
  // ----------------------------------------------------
  let detectedSignals = 0;
  if (anyPct20Plus) detectedSignals++;
  if (anyLargeMoney) detectedSignals++;
  if (launchesCount > 0) detectedSignals++;
  const confidence = Math.min(1, detectedSignals / 3 + 0.1);

  // (optional) touch context regex to future-proof usage
  for (const _ of safeMatchAll(t, contextRe)) {
    // no-op for now
  }

  // ----------------------------------------------------
  // ✅ 5️⃣ Return structured result
  // ----------------------------------------------------
  return {
    anyPct20Plus,
    pctScore: Number(pctScore.toFixed(3)),
    anyLargeMoney,
    moneyValue,
    launchesCount,
    confidence: Number(confidence.toFixed(2)),
  };
}

export default impactSignalsFromText;
