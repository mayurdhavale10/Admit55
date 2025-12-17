// src/app/mba/tools/resumewriter/utils/resumeTypes.ts

export type ResumeBasicInfo = {
  firstName?: string;
  lastName?: string;
  gender?: string;

  headline?: string;

  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;

  // ✅ NEW: used to populate the right-side university spot dynamically
  university?: string;

  /**
   * Consulting Classic blue bar items (max 5)
   * Example: ["Cars24 Arabia (UAE)", "Alvarez & Marsal (India)", ...]
   */
  metaBar?: string[];
};

/**
 * ✅ Consulting-Classic work experience shape (single source of truth)
 * Matches the table layout in the template.
 */
export type ExperienceBullet = {
  text: string;
  highlights?: string[]; // optional; template can bold these if provided
};

export type ExperienceRow = {
  leftLabel: string; // supports "\n" (e.g., "Strategy\n@CEO Office")
  bullets: ExperienceBullet[];
};

export type ExperienceItem = {
  companyLine: string; // "Company - Role"
  duration: string; // "10 months"
  dateRange: string; // "Aug’24 – Present"
  rows: ExperienceRow[];
};

export type ProjectItem = {
  name?: string;
  bullets?: string[];
};

export type LeadershipItem = {
  name?: string;
  bullets?: string[];
};

/**
 * (You can later adapt Education to your table rows too,
 * but keeping your current shape for now.)
 */
export type EducationItem = {
  degree?: string;
  school?: string;
  location?: string;

  startDate?: string;
  endDate?: string;

  details?: string[];
};

export type ResumeData = {
  basicInfo: ResumeBasicInfo;

  summary?: string;

  education: EducationItem[];

  /**
   * ✅ Now aligned to Consulting Classic template
   */
  experiences: ExperienceItem[];

  internships: ExperienceItem[]; // keep same structure for consistency (optional)

  projects: ProjectItem[];
  leadership: LeadershipItem[];

  achievements: string[];

  skills: string[];
  tools: string[];
  certifications: string[];
  languages: string[];

  globalExposure: string[];
};
