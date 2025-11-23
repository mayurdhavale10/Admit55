// src/data/generation/types.ts
// Type declarations for resume normalization / rendering

export interface EducationEntry {
  school: string;
  degree: string;
  discipline?: string;
  tierHint?: string;
  year?: string;
}

export interface RoleBullet {
  text: string;
  metrics?: { pct?: number; value?: number; currency?: string };
}

export interface CareerRole {
  company: string;
  title: string;
  start?: string;
  end?: string;
  location?: string;
  bullets: RoleBullet[];
}

export interface NormalizedResume {
  id: string;
  name: string;
  email: string;
  summary?: string;
  education: EducationEntry[];
  roles: CareerRole[];
  tests?: Record<string, any>;
  extracurriculars?: { text: string; leadership?: boolean; recency?: string }[];
  international?: { regions: string[]; months: number; evidence?: any[] };
  awards?: string[];
  certifications?: string[];
  signals?: Record<string, any>;
}
