import os, json, glob, argparse
from pathlib import Path
from tqdm import tqdm

"""
build_training_dataset.py
---------------------------------
Combines all synthetic resumes (.txt + .json) into a single JSONL file for model training.

Output format (one line per sample):
{
  "instruction": "Rate this MBA resume on a scale of 0–100 based on quality and potential.",
  "input": "<resume text>",
  "output": "<feature_score>"
}
"""

def load_text(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception as e:
        print(f"[warn] Could not read text: {path} → {e}")
        return None

def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[warn] Could not read JSON: {path} → {e}")
        return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--resumes-root", default="data/mba/resumes_raw/synthetic/processed",
                    help="Root folder for synthetic resume .txt files")
    ap.add_argument("--labels-root", default="data/mba/labels_normalized/synthetic/processed",
                    help="Root folder for normalized label .json files")
    ap.add_argument("--out-jsonl", default="data/mba/datasets/sft_score_regression.jsonl",
                    help="Output JSONL file for model fine-tuning")
    args = ap.parse_args()

    # ✅ Fix: use args.resumes_root instead of args.resumes-root
    os.makedirs(os.path.dirname(args.out_jsonl), exist_ok=True)
    all_tiers = sorted(os.listdir(args.resumes_root))
    total_written = 0

    with open(args.out_jsonl, "w", encoding="utf-8") as out_f:
        for tier in all_tiers:
            txt_dir = os.path.join(args.resumes_root, tier)
            json_dir = os.path.join(args.labels_root, tier)
            if not os.path.isdir(txt_dir) or not os.path.isdir(json_dir):
                continue

            txt_files = sorted(glob.glob(os.path.join(txt_dir, "*.txt")))
            for txt_path in tqdm(txt_files, desc=f"[{tier}]"):
                base = Path(txt_path).stem
                json_path = os.path.join(json_dir, f"{base}.json")

                if not os.path.exists(json_path):
                    print(f"[warn] Missing label for {base}")
                    continue

                resume_text = load_text(txt_path)
                label = load_json(json_path)
                if not resume_text or not label:
                    continue

                score = (
                    label.get("meta", {}).get("feature_score")
                    or label.get("feature_score")
                    or None
                )
                if score is None:
                    print(f"[warn] No score found for {base}")
                    continue

                data = {
                    "instruction": "Rate this MBA resume on a scale of 0–100 based on quality and potential.",
                    "input": resume_text,
                    "output": str(score),
                }

                out_f.write(json.dumps(data, ensure_ascii=False) + "\n")
                total_written += 1

    print(f"\n✅ Done! Combined {total_written} resumes into {args.out_jsonl}")

if __name__ == "__main__":
    main()
