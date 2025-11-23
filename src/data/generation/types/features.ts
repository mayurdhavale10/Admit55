// src/data/generation/types/features.ts
// -----------------------------------------------------------
// 🧩 Shared Type Definitions for Resume Generation Features
// -----------------------------------------------------------

// 🎓 Academic Info
export interface AcademicEntry {
  school: string;
  degree: string;
  discipline?: string;
  tierHint?: string;
  year?: string;
}

// 🏭 Industry + Sector Info
export interface Sector {
  sector: string;
  weight?: number;
}

// 🏢 Company Tier Pools
export interface CompanyTiers {
  tier1?: string[];
  tier2?: string[];
  tier3?: string[];
  sample_bullets?: string[];
}

// 💼 Role Categories & Levels
export interface RoleCategory {
  primary: string;
  titles?: {
    junior?: string;
    mid?: string;
    senior?: string;
  };
  titleTemplates?: string[];
}

// 🌍 Geography Info
export interface Geography {
  countries?: string[];
  regions?: string[];
  cities?: string[];
}

// 🏅 Awards & Extracurriculars
export interface AwardPool {
  elite?: string[];
  common?: string[];
}

// 🔢 Global Feature Pool Type
export interface Pools {
  academics?: {
    tier1_elite?: AcademicEntry[];
    tier2_mid?: AcademicEntry[];
    tier3_regular?: AcademicEntry[];
    nontraditional?: AcademicEntry[];
    international_uni?: AcademicEntry[];
  };
  industry?: CompanyTiers & { sectors?: Sector[] };
  jobrole?: {
    role_categories?: RoleCategory[];
    title_synonyms?: Record<string, string[]>;
  };
  geography?: Geography;
  other?: {
    extracurriculars?: string[];
    awards?: string[];
  };
}
