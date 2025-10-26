// src/modules/core-gap/profileresumetool/constants.ts

export const EVAL_VERSION = "eval-1.0.0" as const;

/** String-literal ID tuples → enable z.enum([...]) */
export const DIMENSION_IDS = [
  "D01_quant","D02_impact","D03_leadership","D04_progression",
  "D05_initiative","D06_industrydepth","D07_international",
  "D08_community","D09_communication","D10_goals",
  "D11_schoolfit","D12_recommenders"
] as const;
export type DimensionId = typeof DIMENSION_IDS[number];

export const PERSONA_KEYS = [
  "fulltime","executive","deferred","switcher","international","reapplicant"
] as const;
export type PersonaKey = typeof PERSONA_KEYS[number];

export const GAP_IDS = [
  "G01_no_metrics","G02_weak_impact_order","G03_no_deltas","G04_low_leadership",
  "G05_thin_progression","G06_no_initiatives","G07_poor_industry_depth",
  "G08_no_international","G09_weak_community","G10_hygiene_length",
  "G11_tense_inconsistent","G12_passive_voice","G13_keyword_mismatch",
  "G14_goals_vague","G15_fit_generic","G16_recos_weak",
  "G17_metric_stuffing","G18_keyword_stuffing","G19_conflicts_dates","G20_duplicates"
] as const;
export type GapId = typeof GAP_IDS[number];

export const DIMENSIONS: ReadonlyArray<{
  id: DimensionId;
  name: string;
  description: string;
  defaultWeight: number;
}> = [
  { id: "D01_quant", name: "Quant Evidence", description: "Numbers/units/deltas density & quality.", defaultWeight: 10 },
  { id: "D02_impact", name: "Business Impact", description: "Outcome-first, magnitude, breadth.", defaultWeight: 12 },
  { id: "D03_leadership", name: "Leadership & Ownership", description: "Leading people, scope, xfn drive.", defaultWeight: 12 },
  { id: "D04_progression", name: "Career Progression", description: "Growth in title/scope & cadence.", defaultWeight: 8 },
  { id: "D05_initiative", name: "Initiative / 0→1", description: "New builds, pilots, turnarounds.", defaultWeight: 8 },
  { id: "D06_industrydepth", name: "Industry Depth", description: "Domain fluency, tools, certs.", defaultWeight: 8 },
  { id: "D07_international", name: "International Exposure", description: "Multi-geo collaboration/impact.", defaultWeight: 5 },
  { id: "D08_community", name: "Community Leadership", description: "Sustained EC leadership w/ impact.", defaultWeight: 5 },
  { id: "D09_communication", name: "Communication & Hygiene", description: "Clarity, brevity, tense, ATS.", defaultWeight: 8 },
  { id: "D10_goals", name: "Goals Clarity", description: "Role/industry/geo/timeline feasibility.", defaultWeight: 10 },
  { id: "D11_schoolfit", name: "School Fit", description: "Program/resource alignment.", defaultWeight: 7 },
  { id: "D12_recommenders", name: "Recommenders Readiness", description: "Seniority mix & 360° coverage.", defaultWeight: 7 }
];

export const PERSONA_WEIGHTS: Record<PersonaKey, Record<DimensionId, number>> = {
  fulltime: {
    D01_quant:12, D02_impact:14, D03_leadership:12, D04_progression:10,
    D05_initiative:9, D06_industrydepth:8, D07_international:5, D08_community:5,
    D09_communication:8, D10_goals:8, D11_schoolfit:5, D12_recommenders:4
  },
  executive: {
    D01_quant:8, D02_impact:14, D03_leadership:18, D04_progression:12,
    D05_initiative:8, D06_industrydepth:10, D07_international:6, D08_community:4,
    D09_communication:6, D10_goals:6, D11_schoolfit:4, D12_recommenders:4
  },
  deferred: {
    D01_quant:10, D02_impact:10, D03_leadership:8, D04_progression:6,
    D05_initiative:12, D06_industrydepth:8, D07_international:4, D08_community:10,
    D09_communication:10, D10_goals:12, D11_schoolfit:6, D12_recommenders:4
  },
  switcher: {
    D01_quant:10, D02_impact:12, D03_leadership:10, D04_progression:8,
    D05_initiative:10, D06_industrydepth:12, D07_international:5, D08_community:4,
    D09_communication:8, D10_goals:11, D11_schoolfit:6, D12_recommenders:4
  },
  international: {
    D01_quant:10, D02_impact:12, D03_leadership:10, D04_progression:8,
    D05_initiative:8, D06_industrydepth:10, D07_international:8, D08_community:4,
    D09_communication:8, D10_goals:10, D11_schoolfit:6, D12_recommenders:6
  },
  reapplicant: {
    D01_quant:10, D02_impact:12, D03_leadership:10, D04_progression:10,
    D05_initiative:10, D06_industrydepth:8, D07_international:5, D08_community:4,
    D09_communication:8, D10_goals:9, D11_schoolfit:6, D12_recommenders:8
  }
};

