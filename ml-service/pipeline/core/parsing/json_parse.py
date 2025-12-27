# ml-service/pipeline/core/parsing/json_parse.py

import json
from typing import Any, Dict


def extract_first_json_object(text: str) -> str:
    """
    Extract the first {...} JSON object substring from a larger text.
    """
    if not text:
        raise ValueError("Empty text")

    s = text.strip()
    if s.startswith("{") and s.endswith("}"):
        return s

    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object start found")

    depth = 0
    for i in range(start, len(text)):
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1].strip()

    raise ValueError("Unbalanced JSON braces")


def parse_json_strictish(raw: str) -> Dict[str, Any]:
    """
    1) Try json.loads(raw)
    2) If it fails, try extracting first JSON object and loading that
    Returns a dict (raises if JSON is not an object).
    """
    if not raw:
        raise ValueError("Empty raw JSON")

    try:
        data = json.loads(raw)
    except Exception:
        data = json.loads(extract_first_json_object(raw))

    if not isinstance(data, dict):
        raise ValueError("JSON must be an object (dict) at top-level")

    return data
