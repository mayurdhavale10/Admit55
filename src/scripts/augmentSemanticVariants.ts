/**
 * 🚀 augmentSemanticVariants.ts (Offline Edition)
 * --------------------------------------------------------
 * Generates semantically equivalent variants of resume bullets
 * using synonym normalization + embedding similarity filtering.
 *
 * No API calls. 100% offline.
 * Integrates with: /modules/preprocessing/synonymNormalizer.ts
 * and /modules/utils/embeddings.ts
 *
 * Author: Mayur Dhavale (Admit55)
 * --------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import { normalizeText } from "@src/modules/preprocessing/synonymNormalizer";
import { embedText, cosineSimilarity } from "@src/modules/utils/embeddings";

// === CONFIG ===
const INPUT_PATH = "data/mba/labels_normalized/real/processed.jsonl"; // original dataset
const OUTPUT_DIR = "data/mba/augmented";
const VARIANTS_PER_SAMPLE = 3;
const SIMILARITY_THRESHOLD = 0.85; // discard too-similar variants

// === UTILS ===
function readJSONL(filePath: string): any[] {
  return fs
    .readFileSync(filePath, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writeJSONL(filePath: string, data: any[]) {
  fs.writeFileSync(filePath, data.map((x) => JSON.stringify(x)).join("\n") + "\n", "utf-8");
}

function timestamp() {
  return new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 12);
}

function randomReplace(text: string): string {
  // lightweight random replacements to create phrasing variety
  const swaps: [RegExp, string][] = [
    [/\bled\b/gi, "headed"],
    [/\bheaded\b/gi, "supervised"],
    [/\bmanaged\b/gi, "oversaw"],
    [/\bimproved\b/gi, "enhanced"],
    [/\bdelivered\b/gi, "achieved"],
    [/\bworked\b/gi, "collaborated"],
    [/\bteam\b/gi, "group"],
    [/\bproject\b/gi, "initiative"],
  ];

  let out = text;
  const applied = swaps.sort(() => 0.5 - Math.random()).slice(0, 3); // apply 3 random changes
  for (const [regex, repl] of applied) out = out.replace(regex, repl);
  return out;
}

// === CORE LOGIC ===
async function randomReplaceSafe(text: string): Promise<string> {
  const normalized = await normalizeText(text);
  const swaps: [RegExp, string][] = [
    [/\bled\b/gi, "headed"],
    [/\bheaded\b/gi, "supervised"],
    [/\bmanaged\b/gi, "oversaw"],
    [/\bimproved\b/gi, "enhanced"],
    [/\bdelivered\b/gi, "achieved"],
    [/\bworked\b/gi, "collaborated"],
    [/\bteam\b/gi, "group"],
    [/\bproject\b/gi, "initiative"],
  ];
  let out = normalized;
  const applied = swaps.sort(() => 0.5 - Math.random()).slice(0, 3);
  for (const [regex, repl] of applied) out = out.replace(regex, repl);
  return out;
}
