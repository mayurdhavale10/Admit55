import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

// ============================================================
// CONFIGURATION
// ============================================================
export const runtime = "nodejs";
export const maxDuration = 45;

const PYTHON_TIMEOUT = 40000; // 40 seconds
const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 50000;

function getPythonCommand(): string {
  return process.platform === "win32" ? "python" : "python3";
}

// ============================================================
// MAIN REWRITE HANDLER
// ============================================================
export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    console.log("[Rewrite API] Starting resume improvement...");

    // ---- PARSE REQUEST ----
    const body = await req.json();
    const resumeText = body.resume_text;

    // ---- VALIDATE INPUT ----
    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "resume_text is required and must be a string" },
        { status: 400 }
      );
    }

    const trimmedText = resumeText.trim();

    if (trimmedText.length < MIN_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: `Resume text too short (${trimmedText.length} characters). Minimum ${MIN_TEXT_LENGTH} required.`,
        },
        { status: 400 }
      );
    }

    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: `Resume text too long (${trimmedText.length} characters). Maximum ${MAX_TEXT_LENGTH} allowed.`,
        },
        { status: 400 }
      );
    }

    console.log(`[Rewrite API] Processing ${trimmedText.length} characters...`);

    // ---- PREPARE PYTHON EXECUTION ----
    const pythonCmd = getPythonCommand();
    const projectRoot = process.cwd();

    const pythonModulePath = path.join(
      projectRoot,
      "src",
      "modules",
      "mba",
      "pipeline",
      "mba_hybrid_pipeline.py"
    );

    if (!fs.existsSync(pythonModulePath)) {
      console.error(`[Rewrite API] Python module not found at: ${pythonModulePath}`);
      return NextResponse.json(
        { error: "Python pipeline module not found. Check server configuration." },
        { status: 500 }
      );
    }

    // ---- PREPARE ENVIRONMENT VARIABLES ----
    const env = {
      ...process.env,
      GROQ_API_KEY: process.env.GROQ_API_KEY || "",
      GROQ_API_URL: process.env.GROQ_API_URL || "https://api.groq.com/openai/v1",
      GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      USE_LOCAL_LORA: process.env.USE_LOCAL_LORA || "false",
      LORA_ADAPTER_DIR: process.env.LORA_ADAPTER_DIR || "lora-llama3",
      LORA_BASE_MODEL: process.env.LORA_BASE_MODEL || "meta-llama/Llama-3.2-3B-Instruct",
    };

    // Check Groq API key if not using local LoRA
    if (!env.GROQ_API_KEY && env.USE_LOCAL_LORA !== "true") {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured and local LoRA disabled" },
        { status: 500 }
      );
    }

    // ---- SPAWN PYTHON PROCESS ----
    console.log(`[Rewrite API] Using Python command: ${pythonCmd}`);
    
    const pythonProcess = spawn(
      pythonCmd,
      ["-m", "src.modules.mba.pipeline.mba_hybrid_pipeline", "--rewrite-only", trimmedText],
      {
        cwd: projectRoot,
        env: env,
        shell: true,
      }
    );

    let stdoutData = "";
    let stderrData = "";

    // Collect stdout
    pythonProcess.stdout.on("data", (data) => {
      const chunk = data.toString();
      stdoutData += chunk;
      // Log Python progress
      if (chunk.includes("[") || chunk.includes("improve")) {
        console.log("[Python]", chunk.trim());
      }
    });

    // Collect stderr
    pythonProcess.stderr.on("data", (data) => {
      const chunk = data.toString();
      stderrData += chunk;
      console.error("[Python Error]", chunk.trim());
    });

    // Setup timeout
    const timeoutId = setTimeout(() => {
      pythonProcess.kill("SIGTERM");
      console.error("[Rewrite API] Python process timed out");
    }, PYTHON_TIMEOUT);

    // ---- WAIT FOR COMPLETION ----
    const improvedResume: string = await new Promise((resolve, reject) => {
      pythonProcess.on("close", (code) => {
        clearTimeout(timeoutId);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (code !== 0) {
          console.error(`[Rewrite API] Python process exited with code ${code}`);
          console.error(`[Rewrite API] stderr: ${stderrData}`);

          // Parse error type
          let errorMsg = "Resume improvement failed";
          if (stderrData.includes("ModuleNotFoundError")) {
            errorMsg = "Missing Python dependencies. Run: pip install -r requirements.txt";
          } else if (stderrData.includes("GROQ_API_KEY")) {
            errorMsg = "Groq API key invalid or missing";
          } else if (stderrData.includes("LoRA")) {
            errorMsg = "LoRA model loading failed";
          } else if (stderrData) {
            errorMsg = stderrData.slice(-300); // Last 300 chars
          }

          return reject(new Error(errorMsg));
        }

        console.log(`[Rewrite API] ✓ Python process completed in ${duration}s`);

        try {
          // ---- EXTRACT IMPROVED RESUME ----
          // Look for markers first
          const marker = "===IMPROVED_RESUME_START===";
          const endMarker = "===IMPROVED_RESUME_END===";

          const start = stdoutData.indexOf(marker);
          const end = stdoutData.indexOf(endMarker);

          if (start !== -1 && end !== -1) {
            // Markers found - extract content between them
            const resume = stdoutData.slice(start + marker.length, end).trim();
            
            if (!resume) {
              throw new Error("Improved resume is empty");
            }
            
            console.log(`[Rewrite API] ✓ Extracted improved resume (${resume.length} chars)`);
            return resolve(resume);
          }

          // Fallback: No markers found - output is the improved resume
          console.warn("[Rewrite API] Markers not found, using raw output");
          const cleanedOutput = stdoutData.trim();
          
          if (!cleanedOutput) {
            throw new Error("No output from Python script");
          }

          resolve(cleanedOutput);

        } catch (err: any) {
          console.error("[Rewrite API] Output parsing failed:", err.message);
          console.error("[Rewrite API] Raw output:", stdoutData.slice(-500));
          reject(new Error(`Failed to parse improved resume: ${err.message}`));
        }
      });

      pythonProcess.on("error", (err) => {
        clearTimeout(timeoutId);
        console.error("[Rewrite API] Failed to start Python process:", err);
        reject(new Error(`Cannot execute Python: ${err.message}`));
      });
    });

    // ---- VALIDATE OUTPUT ----
    if (!improvedResume || improvedResume.length < MIN_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: "Generated resume is too short or empty. Please try again.",
        },
        { status: 500 }
      );
    }

    // ---- SUCCESS RESPONSE ----
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Rewrite API] ✓ Total request time: ${totalDuration}s`);

    return NextResponse.json({
      success: true,
      improved_resume: improvedResume,
      meta: {
        original_length: trimmedText.length,
        improved_length: improvedResume.length,
        processing_time_seconds: parseFloat(totalDuration),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (err: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[Rewrite API] ✗ Request failed after ${duration}s:`, err.message);

    return NextResponse.json(
      {
        error: err?.message || "Unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? err?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================
// HEALTH CHECK
// ============================================================
export async function GET() {
  const pythonCmd = getPythonCommand();
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
    python_command: pythonCmd,
    groq_api_configured: !!process.env.GROQ_API_KEY,
    use_local_lora: process.env.USE_LOCAL_LORA === "true",
  };

  const allGood = checks.python_module_exists && 
                  (checks.groq_api_configured || checks.use_local_lora);

  return NextResponse.json(
    {
      status: allGood ? "healthy" : "degraded",
      endpoint: "/api/mba/profileresumetool/rewrite",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allGood ? 200 : 503 }
  );
}