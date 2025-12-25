// src/app/mba/tools/profileresumetool/utils/llmClient.ts
import "server-only";

export type ProfileGoal = "MBA" | "MiM" | "Job" | "Internship" | "MS";

export type OptionalContext = {
  goal?: ProfileGoal;
  timelineMonths?: number;
  tier?: string;
  testStatus?: string;
  biggestConcern?: string;
};

export type AnalyzeResult = {
  success: boolean;
  original_resume: string;
  scores: {
    academics: number;
    test_readiness: number;
    leadership: number;
    extracurriculars: number;
    international: number;
    work_impact: number;
    impact: number;
    industry: number;
  };
  strengths: { title: string; score: number; summary: string }[];
  improvements: { area: string; score: number; suggestion: string }[];
  recommendations: {
    id: string;
    type: string;
    area: string;
    priority: "high" | "medium" | "low";
    action: string;
    estimated_impact: string;
    score: number | null;
  }[];
  verification: { ok: boolean; explanation: string };
  upload_meta?: any;
  processing_meta?: any;
  generated_at: string;
  pipeline_version: string;
};

export type MLCallOptions = {
  timeoutMs?: number;
};

class MLServiceError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "MLServiceError";
    this.status = status;
  }
}

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "https://admit55.onrender.com";

function withTimeout(ms: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return { controller, clear: () => clearTimeout(t) };
}

/**
 * Calls Render FastAPI /analyze
 * - Sends resume_text
 * - Sends optional context
 * - Returns AnalyzeResult produced by ML service
 */
export async function callMLAnalyze(params: {
  resumeText: string;
  context?: OptionalContext;
  options?: MLCallOptions;
}): Promise<AnalyzeResult> {
  const { controller, clear } = withTimeout(params.options?.timeoutMs ?? 120_000);

  try {
    const fd = new FormData();
    fd.append("resume_text", params.resumeText);

    if (params.context && typeof params.context === "object") {
      fd.append("context", JSON.stringify(params.context));
    }

    const res = await fetch(`${ML_SERVICE_URL}/analyze`, {
      method: "POST",
      body: fd,
      signal: controller.signal,
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new MLServiceError(
        data?.error || data?.detail || `ML service error (HTTP ${res.status})`,
        res.status
      );
    }

    return data as AnalyzeResult;
  } finally {
    clear();
  }
}