export const GAP_DEFS: ReadonlyArray<{
  id: GapId;
  title: string;
  dimension: DimensionId;
  description: string;
  remedyTemplates: readonly string[];
  etaWeeksDefault: number;
  deltaPointsRange: readonly [number, number];
  antiGaming?: boolean;
}> = [
  { id:"G01_no_metrics", title:"Resume lacks metrics", dimension:"D01_quant",
    description:"Few or no numbers/units across bullets.",
    remedyTemplates:["Add %/$/# to top bullets","Include timeframe and baseline"],
    etaWeeksDefault:1, deltaPointsRange:[4,8] },
  { id:"G02_weak_impact_order", title:"Task-first, not outcome-first", dimension:"D02_impact",
    description:"Bullets start with activity; outcome buried.",
    remedyTemplates:["Rewrite bullets to outcome → how"], etaWeeksDefault:1, deltaPointsRange:[2,5] },
  { id:"G03_no_deltas", title:"No before→after deltas", dimension:"D02_impact",
    description:"Missing baselines and change magnitudes.",
    remedyTemplates:["Add from→to with % or absolute"], etaWeeksDefault:2, deltaPointsRange:[3,6] },
  { id:"G04_low_leadership", title:"Ownership & team scope unclear", dimension:"D03_leadership",
    description:"No led/owned verbs or team size.",
    remedyTemplates:["Add team size & ownership verbs"], etaWeeksDefault:2, deltaPointsRange:[4,8] },
  { id:"G05_thin_progression", title:"Limited progression signal", dimension:"D04_progression",
    description:"Stasis in title/scope for long periods.",
    remedyTemplates:["Reframe scope growth; promotions"], etaWeeksDefault:2, deltaPointsRange:[2,5] },
  { id:"G06_no_initiatives", title:"Few 0→1 builds or turnarounds", dimension:"D05_initiative",
    description:"Lack of pilots, launches, rescues.",
    remedyTemplates:["Highlight pilots/MVPs/turnarounds"], etaWeeksDefault:3, deltaPointsRange:[3,6] },
  { id:"G07_poor_industry_depth", title:"Generic domain signal", dimension:"D06_industrydepth",
    description:"Thin domain/tools/certs evidence.",
    remedyTemplates:["Add stacks, regs, certs, KPIs"], etaWeeksDefault:3, deltaPointsRange:[3,6] },
  { id:"G08_no_international", title:"No multi-geo exposure", dimension:"D07_international",
    description:"No cross-border stakeholders or markets.",
    remedyTemplates:["Add geo scope, intl stakeholders"], etaWeeksDefault:1, deltaPointsRange:[1,3] },
  { id:"G09_weak_community", title:"EC leadership impact unclear", dimension:"D08_community",
    description:"Activities lack measurable outcomes.",
    remedyTemplates:["Quantify EC outcomes; leadership"], etaWeeksDefault:3, deltaPointsRange:[2,5] },
  { id:"G10_hygiene_length", title:"Bullets too long", dimension:"D09_communication",
    description:">22 words in many bullets.",
    remedyTemplates:["Trim filler; enforce ≤22 words"], etaWeeksDefault:1, deltaPointsRange:[2,4] },
  { id:"G11_tense_inconsistent", title:"Past roles in present tense", dimension:"D09_communication",
    description:"Tense mismatch vs role dates.",
    remedyTemplates:["Normalize to past for past roles"], etaWeeksDefault:1, deltaPointsRange:[1,2] },
  { id:"G12_passive_voice", title:"Passive voice ratio high", dimension:"D09_communication",
    description:"“was/were … by …” patterns common.",
    remedyTemplates:["Swap to active verbs"], etaWeeksDefault:1, deltaPointsRange:[1,3] },
  { id:"G13_keyword_mismatch", title:"Target-track keywords missing", dimension:"D06_industrydepth",
    description:"Coverage below threshold.",
    remedyTemplates:["Blend priority keywords naturally"], etaWeeksDefault:2, deltaPointsRange:[3,6] },
  { id:"G14_goals_vague", title:"Career goals unclear", dimension:"D10_goals",
    description:"Missing role/industry/geo/timeline.",
    remedyTemplates:["Crisp 1–2 line goals"], etaWeeksDefault:1, deltaPointsRange:[3,6] },
  { id:"G15_fit_generic", title:"School fit generic", dimension:"D11_schoolfit",
    description:"No program-specific resources.",
    remedyTemplates:["Add clubs/courses/recruiters"], etaWeeksDefault:1, deltaPointsRange:[2,5] },
  { id:"G16_recos_weak", title:"Reco coverage weak", dimension:"D12_recommenders",
    description:"Same-level/single-angle recommenders.",
    remedyTemplates:["Senior + 360° mix plan"], etaWeeksDefault:2, deltaPointsRange:[3,6] },
  { id:"G17_metric_stuffing", title:"Metric stuffing detected", dimension:"D01_quant",
    description:"Numbers without nouns/units.",
    remedyTemplates:["Validate units & context"], etaWeeksDefault:0, deltaPointsRange:[0,0], antiGaming:true },
  { id:"G18_keyword_stuffing", title:"Keyword stuffing detected", dimension:"D09_communication",
    description:"Over-density/unnatural repeats.",
    remedyTemplates:["De-duplicate; density target"], etaWeeksDefault:0, deltaPointsRange:[0,0], antiGaming:true },
  { id:"G19_conflicts_dates", title:"Date/claim conflicts", dimension:"D09_communication",
    description:"Overlaps or contradictions.",
    remedyTemplates:["Fix timelines; reconcile claims"], etaWeeksDefault:1, deltaPointsRange:[1,3] },
  { id:"G20_duplicates", title:"Duplicate bullets", dimension:"D09_communication",
    description:"Repeated phrases or near-dupes.",
    remedyTemplates:["Replace with distinct impact"], etaWeeksDefault:1, deltaPointsRange:[1,2] }
];
