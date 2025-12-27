# ml-service/pipeline/tools/profileresumetool/prompts/adcom_panel.py
from __future__ import annotations

_PROMPT_PREFIX = """You are an MBA AdCom member reviewing this candidate for {target_tier} schools.

"""

ADCOM_PANEL_PROMPT = _PROMPT_PREFIX + """CLIENT CONTEXT:
{context}

Resume:
{resume}

Scores:
{scores}

Strengths:
{strengths}

Improvements:
{improvements}

Provide HONEST AdCom perspective (like a consultant would in a "red team" session).

WHAT_EXCITES:
- 3-5 items that make AdCom lean YES
- Reference specific resume details
- Frame as "AdCom lens" (not generic praise)

WHAT_CONCERNS:
- 3-5 items that make AdCom pause or question fit
- Be brutally honest (consultant clients PAY for honesty)
- Compare to typical {target_tier} admits

HOW_TO_PREEMPT:
- 3-5 ACTIONABLE tactics to address concerns BEFORE applications
- Format: "Action + How + Timeline + Expected Outcome"
- Must be doable within candidate's timeline

GOOD EXAMPLE:
{{
  "what_excites": [
    "Quantifiable impact at scale (₹50Cr GMV, 15M users) - M7 AdComs love this for PM→consulting stories",
    "IIT Delhi pedigree (8.5 GPA) - signals analytical rigor, especially for STEM-heavy programs like Sloan",
    "Clear post-MBA goal (consulting) backed by analytical work - stronger than 'explore options' candidates"
  ],
  "what_concerns": [
    "Zero team management experience - M7 average is 3-5 direct reports by application time",
    "No GMAT score with 6 months to R1 - if you bomb first attempt, no time for retake",
    "India tech PM archetype is OVERSATURATED at M7 - need differentiation story",
    "No international exposure (0/10) - HBS/Stanford heavily weight global perspective"
  ],
  "how_to_preempt": [
    "Reframe PM work as 'cross-functional leadership': Quantify how many eng/design/ops stakeholders you influenced. Add bullet: 'Drove alignment across 8-person cross-functional pod (3 eng, 2 design, 3 ops)' by Week 2. Outcome: Raises leadership score from 4→6.",
    "Register for GMAT by Jan 3, take diagnostic by Jan 5, hit 700+ by March (2 attempts if needed). Outcome: Moves test_readiness from 2→8, unlocks M7 consideration.",
    "Join India-US tech conference (e.g., SaaStr, WebSummit) by April OR start remote collaboration with US team at Swiggy. Outcome: Gives 1-2 'international exposure' stories for essays, raises score from 0→4."
  ]
}}

Return JSON:
{{
  "what_excites": ["...", "...", "..."],
  "what_concerns": ["...", "...", "..."],
  "how_to_preempt": ["...", "...", "..."]
}}
"""