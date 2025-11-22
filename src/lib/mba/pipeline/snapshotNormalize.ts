// src/lib/mba/pipeline/snapshotNormalize.ts
import type { SnapshotResult } from "@src/app/mba/tools/profileresumetool/components/types";

function scoreFromPresence(s?: string | null): number {
  // dumb Phase-1 scoring: presence → 7, else 4
  return s && s.trim() ? 7 : 4;
}

export function loraJsonToSnapshotResult(
  j: any,
  prov: {
    method: "lora" | "qlora";
    model?: string;
    adapter?: string;
    latencyMs?: number;
    confidence?: number;
  }
): SnapshotResult {
  const fn = j?.function ?? "";
  const im = j?.impact ?? "";
  const ld = j?.leadership ?? "";
  const intl = j?.international ?? "";
  const tools = j?.tools ?? "";

  const radar = {
    academics: 6, // unknown from this schema – keep neutral
    testReadiness: 6, // neutral for Phase-1
    workImpact: scoreFromPresence(im),
    leadership: scoreFromPresence(ld),
    extracurriculars: 6, // neutral
    internationalExposure: scoreFromPresence(intl),
  };

  const strengths: string[] = [];
  if (im) strengths.push(`Impact: ${im}`);
  if (ld) strengths.push(`Leadership: ${ld}`);
  if (intl) strengths.push(`International: ${intl}`);
  if (tools) strengths.push(`Tools/Stack: ${tools}`);

  const gaps: string[] = [];
  if (!ld) gaps.push("Leadership depth not explicit");
  if (!intl) gaps.push("Limited international exposure shown");
  if (!im) gaps.push("Impact metrics can be quantified more");

  return {
    band: "B",
    meta: {
      function: fn || undefined,
      test: undefined,
      yoe: undefined,
    },
    radar,
    strengths: strengths.length ? strengths : ["Good baseline signals detected"],
    gaps: gaps.length ? gaps : ["Tighten bullet quantification"],
    next6Weeks: ["Quantify 3 bullets with clear %/% and scope", "Lead one cross-team task"],
    next90Days: ["Own a KPI with MoM target", "Mentor a junior", "Cross-border collaboration"],
    essayAngles: [
      "Impact-first narrative with clear metrics",
      "Leadership growth arc via ownership",
      "International exposure via cross-functional projects",
    ],
    provenance: {
      method: prov.method,
      confidence: prov.confidence ?? 0.7,
      model: prov.model,
      latencyMs: prov.latencyMs,
      ...(prov.adapter ? { adapter: prov.adapter } : {}),
    } as any,
  };
}
