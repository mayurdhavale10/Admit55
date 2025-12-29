# ml-service/pipeline/tools/bschoolmatchtool/prompts/action_plan.py

def build_action_plan_prompt(context: dict, strategy: dict) -> str:
    """Build prompt for 12-week action plan."""
    
    return f"""You are a top MBA admissions consultant. Create a 12-WEEK ACTION PLAN.

CANDIDATE:
- Goal: {context.get('target_role', 'N/A')} in {context.get('target_industry', 'N/A')}
- Test Score: {context.get('test_score_normalized', 'N/A')}
- Strategy: {strategy.get('essayTheme', '')}

Generate a timeline with specific tasks:

WEEK 1-2 (Foundation):
- 3 tasks

WEEK 3-6 (Preparation):
- 4 tasks

WEEK 7-12 (Execution):
- 4 tasks

Return ONLY valid JSON:
{{
  "weeks_1_2": [
    {{"title": "Task", "description": "Details"}},
    ...
  ],
  "weeks_3_6": [...],
  "weeks_7_12": [...]
}}

Be specific and actionable.
"""