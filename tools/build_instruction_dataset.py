# tools/build_instruction_dataset.py
"""
Builds a labeled instruction-tuning dataset from paired resume text + normalized labels.

Output:
  data/mba/datasets/latest/train.jsonl
  data/mba/datasets/latest/val.jsonl
"""

import os
import json
import random
from pathlib import Path
from tqdm import tqdm

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[1]
RESUME_DIR = BASE_DIR / "data" / "mba" / "resumes_raw" / "synthetic" / "processed"
LABEL_DIR = BASE_DIR / "data" / "mba" / "labels_normalized" / "synthetic" / "processed"
OUT_DIR = BASE_DIR / "data" / "mba" / "datasets" / "latest"
OUT_DIR.mkdir(parents=True, exist_ok=True)

TRAIN_PATH = OUT_DIR / "train.jsonl"
VAL_PATH = OUT_DIR / "val.jsonl"

# 95/5 train-val split
TRAIN_SPLIT = 0.95


# --------------------------------------------------------------------------
# Utility: load paired data
# --------------------------------------------------------------------------
def collect_pairs():
    pairs = []
    for tier_dir in LABEL_DIR.glob("*"):
        if not tier_dir.is_dir():
            continue

        resume_dir = RESUME_DIR / tier_dir.name
        if not resume_dir.exists():
            print(f"⚠ Missing resume dir for {tier_dir.name}")
            continue

        label_files = list(tier_dir.glob("*.json"))
        for label_file in tqdm(label_files, desc=f"Loading {tier_dir.name}"):
            base_name = label_file.stem
            resume_path = resume_dir / f"{base_name}.txt"

            if not resume_path.exists():
                print(f"⚠ Missing resume for {base_name}")
                continue

            try:
                with open(label_file, "r", encoding="utf-8") as f:
                    label = json.load(f)
                with open(resume_path, "r", encoding="utf-8") as f:
                    text = f.read()
            except Exception as e:
                print(f"❌ Error reading pair {base_name}: {e}")
                continue

            pairs.append({"input": text.strip(), "output": label})
    return pairs


# --------------------------------------------------------------------------
# Main builder
# --------------------------------------------------------------------------
def build_dataset():
    pairs = collect_pairs()
    print(f"\n✅ Loaded {len(pairs)} total paired resumes")

    random.shuffle(pairs)

    split_idx = int(len(pairs) * TRAIN_SPLIT)
    train_pairs = pairs[:split_idx]
    val_pairs = pairs[split_idx:]

    print(f"🧠 Train: {len(train_pairs)}  |  Val: {len(val_pairs)}")

    # Write JSONL
    def write_jsonl(path, records):
        with open(path, "w", encoding="utf-8") as f:
            for r in records:
                record = {
                    "instruction": "Label this resume into structured MBA applicant categories.",
                    "input": r["input"],
                    "output": r["output"],
                }
                f.write(json.dumps(record, ensure_ascii=False) + "\n")

    write_jsonl(TRAIN_PATH, train_pairs)
    write_jsonl(VAL_PATH, val_pairs)

    print(f"\n📦 Dataset written:")
    print(f" - Train: {TRAIN_PATH}")
    print(f" - Val:   {VAL_PATH}")
    print("\n✅ Done. You can now use these for supervised fine-tuning!")


if __name__ == "__main__":
    build_dataset()
