/**
 * 📘 synonymNormalizer.ts
 * -------------------------------------------
 * Preprocessing module to normalize synonymous terms
 * before dataset preparation or LoRA/QLoRA fine-tuning.
 *
 * ✅ Uses:
 *  - Explicit alias dictionary (/config/semanticAliases.json)
 *  - Embedding-based similarity for unseen variants
 *
 * 🧠 Goal:
 *  Ensure consistent, semantically aligned training data
 *  (e.g., "headed" → "led", "worked in Dubai" → "international exposure")
 */

import fs from "fs";
import path from "path";
import { cosineSimilarity, embedText } from "../utils/embeddings";

// Load alias dictionary
const ALIAS_PATH = path.resolve(process.cwd(), "config/semanticAliases.json");

let aliasDictionary: Record<string, string[]> = {};
try {
  const raw = fs.readFileSync(ALIAS_PATH, "utf-8");
  aliasDictionary = JSON.parse(raw);
  console.log(`[Normalizer] Loaded aliases from ${ALIAS_PATH}`);
} catch (err) {
  console.error(`[Normalizer] Failed to load aliases: ${err}`);
  aliasDictionary = {};
}

/**
 * Precompute normalized mapping: every synonym → canonical key
 */
const replacementMap: Record<string, string> = {};
for (const [canonical, synonyms] of Object.entries(aliasDictionary)) {
  synonyms.forEach((s) => {
    replacementMap[s.toLowerCase()] = canonical.toLowerCase();
  });
}

/**
 * ✅ Normalize synonyms in text (rule-based first)
 */
function normalizeRuleBased(text: string): string {
  let normalized = text;
  for (const [synonym, canonical] of Object.entries(replacementMap)) {
    const regex = new RegExp(`\\b${synonym}\\b`, "gi");
    normalized = normalized.replace(regex, canonical);
  }
  return normalized;
}

/**
 * ✅ Normalize semantically similar words using embeddings (cosine > 0.85)
 * ⚠️ Expensive — only run if you have GPU or cache enabled.
 */
async function normalizeByEmbedding(text: string): Promise<string> {
  const words = text.split(/\s+/);
  const canonicalTerms = Object.keys(aliasDictionary);
  const canonicalEmbeddings = await Promise.all(
    canonicalTerms.map((t) => embedText(t))
  );

  const processedWords = await Promise.all(
    words.map(async (w) => {
      if (replacementMap[w.toLowerCase()]) return replacementMap[w.toLowerCase()];

      const wEmbed = await embedText(w);
      let bestMatch = "";
      let bestScore = 0;

      for (let i = 0; i < canonicalTerms.length; i++) {
        const sim = cosineSimilarity(wEmbed, canonicalEmbeddings[i]);
        if (sim > bestScore) {
          bestScore = sim;
          bestMatch = canonicalTerms[i];
        }
      }

      return bestScore >= 0.85 ? bestMatch : w;
    })
  );

  return processedWords.join(" ");
}

/**
 * 🔧 Main function — normalize a resume string (multi-line safe)
 */
export async function normalizeText(input: string): Promise<string> {
  try {
    const ruleNormalized = normalizeRuleBased(input);
    const semanticallyNormalized = await normalizeByEmbedding(ruleNormalized);
    return semanticallyNormalized
      .replace(/\s{2,}/g, " ")
      .replace(/\u0000/g, "")
      .trim();
  } catch (err) {
    console.error("[Normalizer] Failed normalization:", err);
    return input;
  }
}

/**
 * 🧪 Test (CLI usage)
 * Example:
 *   npx tsx modules/preprocessing/synonymNormalizer.ts "Led a global team in Dubai"
 */
if (require.main === module) {
  (async () => {
    const sample =
      process.argv.slice(2).join(" ") ||
      "Headed a 5-member global team based in Singapore delivering $10M growth.";
    const out = await normalizeText(sample);
    console.log("\n🧠 Input:", sample);
    console.log("✅ Normalized:", out);
  })();
}
