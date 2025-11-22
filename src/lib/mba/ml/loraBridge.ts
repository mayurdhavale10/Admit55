// src/lib/mba/ml/loraBridge.ts
import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import { standardizeResumeText } from "./standardize"; // ✅ NEW import

/**
 * Options for running LoRA/QLoRA inference on a resume text.
 */
export type LoraInferOptions = {
  /** Path to your infer script (repo-relative or absolute). */
  scriptPath?: string; // default: data/mba/fine_tune/scripts/infer_lora.py

  /** Base model ID (e.g. Hugging Face model). */
  base?: string; // default: Qwen/Qwen2.5-0.5B-Instruct

  /** Path to LoRA adapter directory (required). */
  adapter: string;

  /** Optional: Path to few-shot examples JSONL file. */
  fewShotsPath?: string;

  /** LoRA or QLoRA method — used only for provenance/debugging. */
  method?: "lora" | "qlora";

  // === Generation controls ===
  maxNewTokens?: number;
  doSample?: boolean;
  temperature?: number;
  topP?: number;
  topK?: number;

  /** Python interpreter to use. Defaults to Windows venv or 'python'. */
  pythonBin?: string;

  /** Kill the process automatically if it exceeds this timeout (ms). */
  timeoutMs?: number;
};

/**
 * Standardized output structure from LoRA/QLoRA inference.
 */
export type LoraInferOutput =
  | { ok: true; json: any; stdout: string; stderr: string; outPath?: string }
  | { ok: false; error: string; stdout: string; stderr: string };

/**
 * Run LoRA/QLoRA inference on a single resume text.
 * Bridges Node.js → Python process and returns parsed output.
 */
export async function runLoraWithResumeText(
  resumeText: string,
  opts: LoraInferOptions
): Promise<LoraInferOutput> {
  const {
    scriptPath = "data/mba/fine_tune/scripts/infer_lora.py",
    base = "Qwen/Qwen2.5-0.5B-Instruct",
    adapter,
    fewShotsPath,
    method = "lora",
    maxNewTokens,
    doSample,
    temperature,
    topP,
    topK,
    pythonBin = process.platform === "win32"
      ? ".venv\\Scripts\\python.exe"
      : "python",
    timeoutMs = 180_000, // default 3 min
  } = opts;

  // === Safety: adapter required ===
  if (!adapter) {
    return {
      ok: false,
      error: "❌ adapter path is required",
      stdout: "",
      stderr: "",
    };
  }

  // === STEP 1: Standardize resume text before inference ===
  const cleanText = standardizeResumeText(resumeText ?? "");
  if (!cleanText.trim()) {
    return {
      ok: false,
      error: "❌ Empty or invalid resume text after standardization",
      stdout: "",
      stderr: "",
    };
  }

  // === STEP 2: Create temporary workspace
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "admit55-"));
  const resumeFile = path.join(tmpDir, "resume.txt");
  const outPath = path.join(tmpDir, "out.json");
  await fs.writeFile(resumeFile, cleanText, "utf8");

  // === STEP 3: Build Python args
  const args = [
    scriptPath,
    "--resume_file",
    resumeFile,
    "--base",
    base,
    "--adapter",
    adapter,
    "--out",
    outPath,
  ];

  if (fewShotsPath) args.push("--few_shots", fewShotsPath);
  if (typeof maxNewTokens === "number") args.push("--max_new_tokens", String(maxNewTokens));

  if (doSample) {
    args.push("--do_sample");
    if (typeof temperature === "number") args.push("--temperature", String(temperature));
    if (typeof topP === "number") args.push("--top_p", String(topP));
    if (typeof topK === "number") args.push("--top_k", String(topK));
  }

  console.log(`[LORA] 🚀 Launching Python process (${method}) with adapter: ${adapter}`);

  // === STEP 4: Spawn the Python subprocess
  const child = spawn(pythonBin, args, { stdio: ["ignore", "pipe", "pipe"] });

  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];

  child.stdout.on("data", (c) => stdoutChunks.push(Buffer.from(c)));
  child.stderr.on("data", (c) => stderrChunks.push(Buffer.from(c)));

  const done = new Promise<{ code: number | null }>((resolve) =>
    child.on("close", (code) => resolve({ code }))
  );

  // Timeout protection
  const timer = setTimeout(() => {
    try {
      console.warn("[LORA] ⚠️ Timeout exceeded, killing process");
      child.kill("SIGKILL");
    } catch (e) {
      console.error("[LORA] ⚠️ Failed to kill timed-out process:", e);
    }
  }, timeoutMs);

  const { code } = await done.finally(() => clearTimeout(timer));
  const stdout = Buffer.concat(stdoutChunks).toString("utf8");
  const stderr = Buffer.concat(stderrChunks).toString("utf8");

  // === STEP 5: Handle non-zero exit
  if (code !== 0) {
    console.error(`[LORA] ❌ infer_lora.py exited with code ${code}`);
    console.error(stderr);
    return {
      ok: false,
      error: `infer_lora.py exited with code ${code}`,
      stdout,
      stderr,
    };
  }

  // === STEP 6: Parse model output JSON
  try {
    const raw = await fs.readFile(outPath, "utf8");
    const maybeJson = JSON.parse(raw);
    console.log("[LORA] ✅ Parsed model JSON successfully.");
    return { ok: true, json: maybeJson, stdout, stderr, outPath };
  } catch (e: any) {
    console.error("[LORA] ⚠️ Could not parse model output JSON:", e.message);
    return {
      ok: false,
      error: `Output at ${outPath} was not valid JSON: ${e.message}`,
      stdout,
      stderr,
    };
  }
}
