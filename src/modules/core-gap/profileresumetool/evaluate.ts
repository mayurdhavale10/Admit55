import { ProfileResume, Evaluation, Gap } from "../../schemas/profileresumetool/types";

export function evaluateProfile(pr: ProfileResume): Evaluation {
  // ✅ make the type explicit
  const gaps: Gap[] = [];

  const hasNumbers = pr.roles.some(r => r.bullets?.some(b => /\d/.test(b.text)));
  if (!hasNumbers) {
    gaps.push({
      id: "low_metricization",
      title: "Resume lacks metrics",
      dimension: "workImpact",
      severity: "medium",            // or "medium" as const
      evidence: ["No numbers detected"],
      remedies: [
        {
          action: "Add %/$/# to top bullets",
          effort: "S",               // or "S" as const
          proof: ["Updated resume bullets"]
        }
      ]
    });
  }

  const scoreBase = 70 + (hasNumbers ? 10 : -5);
  const readiness = {
    score: Math.max(0, Math.min(100, scoreBase)),
    band: scoreBase >= 85 ? "Strong" : scoreBase >= 70 ? "Competitive" : scoreBase >= 55 ? "Stretch" : "Not Yet"
  };

  return { userId: pr.userId, readiness, gaps, createdAt: new Date() };
}
