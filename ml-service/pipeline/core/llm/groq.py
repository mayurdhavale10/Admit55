# ml-service/pipeline/core/llm/groq.py

from typing import Optional
from ..settings import LLMSettings
from .openai_compat import call_openai_compat


def call_groq(settings: LLMSettings, prompt: str, max_tokens: int, temperature: float, response_format: Optional[str]) -> str:
    # Groq uses OpenAI-compatible endpoint
    return call_openai_compat(settings, prompt, max_tokens, temperature, response_format=response_format)
