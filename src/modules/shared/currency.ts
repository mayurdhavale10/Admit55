import currencyCodes from "currency-codes";
import getSymbolFromCurrency from "currency-symbol-map";

export function detectCurrencySymbol(text: string): string | null {
  // Find all ISO codes (USD, INR, GBP, etc.)
  const codes = currencyCodes.codes();
  for (const code of codes) {
    if (new RegExp(`\\b${code}\\b`, "i").test(text)) return code;
  }

  // Find symbol matches
  for (const code of codes) {
    const sym = getSymbolFromCurrency(code);
    if (sym && text.includes(sym)) return code;
  }

  return null;
}

export function normalizeCurrencyValue(text: string): number | null {
  // Detect currency
  const code = detectCurrencySymbol(text);
  if (!code) return null;

  // Extract numeric part
  const numMatch = text.match(/[\d,.]+/);
  if (!numMatch) return null;
  const val = Number(numMatch[0].replace(/,/g, ""));

  // Optional: conversion baseline (e.g., to USD)
  const FX: Record<string, number> = { USD: 1, INR: 0.012, EUR: 1.08, GBP: 1.26, SGD: 0.74 };
  const factor = FX[code] ?? 1;
  return val * factor;
}
