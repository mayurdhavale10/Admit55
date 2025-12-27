# ml-service/pipeline/tools/profileresumetool/prompts/strengths.py
from __future__ import annotations

STRENGTHS_PROMPT = """You are an MBA admissions expert analyzing a resume.

CRITICAL REQUIREMENT: You MUST reference SPECIFIC details from the resume in EVERY point:
- Company names, exact metrics, project names, team sizes, technologies, titles, time periods

{context}

Resume:
{resume}

Extract 4-6 TOP STRENGTHS. For each strength:
1) title: 5-8 words
2) summary: 2-3 sentences with SPECIFIC facts/numbers/companies from resume
3) score: 0-100 rating

Return JSON:
{{
  "strengths": [
    {{"title": "...", "summary": "...", "score": 85}}
  ]
}}
"""
