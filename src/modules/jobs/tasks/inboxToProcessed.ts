/* eslint-disable @typescript-eslint/no-explicit-any */
import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";
import { normalizeResumeText } from "@src/modules/collector/utils/normalizers";

export type Source = "github" | "kaggle" | "huggingface" | "ats" | "partner_uploads";

export interface Args {
  source: Source;
  /** optional cap for quick tests */
  limit?: number;
  /** minimum normalized length to accept (default 400) */
  minChars?: number;
}

const DATA_ROOT = path.join(process.cwd(), "data", "mba");
const RAW_ROOT = path.join(DATA_ROOT, "resumes_raw");
const LOGS_ROOT = path.join(DATA_ROOT, "logs", "ingest");
const SEEN_PATH = path.join(LOGS_ROOT, "seen.json");

type SeenDB = { hashes: string[] };

export async function inboxToProcessed(
  args: Args
): Promise<{ source: Source; moved: number; duplicates: number; tooShort: number; errors: number; skipped: number }> {
  const { source, limit, minChars = 400 } = args;

  const inboxDir = path.join(RAW_ROOT, source, "inbox");
  const processedDir = path.join(RAW_ROOT, source, "processed");
  const rejectedDir = path.join(RAW_ROOT, source, "rejected");

  await ensureDir(processedDir);
  await ensureDir(rejectedDir);
  await ensureDir(LOGS_ROOT);

  const seen = await loadSeen();
  const seenSet = new Set<string>(seen.hashes || []);

  const files = (await safeListFiles(inboxDir)).filter(f => !f.startsWith("."));
  const work = typeof limit === "number" ? files.slice(0, limit) : files;

  let moved = 0;
  let tooShort = 0;
  let duplicates = 0;
  let errors = 0;
  let skipped = 0;

  for (const file of work) {
    const abs = path.join(inboxDir, file);
    try {
      const raw = await readResumePayload(abs);
      if (!raw) {
        skipped++;
        await moveTo(abs, path.join(rejectedDir, file));
        continue;
      }

      const normalized = normalizeResumeText(raw);
      const normLower = normalized.toLowerCase();

      // Gate 1: min length
      if (normLower.length < minChars) {
        tooShort++;
        await moveTo(abs, path.join(rejectedDir, file));
        continue;
      }

      // Gate 2: de-dup by content hash
      const key = sha256(normLower);
      if (seenSet.has(key)) {
        duplicates++;
        await moveTo(abs, path.join(rejectedDir, file));
        continue;
      }

      // Accept → write normalized txt into processed with a stable-ish name
      const outName = `${Date.now()}_${key}.txt`;
      const outPath = path.join(processedDir, outName);
      await fs.writeFile(outPath, normalized, "utf8");

      // Mark as seen & remove from inbox
      seenSet.add(key);
      await fs.unlink(abs).catch(() => moveTo(abs, path.join(rejectedDir, file))); // fallback move if unlink fails
      moved++;
    } catch {
      errors++;
      await moveTo(abs, path.join(rejectedDir, file)).catch(() => void 0);
    }
  }

  // persist seen DB
  await saveSeen({ hashes: Array.from(seenSet) });

  return { source, moved, duplicates, tooShort, errors, skipped };
}

/* ---------------- helpers ---------------- */

async function ensureDir(d: string) {
  await fs.mkdir(d, { recursive: true });
}

async function safeListFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter(e => e.isFile()).map(e => e.name).sort();
  } catch {
    return [];
  }
}

/** Try to read txt or common JSON shapes {resume|text|content} */
async function readResumePayload(absPath: string): Promise<string | null> {
  const ext = path.extname(absPath).toLowerCase();
  try {
    if (ext === ".txt") {
      return await fs.readFile(absPath, "utf8");
    }
    if (ext === ".json") {
      const raw = await fs.readFile(absPath, "utf8");
      const j = JSON.parse(raw);
      const c =
        (typeof j.resume === "string" && j.resume) ||
        (typeof j.text === "string" && j.text) ||
        (typeof j.content === "string" && j.content) ||
        "";
      return c ? String(c) : null;
    }
    // ignore other types in v1
    return null;
  } catch {
    return null;
  }
}

async function moveTo(src: string, dst: string) {
  await ensureDir(path.dirname(dst));
  try {
    await fs.rename(src, dst);
  } catch {
    // cross-device or rename fail; fallback to copy+unlink
    await fs.copyFile(src, dst).catch(() => void 0);
    await fs.unlink(src).catch(() => void 0);
  }
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

async function loadSeen(): Promise<SeenDB> {
  try {
    const raw = await fs.readFile(SEEN_PATH, "utf8");
    const j = JSON.parse(raw);
    if (Array.isArray(j?.hashes)) return { hashes: j.hashes as string[] };
    return { hashes: [] };
  } catch {
    return { hashes: [] };
  }
}

async function saveSeen(db: SeenDB): Promise<void> {
  await ensureDir(path.dirname(SEEN_PATH));
  await fs.writeFile(SEEN_PATH, JSON.stringify({ hashes: db.hashes }, null, 2), "utf8");
}

/* -------------- optional CLI --------------
   node --loader tsx ./src/modules/jobs/tasks/inboxToProcessed.ts github
------------------------------------------- */
if (require.main === module) {
  (async () => {
    const src = (process.argv[2] as Source) || "github";
    const res = await inboxToProcessed({ source: src });
    // eslint-disable-next-line no-console
    console.table([res]);
  })().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
}
