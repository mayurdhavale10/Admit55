// src/app/mba/tools/profileresumetool/utils/api.ts
"use client";

export interface AnalyzeResponse {
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
  strengths: {
    title: string;
    score: number;
    summary: string;
  }[];
  improvements: {
    area: string;
    score: number;
    suggestion: string;
  }[];
  recommendations: {
    id: string;
    type: string;
    area: string;
    priority: string;
    action: string;
    estimated_impact: string;
    score: number | null;
    timeframe?: string; // next_1_3_weeks, next_3_6_weeks, next_3_months
  }[];
  gaps: {
    area: string;
    score: number;
    suggestion: string;
  }[];
  verification: {
    ok: boolean;
    explanation: string;
  };
  improved_resume: string;

  // Discovery context info
  discovery_context?: {
    goal_type?: string;
    target_schools?: string;
    timeline?: string;
    test_status?: string;
    work_experience?: string;
    biggest_concern?: string;
  };

  // Consultant summary
  consultant_summary?: string;

  upload_meta?: {
    original_filename: string;
    format: string;
    file_size_bytes: number;
    characters?: number;
    words?: number;
    extraction_method: string;
  };

  processing_meta?: {
    total_duration_seconds: number;
    input_method: string;
    pdf_extraction: string;
    docx_extraction: string;
    timestamp: string;
    scoring_system: string;
    average_score: number;
    total_score: number;
    consultant_mode?: boolean;
  };

  generated_at: string;
  pipeline_version: string;
}

export interface RewriteResponse {
  success: boolean;
  improved_resume: string;
  meta: {
    original_length: number;
    improved_length: number;
    processing_time_seconds: number;
    timestamp: string;
  };
}

type ApiError = Error & { status?: number; details?: any };

async function buildApiError(res: Response, fallbackMsg: string): Promise<ApiError> {
  let details: any = null;

  try {
    const ct = res.headers.get("content-type") || "";
    details = ct.includes("application/json") ? await res.json() : await res.text();
  } catch {
    details = null;
  }

  const message =
    (typeof details === "object" && (details?.error || details?.message)) ||
    (typeof details === "string" && details.trim()) ||
    fallbackMsg ||
    `Request failed (${res.status})`;

  const err: ApiError = new Error(message);
  err.status = res.status;
  err.details = details;
  return err;
}

/* ---------------------------------------------------------
   FILE UPLOAD + FULL ANALYSIS
--------------------------------------------------------- */
export async function analyzeResumeFile(
  file: File,
  discoveryAnswers?: Record<string, string> | null
): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("file", file);

  // Add discovery answers if provided (multipart expects string)
  if (discoveryAnswers) {
    form.append("discovery_answers", JSON.stringify(discoveryAnswers));
  }

  const res = await fetch("/api/mba/profileresumetool/analyze", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw await buildApiError(res, "Failed to analyze resume");
  }

  return res.json();
}

/* ---------------------------------------------------------
   DIRECT TEXT ANALYSIS
--------------------------------------------------------- */
export async function analyzeResumeText(
  text: string,
  discoveryAnswers?: Record<string, string> | null
): Promise<AnalyzeResponse> {
  const res = await fetch("/api/mba/profileresumetool/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_text: text,
      discovery_answers: discoveryAnswers || null, // keep as object/null for JSON route
    }),
  });

  if (!res.ok) {
    throw await buildApiError(res, "Failed to analyze text");
  }

  return res.json();
}

/* ---------------------------------------------------------
   REWRITE ONLY (IMPROVEMENT)
--------------------------------------------------------- */
export async function rewriteResume(text: string): Promise<RewriteResponse> {
  const res = await fetch("/api/mba/profileresumetool/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: text }),
  });

  if (!res.ok) {
    throw await buildApiError(res, "Rewrite failed");
  }

  return res.json();
}

/* ---------------------------------------------------------
   HEALTH CHECK
--------------------------------------------------------- */
export async function checkAnalyzeHealth(): Promise<{
  status: string;
  endpoint: string;
  capabilities: string[];
  checks: {
    python_module_exists: boolean;
    python_path_env: string | null;
    huggingface_configured: boolean;
    groq_api_configured: boolean;
    use_local_lora: boolean;
    scoring_system: string;
    required_score_keys: string[];
    pdf_extraction: string;
    docx_extraction: string;
    max_file_size_mb: number;
    discovery_questions_enabled?: boolean;
  };
  timestamp: string;
}> {
  const res = await fetch("/api/mba/profileresumetool/analyze", { method: "GET" });

  if (!res.ok) {
    throw await buildApiError(res, "Health check failed");
  }

  return res.json();
}
