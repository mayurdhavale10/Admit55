# ml-service/pipeline/core/llm/retry.py

import time
from typing import Callable, TypeVar, Any
from functools import wraps

from .errors import LLMRateLimitError

T = TypeVar('T')


def with_retry(
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0,
    max_delay: float = 60.0,
):
    """
    Decorator to retry a function on LLMRateLimitError with exponential backoff.
    
    Args:
        max_attempts: Maximum number of attempts (default: 3)
        initial_delay: Initial delay in seconds (default: 1.0)
        backoff_factor: Multiplier for delay after each retry (default: 2.0)
        max_delay: Maximum delay between retries (default: 60.0)
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            delay = initial_delay
            last_error = None
            
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except LLMRateLimitError as e:
                    last_error = e
                    if attempt < max_attempts - 1:
                        # Wait before retrying
                        sleep_time = min(delay, max_delay)
                        print(f"[RETRY] Rate limited, waiting {sleep_time}s before retry {attempt + 2}/{max_attempts}")
                        time.sleep(sleep_time)
                        delay *= backoff_factor
                    else:
                        # Last attempt failed
                        print(f"[RETRY] All {max_attempts} attempts failed")
                        raise
            
            # This shouldn't be reached, but just in case
            if last_error:
                raise last_error
            raise Exception("Unexpected retry logic error")
        
        return wrapper
    return decorator