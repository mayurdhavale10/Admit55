import os
import json
import glob
from pathlib import Path
from tqdm import tqdm

RESUME_ROOT = "data/mba/resumes_raw/synthetic/processed"
LABEL_ROOT = "data/mba/labels_normalized/synthetic/processed"
OUT_DIR = "data/mba/datasets"

os.makedirs(OUT_DIR, exist_ok=True)

# Output files
FN_SCORES = f"{OUT_DIR}/sft_scores.jsonl"
FN_REASONING = f"{OUT_DIR}/sft_reasoning.jsonl"
FN_REWRITE = f"{OUT_DIR}/sft_rewrite.jsonl"
FN_MULTI = f"{OUT_DIR}/sft_multitask.jsonl"


def load(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except:
        return None


def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return None


def extract_scores(label):
    """Extract 4 core scores (fallback = 0)."""
    return {
        "academics": label.get("academics", {}).get("ug_tier", 0),
        "industry": label.get("industry", {}).get("company_tier", 0),
        "leadership": 1 if label.get("signals", {}).get("leadership") else 0,
        "overall": label.get("meta", {}).get("feature_score", 0),
    }


def build_reasoning(label):
    """Simple rule-based reasoning (placeholder)."""
    acad = label.get("academics", {}).get("ug_tier", 0)
    comp = label.get("industry", {}).get("company_tier", 0)
    lead = 1 if label.get("signals", {}).get("leadership") else 0

    return (
        f"The candidate has an undergraduate tier score of {acad}. "
        f"They worked at a tier {comp} company which improves industry exposure. "
        f"Leadership signals are {'present' if lead else 'weak'}. "
        f"Overall the candidate shows a balanced profile."
    )


def build_rewrite(text):
    """Simple transformation for rewrite (placeholder)."""
    return (
        "IMPROVED VERSION:\n\n"
        + text.replace(".", ".\n- ").replace("\n", "\n- ")
    )


def main():
    tiers = sorted(os.listdir(RESUME_ROOT))

    f_scores = open(FN_SCORES, "w", encoding="utf-8")
    f_reason = open(FN_REASONING, "w", encoding="utf-8")
    f_rewrite = open(FN_REWRITE, "w", encoding="utf-8")
    f_multi = open(FN_MULTI, "w", encoding="utf-8")

    total_written = 0

    for tier in tiers:
        txt_dir = f"{RESUME_ROOT}/{tier}"
        json_dir = f"{LABEL_ROOT}/{tier}"

        txt_files = sorted(glob.glob(f"{txt_dir}/*.txt"))

        for txt_path in tqdm(txt_files, desc=f"[{tier}]"):
            base = Path(txt_path).stem
            json_path = f"{json_dir}/{base}.json"

            text = load(txt_path)
            label = load_json(json_path)

            if not text or not label:
                continue

            scores = extract_scores(label)
            reasoning = build_reasoning(label)
            rewrite = build_rewrite(text)

            # -------------------- Task A — Score Prediction --------------------
            f_scores.write(json.dumps({
                "instruction": "Predict MBA admission metric scores.",
                "input": text,
                "output": json.dumps(scores)
            }, ensure_ascii=False) + "\n")

            # -------------------- Task B — Reasoning ---------------------------
            f_reason.write(json.dumps({
                "instruction": "Explain the MBA evaluation of this resume.",
                "input": text,
                "output": reasoning
            }, ensure_ascii=False) + "\n")

            # -------------------- Task C — Rewrite -----------------------------
            f_rewrite.write(json.dumps({
                "instruction": "Rewrite the resume to improve clarity and impact.",
                "input": text,
                "output": rewrite
            }, ensure_ascii=False) + "\n")

            # -------------------- Task D — Multi-task mix ----------------------
            f_multi.write(json.dumps({
                "instruction": "Evaluate this resume: provide JSON scores, reasoning, and improved rewrite.",
                "input": text,
                "output": json.dumps({
                    "scores": scores,
                    "reasoning": reasoning,
                    "improved_resume": rewrite
                })
            }, ensure_ascii=False) + "\n")

            total_written += 1

    f_scores.close()
    f_reason.close()
    f_rewrite.close()
    f_multi.close()

    print("\n\n✅ DONE!")
    print(f"Scores dataset:     {FN_SCORES}")
    print(f"Reasoning dataset:  {FN_REASONING}")
    print(f"Rewrite dataset:    {FN_REWRITE}")
    print(f"Multi-task dataset: {FN_MULTI}")
    print(f"Total samples:      {total_written}")


if __name__ == "__main__":
    main()
