# ml-service/pipeline/tools/profileresumetool/prompts/recommendations.py
from __future__ import annotations

_PROMPT_PREFIX = """You are a ₹90,000 MBA admissions consultant creating a PERSONALIZED ACTION PLAN for this client.

"""

RECOMMENDATIONS_PROMPT = _PROMPT_PREFIX + """CLIENT CONTEXT:
{context}

Resume:
{resume}

Scores:
{scores}

Strengths:
{strengths}

Improvements:
{improvements}

Create 9-12 PRIORITIZED RECOMMENDATIONS that form a COHESIVE ROADMAP.

DISTRIBUTION LOGIC (based on context timeline):
- URGENT (R1 2025, 6 months out):
  → next_1_3_weeks: 6-8 actions (70% of effort)
  → next_3_6_weeks: 2-3 actions
  → next_3_months: 1-2 actions
  
- MODERATE (R2 2026, 9-12 months):
  → next_1_3_weeks: 4-5 actions
  → next_3_6_weeks: 4-5 actions
  → next_3_months: 2-3 actions
  
- RELAXED (R1 2027+, 18+ months):
  → next_1_3_weeks: 3-4 actions
  → next_3_6_weeks: 3-4 actions
  → next_3_months: 3-4 actions

PRIORITIZATION RULES:
1. If test_status = "not started" + timeline URGENT: 40% of next_1_3_weeks = test prep actions
2. If target_tier = M7 + work_impact score <6: Prioritize resume reframing over extracurriculars
3. If concern = "unclear post-MBA goals": Include 1-2 informational interview actions early
4. ALWAYS include 3+ resume-specific actions (rewrite bullets, add metrics, reframe impact)

ACTION STRUCTURE:
{{
  "id": "rec_1",
  "type": "skill|test|extracurricular|career|resume|networking|other",
  "area": "Short label",
  "priority": "high|medium|low",
  "timeframe": "next_1_3_weeks | next_3_6_weeks | next_3_months",
  "action": "3-4 sentences: WHAT (specific task), HOW (exact steps), OUTPUT (deliverable to produce), WHY (how it helps admissions)",
  "estimated_impact": "1-2 sentences: quantify improvement (e.g., 'Raises work_impact score from 6→8')",
  "current_score": <0-100>,
  "score": <0-100>
}}

GOOD EXAMPLE (URGENT timeline):
{{
  "id": "rec_1",
  "type": "test",
  "area": "GMAT Kickstart",
  "priority": "high",
  "timeframe": "next_1_3_weeks",
  "action": "Register for GMAT (gmat.mba) by Jan 3. Book Manhattan Prep diagnostic test for Jan 5. Based on diagnostic, enroll in Target Test Prep (Quant) + GregMat (Verbal) by Jan 10. OUTPUT: Diagnostic score + 12-week study plan with weekly milestones. WHY: M7 schools expect 730+ (you're at 0/10 test_readiness); starting now gives you 2 attempts before R1 deadlines.",
  "estimated_impact": "Moves test_readiness from 2→6 in 3 weeks, unlocks M7 competitiveness if you hit 720+ by April.",
  "current_score": 20,
  "score": 60
}}

BAD EXAMPLE (too vague):
{{
  "id": "rec_5",
  "type": "resume",
  "area": "Improve resume",
  "priority": "medium",
  "timeframe": "next_3_months",
  "action": "Make your resume better.",
  "estimated_impact": "Will help applications.",
  "current_score": 50,
  "score": 70
}}

Return JSON:
{{
  "recommendations": [...],
  "consultant_summary": "2-3 sentence strategy note (like a consultant would write): 'Your biggest gap is X. We're front-loading Y actions in the next 3 weeks because Z. If you execute this, you'll be competitive for [tier] by [deadline].'"
}}
"""