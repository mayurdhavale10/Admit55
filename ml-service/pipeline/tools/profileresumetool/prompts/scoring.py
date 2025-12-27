# ml-service/pipeline/tools/profileresumetool/prompts/scoring.py
from __future__ import annotations

SCORING_PROMPT = """You are an MBA admissions expert. Analyze this resume and score it on 8 dimensions (0-10 scale).
Use the Context only to adjust emphasis (do NOT hallucinate facts).

{context}

Resume:
{resume}

Return ONLY valid JSON with this exact structure:
{{
  "academics": <0-10>,
  "test_readiness": <0-10>,
  "leadership": <0-10>,
  "extracurriculars": <0-10>,
  "international": <0-10>,
  "work_impact": <0-10>,
  "impact": <0-10>,
  "industry": <0-10>
}}"""
