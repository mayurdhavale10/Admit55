import os
import json
import glob
from pathlib import Path
from tqdm import tqdm

# =========================
# ABSOLUTE PROJECT ROOT (YOUR PATH)
# =========================
ROOT = Path(r"C:\Users\dhava\Downloads\Admit55\admit55")

RESUME_ROOT = ROOT / "data" / "mba" / "resumes_raw" / "synthetic" / "processed"
LABEL_ROOT  = ROOT / "data" / "mba" / "labels_normalized" / "synthetic" / "processed"
OUT_DIR     = ROOT / "data" / "mba" / "datasets"

OUT_DIR.mkdir(parents=True, exist_ok=True)

# Output dataset files
FN_SCORES   = OUT_DIR / "sft_scores.jsonl"
FN_REASON   = OUT_DIR / "sft_reasoning.jsonl"
FN_REWRITE  = OUT_DIR / "sft_rewrite.jsonl"
FN_MULTI    = OUT_DIR / "sft_multitask.jsonl"


def load(path: Path):
    try:
        return path.read_text(encoding="utf-8")
    except:
        return None

def load_json(path: Path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return None


def extract_scores(label):
    """Extract simple 4-score structure."""
    return {
        "academics": label.get("academics", {}).get("ug_tier", 0),
        "industry": label.get("industry", {}).get("company_tier", 0),
        "leadership": 1 if label.get("signals", {}).get("leadership") else 0,
        "overall": label.get("meta", {}).get("feature_score", 0),
    }

def build_reasoning(label):
    acad = label.get("academics", {}).get("ug_tier", 0)
    comp = label.get("industry", {}).get("company_tier", 0)
    lead = 1 if label.get("signals", {}).get("leadership") else 0
    return (
        f"UG tier = {acad}. Company tier = {comp}. "
        f"Leadership signals are {'present' if lead else 'absent'}. "
        f"Overall profile appears balanced."
    )

def build_rewrite(text):
    return (
        "IMPROVED VERSION:\n\n"
        + text.replace(".", ".\n- ").replace("\n", "\n- ")
    )


def main():
    # Open output files
    fs = open(FN_SCORES, "w", encoding="utf-8")
    fr = open(FN_REASON, "w", encoding="utf-8")
    fw = open(FN_REWRITE, "w", encoding="utf-8")
    fm = open(FN_MULTI, "w", encoding="utf-8")

    total_written = 0

    tiers = sorted([d.name for d in RESUME_ROOT.iterdir() if d.is_dir()])

    for tier in tiers:
        tier_txt_dir = RESUME_ROOT / tier
        tier_json_dir = LABEL_ROOT / tier

        txt_files = sorted(tier_txt_dir.glob("*.txt"))

        for txt_path in tqdm(txt_files, desc=f"[{tier}]"):
            base = txt_path.stem
            json_path = tier_json_dir / f"{base}.json"

            text  = load(txt_path)
            label = load_json(json_path)

            if not text or not label:
                continue

            scores    = extract_scores(label)
            reasoning = build_reasoning(label)
            rewrite   = build_rewrite(text)

            # ----- A. Score prediction -----
            fs.write(json.dumps({
                "instruction": "Predict MBA admission metric scores.",
                "input": text,
                "output": scores
            }, ensure_ascii=False) + "\n")

            # ----- B. Reasoning -----
            fr.write(json.dumps({
                "instruction": "Explain the MBA evaluation of this resume.",
                "input": text,
                "output": reasoning
            }, ensure_ascii=False) + "\n")

            # ----- C. Rewrite -----
            fw.write(json.dumps({
                "instruction": "Rewrite this resume to improve clarity and impact.",
                "input": text,
                "output": rewrite
            }, ensure_ascii=False) + "\n")

            # ----- D. Multi-task -----
            fm.write(json.dumps({
                "instruction": "Provide JSON scores, reasoning, and an improved rewritten resume.",
                "input": text,
                "output": {
                    "scores": scores,
                    "reasoning": reasoning,
                    "improved_resume": rewrite
                }
            }, ensure_ascii=False) + "\n")

            total_written += 1

    fs.close(); fr.close(); fw.close(); fm.close()

    print("\n\n🎉 DONE!")
    print(f"Scores dataset:     {FN_SCORES}")
    print(f"Reasoning dataset:  {FN_REASON}")
    print(f"Rewrite dataset:    {FN_REWRITE}")
    print(f"Multi-task dataset: {FN_MULTI}")
    print(f"Total samples:      {total_written}")


if __name__ == "__main__":
    main()
