// src/app/mba/tools/resumewriter/utils/schema.ts
import { z } from "zod";

/**
 * Zod schemas for the Resume Writer tool.
 * Keep this in sync with ResumeWriterAnswers in api.ts
 */

export const WorkExperienceSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  location: z.string().optional(),
  start_date: z.string().optional(), // e.g. "Jan 2022"
  end_date: z.string().optional(),   // e.g. "Present" or "Dec 2024"
  is_current: z.boolean().optional(),
  responsibilities: z.string().min(1, "Responsibilities are required"),
  achievements: z.string().min(1, "Achievements are required"),
  tools_tech: z.string().optional(),
});

export const EducationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  field_of_study: z.string().optional(),
  start_year: z.string().optional(),
  end_year: z.string().optional(),
  grade_or_gpa: z.string().optional(),
  highlights: z.string().optional(),
});

export const ProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  context: z.string().optional(),
  impact: z.string().optional(),
  tools_tech: z.string().optional(),
});

export const ResumeWriterAnswersSchema = z.object({
  // BASIC INFO
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(5, "Phone is required"),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),

  // TARGETS
  target_role: z.string().min(1, "Target role is required"),
  target_industry: z.string().min(1, "Target industry is required"),
  target_region: z.string().optional(),
  target_mba_programs: z.string().optional(),

  // WORK EXPERIENCE
  work_experience: z
    .array(WorkExperienceSchema)
    .min(1, "At least one work experience entry is required"),

  // EDUCATION
  education: z
    .array(EducationSchema)
    .min(1, "At least one education entry is required"),

  // ACHIEVEMENTS / LEADERSHIP
  achievements: z.string().optional(),
  leadership: z.string().optional(),

  // PROJECTS
  projects: z.array(ProjectSchema).optional(),

  // EXTRACURRICULARS
  extracurriculars: z.string().optional(),

  // SKILLS & CERTIFICATIONS
  skills: z.string().optional(),
  certifications: z.string().optional(),

  // PREFERENCES
  tone_preference: z
    .enum(["conservative", "balanced", "aggressive"])
    .optional(),
  length_preference: z
    .enum(["one_page", "two_page", "auto"])
    .optional(),
});

export type ResumeWriterAnswers = z.infer<typeof ResumeWriterAnswersSchema>;
