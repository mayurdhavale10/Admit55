# ml-service/pipeline/tools/profileresumetool/prompts/recommendations.py
from __future__ import annotations

RECOMMENDATIONS_PROMPT = """You are an MBA admissions strategist creating a highly actionable plan.

Make it highly specific and prioritized, aligned to Context (timeline matters).

{context}

Resume:
{resume}

Scores:
{scores}

Strengths:
{strengths}

Improvements:
{improvements}

Create 6-10 PRIORITIZED RECOMMENDATIONS. Return ONLY valid JSON with this structure:
{{
  "recommendations": [
    {{
      "id": "rec_1",
      "type": "skill|test|extracurricular|career|resume|networking|other",
      "area": "Short label",
      "priority": "high|medium|low",
      "timeframe": "next_1_3_weeks | next_3_6_weeks | next_3_months",
      "action": "2-4 bullet-like sentences: WHAT to do, HOW to do it, OUTPUT artifact to produce.",
      "estimated_impact": "1-2 sentences: how this improves admissions outcomes",
      "current_score": 0-100,
      "score": 0-100
    }}
  ]
}}

Hard rules:
- timeframe MUST be exactly 'next_1_3_weeks' OR 'next_3_6_weeks' OR 'next_3_months'.
- Distribute recommendations across all 3 buckets (at least 2 per bucket).
- Every action must produce an OUTPUT artifact.
- Include at least 3 recommendations that directly improve RESUME BULLETS.
"""
