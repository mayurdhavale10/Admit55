import { GAP_DEFS } from "./constants";
import type { Gap } from "@/src/modules/schemas/profileresumetool/evaluation";
import type { MetricsAnalysis } from "@/src/modules/core-nlp/metrics";
import type { VerbsAnalysis } from "@/src/modules/core-nlp/verbs";
import type { LengthAnalysis } from "@/src/modules/core-nlp/length";
import type { KeywordsAnalysis } from "@/src/modules/core-nlp/keywords";
import type { DedupeAnalysis } from "@/src/modules/core-nlp/dedupe";
import type { ConsistencyAnalysis } from "@/src/modules/core-nlp/consistency";

export type GapInputs = {
  metrics: MetricsAnalysis;
  verbs: VerbsAnalysis;
  length: LengthAnalysis;
  keywords: KeywordsAnalysis;
  dedupe: DedupeAnalysis;
  consistency: ConsistencyAnalysis;
};

/** small helper to read static defs */
function defOf(id: string) {
  const d = GAP_DEFS.find(g => g.id === id);
  if (!d) throw new Error(`GAP_DEF not found: ${id}`);
  return d;
}

export function computeGaps(input: GapInputs): Gap[] {
  const { metrics, verbs, length, keywords, dedupe, consistency } = input;
  const gaps: Gap[] = [];

  // ---------- G01: No metrics ----------
  if (metrics.overallDensity < 0.5) {
    const d = defOf("G01_no_metrics");
    const evidence: string[] = [];
    // collect a few non-number bullets as evidence
    for (const b of metrics.perBullet) {
      if (!b.hasNumber && evidence.length < 3) {
        evidence.push(`no-metric@${b.roleId}:${b.idx}`);
      }
    }
    gaps.push({
      id: d.id,
      title: d.title,
      dimension: d.dimension,
      severity: metrics.overallDensity < 0.25 ? "high" : "medium",
      evidence,
      remedies: d.remedyTemplates.map(t => ({ action: t, effort: "M", proof: [] })),
      etaWeeks: d.etaWeeksDefault,
      deltaPoints: d.deltaPointsRange[1]
    });
  }

  // ---------- G10: Hygiene: length ----------
  if (length.longShare > 0.25) {
    const d = defOf("G10_hygiene_length");
    const longOnes = length.perBullet.filter(b => b.tooLong).slice(0, 5).map(b => `long>22@${b.roleId}:${b.idx}`);
    gaps.push({
      id: d.id,
      title: d.title,
      dimension: d.dimension,
      severity: length.longShare > 0.4 ? "high" : "medium",
      evidence: longOnes,
      remedies: d.remedyTemplates.map(t => ({ action: t, effort: "S", proof: [] })),
      etaWeeks: d.etaWeeksDefault,
      deltaPoints: d.deltaPointsRange[1]
    });
  }

  // ---------- G12: Passive voice ----------
  {
    const vals = Object.values(verbs.passiveRatioByRole);
    const avgPassive = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    if (avgPassive > 0.3) {
      const d = defOf("G12_passive_voice");
      const evid: string[] = [];
      verbs.perBullet.forEach(b => { if (b.passiveLikely && evid.length < 5) evid.push(`passive@${b.roleId}:${b.idx}`); });
      gaps.push({
        id: d.id,
        title: d.title,
        dimension: d.dimension,
        severity: avgPassive > 0.5 ? "high" : "medium",
        evidence: evid,
        remedies: d.remedyTemplates.map(t => ({ action: t, effort: "S", proof: [] })),
        etaWeeks: d.etaWeeksDefault,
        deltaPoints: d.deltaPointsRange[0]
      });
    }
  }

  // ---------- G13: Keyword mismatch ----------
  if (keywords.coverage < 0.6) {
    const d = defOf("G13_keyword_mismatch");
    const missingTop = keywords.missing.slice(0, 6);
    gaps.push({
      id: d.id,
      title: d.title,
      dimension: d.dimension,
      severity: keywords.coverage < 0.35 ? "high" : "medium",
      evidence: missingTop.map(k => `missing_kw:${k}`),
      remedies: d.remedyTemplates.map(t => ({ action: t, effort: "M", proof: [] })),
      etaWeeks: d.etaWeeksDefault,
      deltaPoints: d.deltaPointsRange[1]
    });
  }

  // ---------- G19: Conflicting dates / overlaps ----------
  if ((consistency.issues ?? []).some(i => i.type === "date_overlap")) {
    const d = defOf("G19_conflicts_dates");
    const ev = consistency.issues
      .filter(i => i.type === "date_overlap")
      .slice(0, 4)
      .map(i => `overlap@${i.roleIdA}~${i.roleIdB}`);
    gaps.push({
      id: d.id,
      title: d.title,
      dimension: d.dimension,
      severity: "medium",
      evidence: ev,
      remedies: d.remedyTemplates.map(t => ({ action: t, effort: "S", proof: [] })),
      etaWeeks: d.etaWeeksDefault,
      deltaPoints: d.deltaPointsRange[0]
    });
  }

  // ---------- G20: Duplicates ----------
  if ((dedupe.duplicates ?? []).length > 0) {
    const d = defOf("G20_duplicates");
    const ev = dedupe.duplicates.slice(0, 4).map(p => `dupe@${p.a.roleId}:${p.a.idx}~${p.b.roleId}:${p.b.idx}`);
    gaps.push({
      id: d.id,
      title: d.title,
      dimension: d.dimension,
      severity: "low",
      evidence: ev,
      remedies: d.remedyTemplates.map(t => ({ action: t, effort: "S", proof: [] })),
      etaWeeks: d.etaWeeksDefault,
      deltaPoints: d.deltaPointsRange[0]
    });
  }

  return gaps;
}
