# ml-service/pipeline/core/cache/memory_cache.py

import hashlib
from typing import Optional, Dict

from ..versioning import PIPELINE_VERSION, CACHE_BUST, DISABLE_CACHE


class MemoryPromptCache:
    def __init__(self) -> None:
        self._cache: Dict[str, str] = {}

    def make_key(self, provider: str, model: str, temperature: float, max_tokens: int, response_format: Optional[str], prompt: str) -> str:
        h = hashlib.sha256()
        meta = f"{provider}|{model}|{temperature}|{max_tokens}|{response_format}|{PIPELINE_VERSION}|{CACHE_BUST}"
        h.update(meta.encode("utf-8"))
        h.update((prompt or "").encode("utf-8"))
        return h.hexdigest()

    def get(self, key: str) -> Optional[str]:
        if DISABLE_CACHE:
            return None
        return self._cache.get(key)

    def set(self, key: str, value: str) -> None:
        if DISABLE_CACHE:
            return
        if value:
            self._cache[key] = value

    def size(self) -> int:
        return len(self._cache)
