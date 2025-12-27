# ml-service/pipeline/tools/profileresumetool/prompts/improvements.py
from __future__ import annotations

IMPROVEMENTS_PROMPT = """You are an MBA admissions expert analyzing gaps in this candidate's profile.

Every suggestion must be SPECIFIC to their profile and aligned to Context goal/timeline if provided.

{context}

Resume:
{resume}

Current Scores:
{scores}

Identify 4-6 IMPROVEMENT AREAS. For each:
1) area: Short label
2) suggestion: 2-3 sentences with SPECIFIC, ACTIONABLE advice tailored to their background
3) score: 0-100 current rating

Return JSON:
{{
  "improvements": [
    {{"area": "...", "suggestion": "...", "score": 60}}
  ]
}}
"""
