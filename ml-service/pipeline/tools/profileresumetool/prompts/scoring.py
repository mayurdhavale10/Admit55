# ml-service/pipeline/tools/profileresumetool/prompts/scoring.py
from __future__ import annotations

_PROMPT_PREFIX = """You are a ₹90,000 MBA admissions consultant. A client has paid you to evaluate their profile FOR THEIR SPECIFIC GOAL.

"""

SCORING_PROMPT = _PROMPT_PREFIX + """CLIENT CONTEXT (from discovery call):
{context}

Resume:
{resume}

Score this profile on 8 dimensions (0-10 scale) RELATIVE TO THEIR STATED GOAL AND TARGET TIER.

SCORING ANCHORS (adjust based on target tier in context):
- academics: 0-3 (low GPA/unknown college) | 4-6 (decent GPA/mid-tier) | 7-8 (high GPA/top college) | 9-10 (IIT/BITS + 9+ GPA)
- test_readiness: 0-3 (not started) | 4-6 (studying) | 7-8 (700-730 GMAT) | 9-10 (730+ GMAT or 330+ GRE)
- leadership: 0-3 (no evidence) | 4-6 (team lead roles) | 7-8 (cross-team influence) | 9-10 (founded/managed teams >10)
- extracurriculars: 0-3 (none) | 4-6 (occasional volunteering) | 7-8 (consistent 2+ years) | 9-10 (founded NGO/led major initiative)
- international: 0-3 (no exposure) | 4-6 (travel/remote work) | 7-8 (worked abroad <1yr) | 9-10 (worked abroad 2+ years)
- work_impact: 0-3 (unclear impact) | 4-6 (team contributor) | 7-8 (measurable outcomes) | 9-10 (revenue/cost impact >$1M or strategic)
- impact: 0-3 (unclear) | 4-6 (local impact) | 7-8 (company-wide impact) | 9-10 (industry-level or customer-facing at scale)
- industry: 0-3 (low prestige) | 4-6 (solid brand) | 7-8 (Fortune 500/Series B+) | 9-10 (FAANG/MBB/unicorn)

CRITICAL ADJUSTMENTS BASED ON CONTEXT:
- If target_tier = "M7": Apply stricter benchmarks (e.g., 7/10 academics for M7 = 4/10 for Top 25)
- If goal = "consulting/IB pivot": Weight industry + work_impact higher
- If timeline = "URGENT (R1 2025)": Flag test_readiness gap harshly if not started
- If concern = "weak brands": Be honest about industry score vs. target tier

Return ONLY valid JSON:
{{
  "academics": <0-10>,
  "test_readiness": <0-10>,
  "leadership": <0-10>,
  "extracurriculars": <0-10>,
  "international": <0-10>,
  "work_impact": <0-10>,
  "impact": <0-10>,
  "industry": <0-10>,
  "consultant_note": "1 sentence explaining how scores align with their goal/tier (like a consultant would)"
}}
"""