"""
Backward-compatible shim.
Keeps old imports working after modularization.
"""

from pipeline.tools.profileresumetool import run_pipeline, PIPELINE_VERSION

# Optional: keep PDF_SUPPORT for legacy callers
try:
    import PyPDF2  # noqa: F401
    PDF_SUPPORT = True
except Exception:
    PDF_SUPPORT = False


def extract_first_json(text: str) -> str:
    """Legacy helper used by bschool_match_pipeline."""
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
