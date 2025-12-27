# ml-service/pipeline/tools/profileresumetool/prompts/adcom_panel.py
from __future__ import annotations

ADCOM_PANEL_PROMPT = """You are an MBA admissions committee member reviewing this candidate's profile.

{context}

Resume:
{resume}

Scores:
{scores}

Strengths:
{strengths}

Improvements:
{improvements}

Provide honest AdCom perspective in JSON format:
{{
  "what_excites": ["...", "...", "..."],
  "what_concerns": ["...", "...", "..."],
  "how_to_preempt": ["...", "...", "..."]
}}

Rules:
- Each array should have 3-5 items
- Be specific and reference actual resume details
- how_to_preempt MUST be actionable (what to do next + how + within a timeframe)
"""
