// src/modules/heuristics/profileresumetool/analysis/enrichSignals.ts
// ✅ PURPOSE: Combine outputs from all heuristic detectors (academics, impact, intl, etc.)
// into a unified SignalBundle used for scoring, LLM fusion, or LoRA/QLoRA fine-tuning.

import {
  type NormalizedProfile,
  type SignalBundle,
  type ParseProvenance,
} from "@src/modules/schemas/profileresumetool/types";

// 🧩 Import detectors from the new heuristics location
import { impactSignalsFromText } from "@src/modules/heuristics/profileresumetool/content/patterns/detectors/impact";
import * as IntlMod from "@src/modules/heuristics/profileresumetool/content/patterns/detectors/intl";
import * as AcadMod from "@src/modules/heuristics/profileresumetool/content/patterns/detectors/academics";

type EnrichMeta = {
  yoeBand?: string;
  functionArea?: string;
  provenance: ParseProvenance;
};

// 🔹 Flatten structured resume profile → plain text
function flattenProfileText(p: NormalizedProfile): string {
  const edu = (p.education || [])
    .map(e => [e.school, e.degree, e.discipline, e.tierHint].filter(Boolean).join(" "))
    .join(" | ");

  const roles = (p.roles || [])
    .map(r => {
      const head = [r.title, r.company, r.location, r.start, r.end].filter(Boolean).join(" ");
      const bullets = (r.bullets || []).map(b => b.text).join(" ");
      return `${head} ${bullets}`;
    })
    .join(" | ");

  const exts = (p.extracurriculars || [])
    .map(e => [e.text, e.leadership ? "leadership" : "", e.recency || ""].join(" "))
    .join(" | ");

  const intl = p.international
    ? [
        (p.international.regions || []).join(" "),
        String(p.international.months ?? ""),
        (p.international.evidence || []).join(" "),
      ].join(" ")
    : "";

  const tests = p.tests
    ? [p.tests.type || "", String(p.tests.actual ?? ""), String(p.tests.target ?? ""), p.tests.descriptor || ""].join(" ")
    : "";

  const awards = (p.awards || []).join(" | ");

  return [edu, roles, exts, intl, tests, awards].filter(Boolean).join(" || ");
}

// 🔹 Adapter for Academics (supports both profile- and string-based detectors)
function callDetectAcademics(profile: NormalizedProfile, flat: string) {
  const fn: any = (AcadMod as any).detectAcademics;
  try {
    return fn(profile);
  } catch {
    return fn(flat);
  }
}

// 🔹 Adapter for International exposure detector
function callDetectInternational(profile: NormalizedProfile, flat: string) {
  const fn: any = (IntlMod as any).detectInternational;
  try {
    return fn(profile);
  } catch {
    return fn(flat);
  }
}

// 🧠 MAIN FUNCTION — builds unified signal bundle for scoring/analysis
export function enrichToSignals(
  normalized: NormalizedProfile,
  meta: EnrichMeta
): SignalBundle {
  const flat = flattenProfileText(normalized);

  const acad = callDetectAcademics(normalized, flat);
  const intl = callDetectInternational(normalized, flat);
  const impact = impactSignalsFromText(flat);

  const test = {
    actual: normalized.tests?.actual,
    target: normalized.tests?.target,
    descriptor: normalized.tests?.descriptor,
    providedAsTargetOnly: !!(normalized.tests?.target && !normalized.tests?.actual),
  };

  const crossFunctional =
    (normalized.roles || []).some(r =>
      (r.bullets || []).some(b =>
        /cross[-\s]?functional|sales\s*&?\s*marketing|prod.*eng.*design|ops.*finance/i.test(b.text)
      )
    );

  const execOffice =
    (normalized.roles || []).some(r =>
      /CEO['’]s Office|Chief.*Office|Strategy Lead|Corporate Strategy/i.test(
        [r.title, ...(r.bullets || []).map(b => b.text)].join(" ")
      )
    );

  const ledBand: "none_ic" | "informal" | "led_1_3" | "led_4_10" | "led_10_plus" = (() => {
    const sizes: number[] = [];
    for (const r of normalized.roles || []) {
      for (const b of r.bullets || []) {
        const sz = b.scope?.teamSize;
        if (typeof sz === "number" && sz > 0) sizes.push(sz);
      }
    }
    const max = sizes.length ? Math.max(...sizes) : undefined;
    const text = flat;

    const guessFromText =
      /(\bled\b|\bmanaged\b|\bheaded\b|\bowned\b)/i.test(text) &&
      (/(\b[4-9]\b|\b1\d\b)/.test(text) ? "led_4_10" : "led_1_3");

    if (typeof max === "number") {
      if (max >= 10) return "led_10_plus";
      if (max >= 4) return "led_4_10";
      if (max >= 1) return "led_1_3";
    }
    return (guessFromText as any) || (crossFunctional ? "informal" : "none_ic");
  })();

  const ecHasCurrent = (normalized.extracurriculars || []).some(e => e.recency === "current");
  const ecLeadership = (normalized.extracurriculars || []).some(e => e.leadership === true);

  // ✅ Combine all heuristic outputs into a single structured bundle
  return {
    academics: {
      tier1: !!acad?.tier1,
      rigorousDegree: !!acad?.rigorousDegree,
    },
    test,
    impact: {
      anyPct20Plus: !!impact.anyPct20Plus,
      anyLargeMoney: !!impact.anyLargeMoney,
      launchesCount: impact.launchesCount ?? 0,
    },
    leadership: {
      crossFunctional,
      ledBand,
      execOffice,
    },
    ec: {
      hasCurrent: ecHasCurrent,
      leadership: ecLeadership,
    },
    intl: {
      regionsCount: intl?.regionsCount ?? 0,
      months: intl?.months ?? 0,
    },
    meta: {
      yoeBand: meta.yoeBand,
      functionArea: meta.functionArea,
    },
    provenance: meta.provenance,
  };
}

export default enrichToSignals;
