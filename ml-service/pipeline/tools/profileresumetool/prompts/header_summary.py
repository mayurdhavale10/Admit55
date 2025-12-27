# ml-service/pipeline/tools/profileresumetool/prompts/header_summary.py
from __future__ import annotations

HEADER_SUMMARY_PROMPT = """You are an MBA admissions expert. Create a compelling header summary for this candidate.

CRITICAL: Extract ONLY factual details from the resume. Do NOT invent or assume anything.

{context}

Resume:
{resume}

Scores:
{scores}

Return ONLY valid JSON:
{{
  "summary": "2-3 sentence overview highlighting key strengths and critical gaps. Must reference specific details from resume.",
  "highlights": ["Experience", "Skill Area", "Education", "Achievement", "Gap/Status", ...],
  "applicantArchetypeTitle": "Brief professional identity based on resume facts",
  "applicantArchetypeSubtitle": "Additional context (e.g., 'Career Switcher', etc.)"
}}

Rules:
- highlights must be 8-12 items max and must be factual.
"""
