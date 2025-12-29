# ml-service/pipeline/tools/bschoolmatchtool/prompts/__init__.py

from .key_insights import build_key_insights_prompt
from .fit_story import build_fit_story_prompt
from .strategy import build_strategy_prompt
from .action_plan import build_action_plan_prompt

__all__ = [
    "build_key_insights_prompt",
    "build_fit_story_prompt",
    "build_strategy_prompt",
    "build_action_plan_prompt",
]