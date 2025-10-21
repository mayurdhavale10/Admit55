import { z } from "zod";

export const BulletZ = z.object({
  text: z.string(),
  roleId: z.string().optional()
});

export const RoleZ = z.object({
  company: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string().optional(),
  bullets: z.array(BulletZ).default([]),
  teamSize: z.number().optional(),
  scope: z.string().optional()
});

export const ProfileResumeZ = z.object({
  userId: z.string(),
  basics: z.object({
    name: z.string().optional(),
    email: z.string().optional()
  }).partial(),
  education: z.array(z.object({
    school: z.string(),
    degree: z.string(),
    gpa: z.string().optional()
  })).default([]),
  tests: z.object({
    gmat: z.any().optional(),
    gre: z.any().optional(),
    ielts: z.any().optional(),
    toefl: z.any().optional()
  }).partial().optional(),
  roles: z.array(RoleZ).default([]),
  stories: z.array(z.object({
    type: z.string(),
    star: z.string()
  })).default([]),
  goals: z.object({
    shortTerm: z.string().optional(),
    longTerm: z.string().optional()
  }).partial().optional(),
  updatedAt: z.date().optional()
});

export type ProfileResume = z.infer<typeof ProfileResumeZ>;

export const GapZ = z.object({
  id: z.string(),
  title: z.string(),
  dimension: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  evidence: z.array(z.string()).default([]),
  remedies: z.array(z.object({
    action: z.string(),
    effort: z.enum(["S", "M", "L"]),
    proof: z.array(z.string()).default([])
  })).default([])
});

// ✅ add this so you can `import { Gap } ...`
export type Gap = z.infer<typeof GapZ>;

export const EvaluationZ = z.object({
  userId: z.string(),
  readiness: z.object({ score: z.number(), band: z.string() }),
  gaps: z.array(GapZ),
  createdAt: z.date()
});

export type Evaluation = z.infer<typeof EvaluationZ>;
