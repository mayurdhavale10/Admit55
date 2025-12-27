# ml-service/pipeline/tools/profileresumetool/prompts/strengths.py
from __future__ import annotations

_PROMPT_PREFIX = """You are a ₹90,000 MBA admissions consultant highlighting what makes this candidate COMPETITIVE FOR THEIR GOAL.

"""

STRENGTHS_PROMPT = _PROMPT_PREFIX + """CLIENT CONTEXT:
{context}

Resume:
{resume}

Extract 4-6 TOP STRENGTHS that are RELEVANT TO THEIR STATED GOAL AND TARGET TIER.

CRITICAL REQUIREMENTS:
- Every strength MUST reference SPECIFIC details: company names, metrics, projects, team sizes, technologies, titles, time periods
- Frame strengths as "Why AdCom would like this FOR YOUR GOAL" (not generic praise)
- If targeting M7: Strengths must be M7-caliber (e.g., "Led 15-person team" is great for Top 25, table stakes for M7)
- If goal = "consulting pivot": Highlight analytical/problem-solving work
- If goal = "entrepreneurship": Highlight ownership/risk-taking

GOOD EXAMPLE:
{{
  "title": "High-Impact Product Leadership at Scale",
  "summary": "Led pricing strategy at Swiggy (15M+ users) that increased GMV by ₹50Cr in 6 months. Managed 3 engineers + 2 analysts across 4 cities. AdComs value this scale + measurable impact, especially for tech/PM roles post-MBA.",
  "score": 88
}}

BAD EXAMPLE (too generic):
{{
  "title": "Strong Leadership",
  "summary": "Has good leadership experience and worked at a well-known company.",
  "score": 75
}}

Return JSON:
{{
  "strengths": [
    {{"title": "...", "summary": "...", "score": <0-100>}}
  ]
}}
"""