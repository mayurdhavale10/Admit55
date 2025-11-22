// src/app/api/mba/profileresumetool/analyze/route.ts
import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const maxDuration = 120;

// ============================================================
// CONFIG
// ============================================================
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 50000;
const PYTHON_TIMEOUT = 120_000;

const ALLOWED_MIME_TYPES = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ],
};

const REQUIRED_SCORE_KEYS = [
  "academics",
  "test_readiness",
  "leadership",
  "extracurriculars",
  "international",
  "work_impact",
  "impact",
  "industry"
];

// ============================================================
// HELPER: Extract JSON from mixed output
// ============================================================
function extractJSONBlock(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No JSON object found in output");
  }
  try {
    return JSON.parse(match[0]);
  } catch (err: unknown) {
    throw new Error(`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ============================================================
// HELPER: Validate and normalize analysis result
// ============================================================
function validateAndNormalizeResult(parsed: any): any {
  // Ensure all required top-level keys exist
  const normalized: any = {
    scores: parsed.scores || {},
    strengths: parsed.strengths || [],
    improvements: parsed.improvements || [],
    recommendations: parsed.recommendations || [],
    gaps: parsed.gaps || [],
    verification: parsed.verification || { ok: true, explanation: "No verification performed" },
    improved_resume: parsed.improved_resume || parsed.original_resume || "",
    original_resume: parsed.original_resume || "",
    generated_at: parsed.generated_at || new Date().toISOString(),
    pipeline_version: parsed.pipeline_version || "3.2.0"
  };

  // Validate and normalize scores (0-10 range)
  const scores = normalized.scores;
  for (const key of REQUIRED_SCORE_KEYS) {
    if (!(key in scores)) {
      console.warn(`[Validation] Missing score key '${key}', defaulting to 5.0`);
      scores[key] = 5.0;
    } else {
      const value = scores[key];
      if (typeof value !== "number" || value < 0 || value > 10) {
        console.warn(`[Validation] Invalid score for '${key}': ${value}, defaulting to 5.0`);
        scores[key] = 5.0;
      }
    }
  }

  // Normalize strengths (ensure all have required shape)
  normalized.strengths = (normalized.strengths || []).map((s: any, i: number) => ({
    title: s.title || `Strength ${i + 1}`,
    score: typeof s.score === "number" ? Math.max(0, Math.min(100, Math.round(s.score))) : 70,
    summary: s.summary || "Notable achievement identified."
  }));

  // Normalize improvements (ensure all have required shape)
  normalized.improvements = (normalized.improvements || []).map((imp: any, i: number) => ({
    area: imp.area || `Area ${i + 1}`,
    score: typeof imp.score === "number" ? Math.max(0, Math.min(100, Math.round(imp.score))) : 50,
    suggestion: imp.suggestion || imp.recommendation || "Consider strengthening this area."
  }));

  // Normalize recommendations (ensure full shape with all fields)
  normalized.recommendations = (normalized.recommendations || []).map((rec: any, i: number) => ({
    id: rec.id || `rec_${i + 1}`,
    type: rec.type || "other",
    area: rec.area || rec.title || "General",
    priority: rec.priority || "medium",
    action: rec.action || rec.recommendation || "",
    estimated_impact: rec.estimated_impact || "",
    score: rec.score !== undefined && rec.score !== null 
      ? Math.max(0, Math.min(100, Math.round(Number(rec.score))))
      : null
  }));

  // Normalize gaps (fallback structure)
  normalized.gaps = (normalized.gaps || []).map((g: any, i: number) => ({
    area: g.area || `Gap ${i + 1}`,
    score: typeof g.score === "number" ? g.score : 5.0,
    suggestion: g.suggestion || "Consider improvement in this area."
  }));

  console.log("[Validation] Result normalized successfully");
  console.log(`[Validation] Scores:`, scores);
  console.log(`[Validation] Strengths: ${normalized.strengths.length}, Improvements: ${normalized.improvements.length}, Recommendations: ${normalized.recommendations.length}`);

  return normalized;
}

// ============================================================
// FILE VALIDATION HELPERS
// ============================================================
function validateFileType(fileName: string, mimeType: string): boolean {
  const lowerFileName = fileName.toLowerCase();
  if (lowerFileName.endsWith(".pdf")) {
    return ALLOWED_MIME_TYPES.pdf.includes(mimeType);
  }
  if (lowerFileName.endsWith(".docx")) {
    return ALLOWED_MIME_TYPES.docx.includes(mimeType);
  }
  return false;
}

function isPDFBuffer(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer.toString("utf-8", 0, 5) === "%PDF-";
}

function isDOCXBuffer(buffer: Buffer): boolean {
  return buffer.length > 2 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// ============================================================
// DOCX EXTRACTION (Node.js only - PDF handled by Python)
// ============================================================
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    console.log("[DOCX Extract] Extracting text from DOCX...");
    const result = await Promise.race([
      mammoth.extractRawText({ buffer }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DOCX parsing timeout")), 30000)
      ),
    ]) as any;

    const extractedText = result?.value || "";
    console.log(`[DOCX Extract] ✓ Extracted ${extractedText.length} chars`);
    return extractedText;
  } catch (err: unknown) {
    console.error("[DOCX Extract] Error:", err);
    throw new Error(`DOCX extraction failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ============================================================
// FILE PROCESSING (PDF returns buffer, DOCX returns text)
// ============================================================
async function processFile(file: any): Promise<{
  text: string;
  format: string;
  meta: any;
  pdfBuffer?: Buffer;
}> {
  console.log(`[File Process] Processing: ${file?.name}, Type: ${file?.type}, Size: ${file?.size}`);

  if (!file || !file.name) {
    throw new Error("Invalid file object");
  }

  const fileName = file.name.toLowerCase();
  let buffer: Buffer;

  try {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    console.log(`[File Process] Buffer created: ${buffer.length} bytes`);
  } catch (err: unknown) {
    throw new Error(`Failed to read file buffer: ${err instanceof Error ? err.message : String(err)}`);
  }

  // PDF - Return buffer for Python to extract
  if (fileName.endsWith(".pdf")) {
    if (!isPDFBuffer(buffer)) {
      throw new Error("Invalid PDF file format");
    }
    console.log("[File Process] ✓ PDF validated (will be extracted by Python)");
    return {
      text: "",
      format: "pdf",
      pdfBuffer: buffer,
      meta: {
        original_filename: file.name,
        format: "pdf",
        file_size_bytes: file.size,
        extraction_method: "python_pypdf2",
      },
    };
  }
  // DOCX - Extract in Node.js with mammoth
  else if (fileName.endsWith(".docx")) {
    if (!isDOCXBuffer(buffer)) {
      throw new Error("Invalid DOCX file format");
    }
    const extractedText = await extractTextFromDOCX(buffer);
    const cleanedText = cleanText(extractedText);

    if (cleanedText.length === 0) {
      throw new Error("No text extracted from DOCX. Document may be empty.");
    }

    console.log(`[File Process] ✓ DOCX extracted: ${cleanedText.length} chars`);
    return {
      text: cleanedText,
      format: "docx",
      meta: {
        original_filename: file.name,
        format: "docx",
        file_size_bytes: file.size,
        characters: cleanedText.length,
        words: cleanedText.split(/\s+/).filter(Boolean).length,
        extraction_method: "nodejs_mammoth",
      },
    };
  } else {
    throw new Error(`Unsupported file type: ${fileName}`);
  }
}

// ============================================================
// PYTHON CANDIDATES
// ============================================================
function getPythonCandidates(): { cmd: string; args?: string[] }[] {
  const isWin = process.platform === "win32";

  // Use explicit PYTHON_PATH if set
  if (process.env.PYTHON_PATH && process.env.PYTHON_PATH.trim()) {
    console.log(`[Python] Using explicit PYTHON_PATH: ${process.env.PYTHON_PATH}`);
    return [{ cmd: process.env.PYTHON_PATH.trim(), args: [] }];
  }

  const candidates: { cmd: string; args?: string[] }[] = [];

  if (isWin) {
    const venvPath = path.join(process.cwd(), "venv", "Scripts", "python.exe");
    if (fs.existsSync(venvPath)) {
      candidates.push({ cmd: venvPath, args: [] });
    }
    candidates.push({ cmd: "py", args: ["-3.10"] });
    candidates.push({ cmd: "py", args: ["-3"] });
    candidates.push({ cmd: "python", args: [] });
  } else {
    const venvPath = path.join(process.cwd(), "venv", "bin", "python3");
    if (fs.existsSync(venvPath)) {
      candidates.push({ cmd: venvPath, args: [] });
    }
    candidates.push({ cmd: "python3", args: [] });
    candidates.push({ cmd: "python", args: [] });
  }

  return candidates;
}

// ============================================================
// PYTHON ANALYSIS
// ============================================================
async function analyzeWithPython(
  resumeText: string,
  isPDF: boolean = false,
  pdfBuffer?: Buffer
): Promise<any> {
  const projectRoot = process.cwd();

  // Early validation: Check API keys based on configuration
  const useHuggingFace = process.env.USE_HUGGINGFACE === "true";
  const useLocalLora = process.env.USE_LOCAL_LORA === "true";
  
  if (useHuggingFace && !process.env.HF_API_KEY) {
    throw new Error(
      "HF_API_KEY is required when USE_HUGGINGFACE is enabled. " +
      "Please set HF_API_KEY in your environment variables."
    );
  }
  
  if (!useHuggingFace && !useLocalLora && !process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is required when neither USE_HUGGINGFACE nor USE_LOCAL_LORA is enabled. " +
      "Please set GROQ_API_KEY in your environment variables."
    );
  }

  const env = {
    ...process.env,
    PYTHONIOENCODING: "utf-8",
    PYTHONUTF8: "1",
    // HuggingFace Configuration
    USE_HUGGINGFACE: process.env.USE_HUGGINGFACE || "false",
    HF_API_KEY: process.env.HF_API_KEY || "",
    HF_MODEL: process.env.HF_MODEL || "Mayururur/admit55-llama32-3b-lora",
    // Groq Configuration
    GROQ_API_KEY: process.env.GROQ_API_KEY || "",
    GROQ_API_URL: process.env.GROQ_API_URL || "https://api.groq.com/openai/v1",
    GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    // Local LoRA Configuration
    USE_LOCAL_LORA: process.env.USE_LOCAL_LORA || "false",
    LORA_ADAPTER_DIR: process.env.LORA_ADAPTER_DIR || "lora-llama3",
    LORA_BASE_MODEL: process.env.LORA_BASE_MODEL || "meta-llama/Llama-3.2-3B-Instruct",
  };

  const pythonModulePath = path.join(
    projectRoot,
    "src",
    "modules",
    "mba",
    "pipeline",
    "mba_hybrid_pipeline.py"
  );

  if (!fs.existsSync(pythonModulePath)) {
    throw new Error(`Python pipeline module not found at ${pythonModulePath}`);
  }

  const tmpDir = os.tmpdir();
  const unique = crypto.randomBytes(8).toString("hex");
  let tmpFilePath: string;

  // Save file for Python (PDF or TXT) with proper extension
  try {
    if (isPDF && pdfBuffer) {
      tmpFilePath = path.join(tmpDir, `admit55_resume_${unique}.pdf`);
      fs.writeFileSync(tmpFilePath, pdfBuffer);
      console.log(`[Python] ✓ Saved PDF to: ${tmpFilePath}`);
    } else {
      tmpFilePath = path.join(tmpDir, `admit55_resume_${unique}.txt`);
      fs.writeFileSync(tmpFilePath, resumeText, { encoding: "utf8" });
      console.log(`[Python] ✓ Saved text to: ${tmpFilePath}`);
    }
  } catch (err: unknown) {
    throw new Error(`Failed to write temp file: ${err instanceof Error ? err.message : String(err)}`);
  }

  const moduleSpec = "src.modules.mba.pipeline.mba_hybrid_pipeline";
  const moduleArgsBase = ["-m", moduleSpec];
  const candidates = getPythonCandidates();
  let lastError: Error | null = null;

  // Try each Python candidate
  for (const candidate of candidates) {
    const cmd = candidate.cmd;
    const prefixArgs = candidate.args ?? [];
    const args = [...prefixArgs, ...moduleArgsBase, tmpFilePath];

    console.log(`[Python] Trying: ${cmd} ${args.join(" ")}`);

    try {
      const pythonProcess = spawn(cmd, args, {
        cwd: projectRoot,
        env,
        shell: false,
        windowsHide: true,
      });

      let stdoutData = "";
      let stderrData = "";
      let spawnErrored = false;

      // Check if spawn failed immediately
      const spawnProbe = new Promise<void>((resolve) => {
        pythonProcess.on("error", (err: unknown) => {
          spawnErrored = true;
          lastError = err instanceof Error ? err : new Error(String(err));
          resolve();
        });
        setTimeout(resolve, 150);
      });

      await spawnProbe;

      if (spawnErrored) {
        pythonProcess.kill?.();
        continue;
      }

      // Capture output
      pythonProcess.stdout?.on("data", (d: Buffer) => {
        stdoutData += d.toString();
      });

      pythonProcess.stderr?.on("data", (d: Buffer) => {
        const chunk = d.toString();
        stderrData += chunk;
        // Log Python progress (avoid logging API keys)
        if (chunk.includes("[") || chunk.toLowerCase().includes("step") || chunk.toLowerCase().includes("pdf") || chunk.toLowerCase().includes("hf")) {
          const sanitized = chunk.replace(/Bearer\s+[^\s]+/g, "Bearer [REDACTED]");
          console.log("[Python]", sanitized.trim());
        }
      });

      // Set timeout
      const timeout = setTimeout(() => {
        console.log("[Python] Timeout reached, killing process...");
        pythonProcess.kill("SIGTERM");
      }, PYTHON_TIMEOUT);

      // Wait for completion
      const result = await new Promise<any>((resolve, reject) => {
        pythonProcess.on("close", (code: number) => {
          clearTimeout(timeout);

          if (code !== 0) {
            let errorMsg = "Python analysis failed";
            const errorDetails = stderrData;

            // Provide specific error messages based on stderr
            if (stderrData.includes("ModuleNotFoundError")) {
              errorMsg = "Missing Python dependencies. Run: pip install -r requirements.txt";
            } else if (stderrData.includes("HF_API_KEY") || stderrData.includes("HuggingFace")) {
              errorMsg = "HuggingFace API key invalid or missing. Please check your HF_API_KEY environment variable.";
            } else if (stderrData.includes("GROQ_API_KEY") || stderrData.includes("Missing GROQ_API_KEY")) {
              errorMsg = "Groq API key invalid or missing. Please check your GROQ_API_KEY environment variable.";
            } else if (stderrData.includes("PyPDF2")) {
              errorMsg = "PyPDF2 not installed. Run: pip install PyPDF2";
            } else if (stderrData.includes("No text extracted")) {
              errorMsg = "PDF is empty or image-based. OCR may be required.";
            } else if (stderrData.includes("HTTP 401") || stderrData.includes("Unauthorized")) {
              errorMsg = "API authentication failed. Please verify your API keys.";
            } else if (stderrData.includes("hf_inference")) {
              errorMsg = "HuggingFace inference module not found. Make sure hf_inference.py is in the pipeline directory.";
            }

            // In development, include stderr details
            if (process.env.NODE_ENV === "development") {
              reject(new Error(`${errorMsg}\n\nDetails:\n${errorDetails}`));
            } else {
              reject(new Error(errorMsg));
            }
            return;
          }

          try {
            const parsed = extractJSONBlock(stdoutData);
            const normalized = validateAndNormalizeResult(parsed);
            resolve(normalized);
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            // In development, include raw output snippet
            if (process.env.NODE_ENV === "development") {
              const snippet = stdoutData.substring(0, 500);
              reject(new Error(`Failed to parse output: ${errMsg}\n\nRaw output snippet:\n${snippet}`));
            } else {
              reject(new Error(`Failed to parse output: ${errMsg}`));
            }
          }
        });

        pythonProcess.on("error", (err: unknown) => {
          clearTimeout(timeout);
          reject(new Error(`Cannot execute Python: ${err instanceof Error ? err.message : String(err)}`));
        });
      });

      // Cleanup temp file on success
      try {
        if (fs.existsSync(tmpFilePath)) {
          fs.unlinkSync(tmpFilePath);
          console.log(`[Python] ✓ Cleaned up temp file: ${tmpFilePath}`);
        }
      } catch  {
        console.warn("[Python] Warning: Could not delete temp file:", tmpFilePath);
      }

      return result;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[Python] Candidate ${cmd} failed:`, err instanceof Error ? err.message : String(err));
      // Try next candidate
    }
  }

  // Cleanup on failure
  try {
    if (fs.existsSync(tmpFilePath!)) {
      fs.unlinkSync(tmpFilePath!);
      console.log(`[Python] ✓ Cleaned up temp file after failure: ${tmpFilePath}`);
    }
  } catch (e) {
    console.warn("[Python] Warning: Could not delete temp file on failure");
  }

  throw new Error(
    `Could not start Python. Tried: ${candidates.map((c) => c.cmd).join(", ")}. ` +
    `Last error: ${lastError?.message || "unknown"}. ` +
    `Make sure Python 3.10+ is installed and in PATH.`
  );
}

// ============================================================
// MAIN ENDPOINT
// ============================================================
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    console.log("\n" + "=".repeat(60));
    console.log("[Analyze API] Starting MBA resume analysis (8-key scoring)");
    console.log("=".repeat(60));

    const contentType = req.headers.get("content-type") || "";
    let resumeText = "";
    let uploadMeta: any = null;
    let isPDF = false;
    let pdfBuffer: Buffer | undefined;

    // HANDLE FILE UPLOAD
    if (contentType.includes("multipart/form-data")) {
      console.log("[Analyze API] Processing file upload...");
      const form = await req.formData();
      const file = form.get("file") as any;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      console.log(`[Analyze API] File received: ${file.name} (${file.type}, ${file.size} bytes)`);

      if (file.size === 0) {
        return NextResponse.json({ error: "File is empty" }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            received_size_mb: (file.size / 1024 / 1024).toFixed(2),
          },
          { status: 400 }
        );
      }

      if (!validateFileType(file.name, file.type)) {
        return NextResponse.json(
          {
            error: "Invalid file type. Only PDF and DOCX files are supported.",
            received_type: file.type,
          },
          { status: 400 }
        );
      }

      try {
        const processed = await processFile(file);
        if (processed.pdfBuffer) {
          isPDF = true;
          pdfBuffer = processed.pdfBuffer;
          resumeText = "";
          uploadMeta = processed.meta;
          console.log(`[Analyze API] ✓ PDF validated, extraction delegated to Python`);
        } else {
          resumeText = processed.text;
          uploadMeta = processed.meta;
          console.log(`[Analyze API] ✓ DOCX extracted: ${resumeText.length} characters`);
        }
      } catch (err: unknown) {
        console.error("[Analyze API] File processing error:", err instanceof Error ? err.message : String(err));
        return NextResponse.json(
          {
            error: "Failed to process file",
            details: err instanceof Error ? err.message : String(err),
          },
          { status: 422 }
        );
      }
    }
    // HANDLE DIRECT TEXT OR BASE64 PDF
    else if (contentType.includes("application/json")) {
      console.log("[Analyze API] Processing JSON input...");
      const body = await req.json();

      // Handle base64 PDF from upload endpoint
      if (body.file_data && body.format === "pdf") {
        try {
          pdfBuffer = Buffer.from(body.file_data, "base64");
          isPDF = true;
          resumeText = "";
          uploadMeta = body.meta || { format: "pdf", extraction_method: "python_pypdf2" };
          console.log("[Analyze API] ✓ Received base64 PDF from upload endpoint");
        } catch (err: unknown) {
          return NextResponse.json(
            {
              error: "Failed to decode base64 PDF data",
              details: err instanceof Error ? err.message : String(err),
            },
            { status: 400 }
          );
        }
      }
      // Handle direct text
      else {
        resumeText = body.resume_text;
        if (!resumeText || typeof resumeText !== "string") {
          return NextResponse.json({ error: "resume_text required (string)" }, { status: 400 });
        }
        console.log(`[Analyze API] ✓ Direct text received: ${resumeText.length} characters`);
      }
    } else {
      return NextResponse.json(
        { error: "Invalid content type. Use multipart/form-data or application/json" },
        { status: 400 }
      );
    }

    // VALIDATE TEXT LENGTH (skip for PDF - Python will handle)
    if (!isPDF) {
      if (resumeText.length < MIN_TEXT_LENGTH) {
        return NextResponse.json(
          {
            error: `Text too short (${resumeText.length} characters). Minimum ${MIN_TEXT_LENGTH} characters required.`,
          },
          { status: 400 }
        );
      }

      if (resumeText.length > MAX_TEXT_LENGTH) {
        console.warn(`[Analyze API] Text truncated from ${resumeText.length} to ${MAX_TEXT_LENGTH} chars`);
        resumeText = resumeText.slice(0, MAX_TEXT_LENGTH);
      }
    }

    // RUN PYTHON ANALYSIS
    console.log("[Analyze API] Starting Python analysis pipeline...");
    const analysisResult = await analyzeWithPython(resumeText, isPDF, pdfBuffer);

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n" + "=".repeat(60));
    console.log(`[Analyze API] ✓ Analysis complete in ${totalDuration}s`);
    console.log("=".repeat(60) + "\n");

    // BUILD RESPONSE - Forward all rich fields unchanged from Python
    const scores = analysisResult.scores;
    const totalScore = (Object.values(scores) as number[]).reduce((a, b) => a + b, 0);
    const avgScore = totalScore / REQUIRED_SCORE_KEYS.length;

    return NextResponse.json({
      success: true,
      // Forward all Python outputs unchanged
      original_resume: analysisResult.original_resume,
      scores: analysisResult.scores,
      strengths: analysisResult.strengths,
      improvements: analysisResult.improvements,
      recommendations: analysisResult.recommendations,
      gaps: analysisResult.gaps,
      verification: analysisResult.verification,
      improved_resume: analysisResult.improved_resume,
      generated_at: analysisResult.generated_at,
      pipeline_version: analysisResult.pipeline_version,
      // Add processing metadata
      upload_meta: uploadMeta,
      processing_meta: {
        total_duration_seconds: parseFloat(totalDuration),
        input_method: isPDF ? "pdf_file" : uploadMeta ? "docx_file" : "direct_text",
        pdf_extraction: isPDF ? "python_pypdf2" : "n/a",
        docx_extraction: uploadMeta?.format === "docx" ? "nodejs_mammoth" : "n/a",
        timestamp: new Date().toISOString(),
        scoring_system: "8-key",
        average_score: parseFloat(avgScore.toFixed(2)),
        total_score: parseFloat(totalScore.toFixed(2)),
      },
    });
  } catch (err: unknown) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.error("\n" + "=".repeat(60));
    console.error(`[Analyze API] ✗ Analysis failed after ${duration}s`);
    console.error("Error:", err instanceof Error ? err.message : String(err));
    console.error("=".repeat(60) + "\n");

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unexpected error occurred",
        details:
          process.env.NODE_ENV === "development"
            ? err instanceof Error
              ? err.stack
              : undefined
            : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================
// HEALTH CHECK ENDPOINT
// ============================================================
export async function GET() {
  const projectRoot = process.cwd();
  const pythonModulePath = path.join(
    projectRoot,
    "src",
    "modules",
    "mba",
    "pipeline",
    "mba_hybrid_pipeline.py"
  );

  const checks = {
    python_module_exists: fs.existsSync(pythonModulePath),
    python_path_env: process.env.PYTHON_PATH || null,
    huggingface_configured: process.env.USE_HUGGINGFACE === "true" && !!process.env.HF_API_KEY,
    groq_api_configured: !!process.env.GROQ_API_KEY,
    use_local_lora: process.env.USE_LOCAL_LORA === "true",
    scoring_system: "8-key (v3.2)",
    required_score_keys: REQUIRED_SCORE_KEYS,
    pdf_extraction: "python_pypdf2",
    docx_extraction: "nodejs_mammoth",
    max_file_size_mb: MAX_FILE_SIZE / 1024 / 1024,
  };

  const allGood =
    checks.python_module_exists &&
    (checks.huggingface_configured || checks.groq_api_configured || checks.use_local_lora);

  return NextResponse.json(
    {
      status: allGood ? "healthy" : "degraded",
      endpoint: "/api/mba/profileresumetool/analyze",
      capabilities: ["file_upload", "direct_text", "pdf", "docx"],
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allGood ? 200 : 503 }
  );
}