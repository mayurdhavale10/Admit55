// src/app/mba/tools/resumewriter/utils/api.ts

export type ResumeWriterAnswers = {
  basic_info: {
    full_name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin_url?: string;
    target_role?: string;
    target_geography?: string;
    summary_preference?: "short" | "medium" | "detailed";
  };
  education: Array<{
    institution: string;
    degree: string;
    field_of_study?: string;
    location?: string;
    start_year?: string;
    end_year?: string;
    is_current?: boolean;
    gpa?: string;
    highlights?: string;
  }>;
  experience: Array<{
    organization: string;
    title: string;
    location?: string;
    start_month?: string;
    start_year?: string;
    end_month?: string;
    end_year?: string;
    is_current?: boolean;
    scope?: string;
    bullets?: string;
  }>;
  projects: Array<{
    title?: string;
    organization?: string;
    location?: string;
    start_month?: string;
    start_year?: string;
    end_month?: string;
    end_year?: string;
    is_current?: boolean;
    context?: string;
    bullets?: string;
    outcome?: string;
  }>;
  leadership_and_ec: {
    positions?: string;
    initiatives?: string;
    volunteering?: string;
    awards?: string;
  };
  skills_and_preferences: {
    technical_skills?: string;
    domain_expertise?: string;
    languages?: string;
    certifications?: string;
    resume_style?: "consulting" | "product" | "quant" | "general_mba";
    tone?: "conservative" | "balanced" | "aggressive";
  };
  constraints?: {
    page_limit?: "one_page" | "two_page";
    include_photo?: boolean;
    include_gpa?: boolean;
  };
};

export type ResumeWriterResponse = {
  resume_text: string;
  sections?: {
    header?: string;
    summary?: string;
    education?: string;
    experience?: string;
    projects?: string;
    leadership_and_ec?: string;
    skills?: string;
  };
  meta?: {
    generated_at: string;
    model: string;
    pipeline_version: string;
  };
};

// ✅ Corrected path – matches: src/app/api/mba/resumewriter/generate/route.ts
const RESUME_WRITER_API =
  process.env.NEXT_PUBLIC_RESUME_WRITER_API_URL ||
  "/api/mba/resumewriter/generate";

export async function generateResume(
  answers: ResumeWriterAnswers
): Promise<ResumeWriterResponse> {
  const res = await fetch(RESUME_WRITER_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answers }),
  });

  if (!res.ok) {
    let message = `Resume writer failed with status ${res.status} (${res.statusText})`;

    try {
      const errJson = await res.json();
      if (errJson?.detail) {
        message += ` – ${errJson.detail}`;
      }
    } catch {
      // ignore JSON parse errors, keep default message
    }

    throw new Error(message);
  }

  const data = (await res.json()) as ResumeWriterResponse;
  return data;
}
