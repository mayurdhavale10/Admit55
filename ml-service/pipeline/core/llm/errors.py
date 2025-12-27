# ml-service/pipeline/core/llm/errors.py

class LLMError(Exception):
    pass


class LLMRateLimitError(LLMError):
    pass
