// src/app/mba/tools/profileresumetool/utils/pipeline.ts
import "server-only";
import type { OptionalContext, AnalyzeResult } from "./llmClient";
import { callMLAnalyze } from "./llmClient";

function nowIso() {
  return new Date().toISOString();
}

function normalizeResumeText(resumeText: string): string {
  return (resumeText || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/**
 * ML-service pipeline:
 * ✅ no Groq/OpenAI/Gemini calls here
 * ✅ just forwards resume_text + optional context to Render FastAPI
 */
export async function runProfileResumePipeline(params: {
  resumeText: string;
  context?: OptionalContext;
  inputMeta?: {
    input_method: "upload" | "text";
    original_filename?: string;
    format?: string;
    file_size_bytes?: number;
    extraction_method?: string;
  };
}): Promise<AnalyzeResult> {
  const resume = normalizeResumeText(params.resumeText);

  if (!resume) {
    return {
      success: false,
      original_resume: "",
      scores: {
        academics: 5,
        test_readiness: 5,
        leadership: 5,
        extracurriculars: 5,
        international: 5,
        work_impact: 5,
        impact: 5,
        industry: 5,
      },
      strengths: [],
      improvements: [],
      recommendations: [],
      verification: { ok: false, explanation: "Empty resume text." },
      upload_meta: params.inputMeta || undefined,
      processing_meta: {
        total_duration_seconds: 0,
        input_method: params.inputMeta?.input_method || "text",
        timestamp: nowIso(),
      },
      generated_at: nowIso(),
      pipeline_version: "ml-service",
    };
  }

  const result = await callMLAnalyze({
    resumeText: resume,
    context: params.context,
    options: { timeoutMs: 120_000 },
  });

  // attach upload_meta if ML service didn’t include it
  return {
    ...result,
    upload_meta: result.upload_meta ?? params.inputMeta ?? undefined,
  };
}
