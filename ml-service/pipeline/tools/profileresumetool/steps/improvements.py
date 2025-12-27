# ml-service/pipeline/tools/profileresumetool/prompts/improvements.py
from __future__ import annotations

_PROMPT_PREFIX = """You are a ₹90,000 MBA admissions consultant identifying GAPS between this profile and their TARGET SCHOOLS.

"""

IMPROVEMENTS_PROMPT = _PROMPT_PREFIX + """CLIENT CONTEXT:
{context}

Resume:
{resume}

Current Scores:
{scores}

Identify 4-6 IMPROVEMENT AREAS that are CRITICAL FOR THEIR GOAL/TIER.

PRIORITIZATION LOGIC:
- If timeline = URGENT: Focus only on quick wins (next 1-3 weeks)
- If target_tier = M7: Be brutally honest about gaps vs. M7 averages
- If test_status = "not started" + urgent timeline: Make this #1 priority
- If concern = "weak brands": Focus on reframing work impact, not changing jobs

For each improvement:
1. area: Short label (e.g., "GMAT Score Gap", "Leadership Evidence")
2. suggestion: 2-3 sentences with SPECIFIC, ACTIONABLE advice tied to their background + timeline
3. score: Current rating (0-100)

GOOD EXAMPLE:
{{
  "area": "Quantitative Impact Evidence",
  "suggestion": "Your Flipkart PM work mentions 'improved user retention' but lacks numbers. Dig into analytics: even rough estimates like '10-15% retention lift' or '500K+ users affected' make claims credible. For M7 schools, quantified impact is non-negotiable—add 3-5 metrics to your resume bullets by end of Week 2.",
  "score": 45
}}

BAD EXAMPLE (too vague):
{{
  "area": "Leadership",
  "suggestion": "Try to get more leadership experience.",
  "score": 50
}}

Return JSON:
{{
  "improvements": [
    {{"area": "...", "suggestion": "...", "score": <0-100>}}
  ]
}}
"""