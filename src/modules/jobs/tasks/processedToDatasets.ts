/* eslint-disable @typescript-eslint/no-explicit-any */
import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";

export type Source =
  | "github"
  | "kaggle"
  | "huggingface"
  | "ats"
  | "partner_uploads";

export interface BuildOptions {
  /**
   * Optional dataset "split" name to include in each row, e.g., "train", "dev".
   * Purely metadata; not used for sharding here.
   */
  splitName?: string;
  /**
   * Limit the number of processed files per source (useful for quick runs).
   */
  limitPerSource?: number;
  /**
   * Preferred new name (keep for clarity).
   * If omitted, we will also look at legacy `sources` below.
   */
  includeSources?: Source[];
  /**
   * Legacy name (kept for backward-compat with existing routes).
   */
  sources?: Source[];
}

/** A single JSONL row schema for your LoRA training inputs */
export interface DatasetRow {
  id: string;               // stable id (hash of text or filename)
  source: Source;
  split?: string;
  resume: string;           // raw resume text (already normalized to text stage)
  label?: any;              // optional: your summary schema (function/impact/leadership/international/tools)
  file?: string;            // optional: original filename for traceability
}

const SOURCES_ALL: Source[] = [
  "github",
  "kaggle",
  "huggingface",
  "ats",
  "partner_uploads",
];

const DATA_ROOT = path.join(process.cwd(), "data", "mba");
const RESUMES_RAW_ROOT = path.join(DATA_ROOT, "resumes_raw");
const LABELS_ROOT = path.join(DATA_ROOT, "labels_normalized");
const DATASETS_ROOT = path.join(DATA_ROOT, "datasets");

/**
 * Build a new versioned dataset from processed resumes + labels.
 * Output: data/mba/datasets/vYYYYMMDD_HHMM/dataset.jsonl
 * Also writes/updates: data/mba/datasets/latest
 */
export async function processedToDatasets(
  opts: BuildOptions = {}
): Promise<{ dir: string; count: number }> {
  // resolve sources: prefer includeSources, then sources, else all
  const requested = (opts.includeSources ?? opts.sources ?? SOURCES_ALL) as string[];
  const includeSources: Source[] = normalizeSources(requested);
  const splitName: string | undefined = opts.splitName;
  const limitPerSource: number | undefined = opts.limitPerSource;

  // Ensure roots exist
  await ensureDir(DATASETS_ROOT);

  const versionDir = path.join(DATASETS_ROOT, makeVersionStamp());
  const outFile = path.join(versionDir, "dataset.jsonl");
  await ensureDir(versionDir);

  let totalRows = 0;
  const buffer: string[] = [];

  for (const source of includeSources) {
    const processedDir = path.join(RESUMES_RAW_ROOT, source, "processed");
    const labelDir = path.join(LABELS_ROOT, source, "processed");

    const files = await safeListFiles(processedDir);
    const limited = typeof limitPerSource === "number" ? files.slice(0, limitPerSource) : files;

    for (const file of limited) {
      const abs = path.join(processedDir, file);
      const text = await readResumeText(abs);
      if (!text) continue;

      const base = dropExt(file);
      const labelPathJson = path.join(labelDir, `${base}.json`);
      const label = await safeReadJSON(labelPathJson);

      const id = stableId(text, `${source}:${file}`);

      const row: DatasetRow = {
        id,
        source,
        split: splitName,
        resume: text,
        label,
        file,
      };

      buffer.push(JSON.stringify(row));
      totalRows++;

      // Flush occasionally to keep memory in check
      if (buffer.length >= 500) {
        await appendLines(outFile, buffer);
        buffer.length = 0;
      }
    }
  }

  // Final flush
  if (buffer.length > 0) {
    await appendLines(outFile, buffer);
  }

  // Write/overwrite the "latest" pointer with the version folder name
  const latestFile = path.join(DATASETS_ROOT, "latest");
  await fs.writeFile(latestFile, path.basename(versionDir), "utf8");

  return { dir: versionDir, count: totalRows };
}

/* ---------------------- helpers ---------------------- */

function normalizeSources(xs: string[]): Source[] {
  const allowed = new Set(SOURCES_ALL);
  const out: Source[] = [];
  for (const s of xs) {
    const v = String(s).trim() as Source;
    if (allowed.has(v) && !out.includes(v)) out.push(v);
  }
  return out.length ? out : SOURCES_ALL;
}

function makeVersionStamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const MM = String(d.getMinutes()).padStart(2, "0");
  return `v${yyyy}${mm}${dd}_${HH}${MM}`;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function safeListFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter(e => e.isFile()).map(e => e.name).sort();
  } catch {
    // Directory may not exist yet
    return [];
  }
}

function dropExt(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? filename : filename.slice(0, idx);
}

async function readResumeText(absPath: string): Promise<string | null> {
  const ext = path.extname(absPath).toLowerCase();

  try {
    if (ext === ".txt") {
      const raw = await fs.readFile(absPath, "utf8");
      const text = sanitizeText(raw);
      return text.length ? text : null;
    }

    if (ext === ".json") {
      const j = await safeReadJSON(absPath);
      if (j && typeof j.resume === "string" && j.resume.trim()) {
        return sanitizeText(j.resume);
      }
      if (j && typeof j.text === "string" && j.text.trim()) {
        return sanitizeText(j.text);
      }
      if (j && typeof j.content === "string" && j.content.trim()) {
        return sanitizeText(j.content);
      }
      return null;
    }

    // Ignore other types in v1
    return null;
  } catch {
    return null;
  }
}

function sanitizeText(s: string): string {
  // Basic newline normalization + trim
  return s.replace(/\r\n/g, "\n").replace(/\u0000/g, "").trim();
}

async function safeReadJSON(absPath: string): Promise<any | null> {
  try {
    const raw = await fs.readFile(absPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function stableId(text: string, hint: string): string {
  const h = createHash("sha256");
  h.update(text);
  h.update("|");
  h.update(hint);
  return h.digest("hex").slice(0, 24);
}

async function appendLines(outFile: string, lines: string[]): Promise<void> {
  const payload = lines.join("\n") + "\n";
  await fs.appendFile(outFile, payload, "utf8");
}

/* ---------------------- CLI support (optional) ---------------------- */
declare const require: any | undefined;

const isCLI =
  typeof process !== "undefined" &&
  process.argv &&
  process.argv[1] &&
  process.argv[1].includes("processedToDatasets");

if (isCLI) {
  (async () => {
    const res = await processedToDatasets();
    console.log(`[OK] Wrote ${res.count} rows to ${res.dir}`);
  })().catch((err) => {
    console.error("[ERROR] processedToDatasets failed:", err);
    process.exit(1);
  });
}