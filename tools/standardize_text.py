# tools/standardize_text.py
"""
Resume Text Standardizer (Python version)
-----------------------------------------
Cleans, normalizes, and standardizes resume text before training or validation.

This matches src/lib/mba/ml/standardize.ts for consistent preprocessing across
training and inference. It directly improves tokenization quality and F1 scores.
"""

import re
import unicodedata

def standardize_text(text: str) -> str:
    if not text:
        return ""

    # --- Unicode normalization (normalize accents, special forms)
    text = unicodedata.normalize("NFKC", text)

    # --- Fix common encoding issues (Windows-1252/UTF8 mismatch)
    replacements = {
        "â€”": "—",
        "â€“": "–",
        "â€¢": "•",
        "â€˜": "'",
        "â€™": "'",
        "â€œ": '"',
        "â€": '"',
        "Â": "",
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)

    # --- Expand common abbreviations
    expansions = {
        r"\bEngrs?\b": "engineers",
        r"\bMgrs?\b": "managers",
        r"\bProj\b": "project",
        r"\bIntl\b": "international",
        r"\bOrg\b": "organization",
        r"\bOps\b": "operations",
        r"\bDept\b": "department",
        r"\bUniv\b": "university",
        r"\bInst\b": "institute",
        r"\bGovt\b": "government",
        r"\bMgmt\b": "management",
        r"\bExec\b": "executive",
        r"\bAsst\b": "assistant",
    }
    for pattern, repl in expansions.items():
        text = re.sub(pattern, repl, text, flags=re.IGNORECASE)

    # --- Fix spacing & punctuation
    text = re.sub(r"\s+", " ", text)  # collapse spaces
    text = re.sub(r"\s*([.,!?;:])\s*", r"\1 ", text)  # normalize punctuation
    text = re.sub(r"\s*\n\s*", " ", text)  # remove newlines

    # --- Capitalize first letters after periods
    text = re.sub(r"(^\w|\.\s+\w)", lambda m: m.group(0).upper(), text)

    # --- Remove non-ASCII symbols (emojis, invisible chars)
    text = re.sub(r"[^\x00-\x7F]+", "", text)

    return text.strip()


if __name__ == "__main__":
    import sys, json, pathlib

    if len(sys.argv) < 3:
        print("Usage: python tools/standardize_text.py <input_jsonl> <output_jsonl>")
        sys.exit(1)

    inp, outp = sys.argv[1], sys.argv[2]
    inp_path = pathlib.Path(inp)
    out_path = pathlib.Path(outp)

    if not inp_path.exists():
        print(f"[ERROR] Input file not found: {inp}")
        sys.exit(1)

    with inp_path.open("r", encoding="utf-8") as fin, out_path.open("w", encoding="utf-8") as fout:
        for line in fin:
            try:
                obj = json.loads(line)
                text = obj.get("text", "")
                obj["text"] = standardize_text(text)
                fout.write(json.dumps(obj, ensure_ascii=False) + "\n")
            except Exception:
                continue

    print(f"[OK] Standardized dataset written to {outp}")
