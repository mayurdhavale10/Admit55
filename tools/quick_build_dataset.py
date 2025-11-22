import json, os, glob, random, sys
from pathlib import Path

# Where resumes live
SRC_GLOB = "data/mba/resumes_raw/synthetic/processed/**/*.txt"

# Target dataset dir
target_dir = Path("data/mba/datasets/latest")

# If something exists at target_dir but is not a directory, back it up (safe)
if target_dir.exists() and not target_dir.is_dir():
    bak = target_dir.with_name(target_dir.name + ".file.bak")
    print(f"[WARN] Path exists and is a file: {target_dir} -> renaming to {bak}")
    try:
        target_dir.rename(bak)
    except Exception as e:
        print(f"[ERROR] Could not rename existing file: {e}", file=sys.stderr)
        sys.exit(2)

# Ensure directory exists
target_dir.mkdir(parents=True, exist_ok=True)

# Find text resumes
txts = sorted(glob.glob(SRC_GLOB, recursive=True))
random.seed(42)
random.shuffle(txts)

lines = []
for p in txts:
    try:
        with open(p, "r", encoding="utf-8", errors="ignore") as f:
            t = f.read().strip()
    except Exception as e:
        print(f"[WARN] Could not read {p}: {e}")
        continue
    if not t:
        continue
    # Minimal single-field training sample
    lines.append({"text": t})

n = len(lines)
if n == 0:
    print("[ERROR] No resumes found under data/mba/resumes_raw/synthetic/processed", file=sys.stderr)
    sys.exit(1)

cut = int(n * 0.95)
train, val = lines[:cut], lines[cut:]

# Write files
train_path = target_dir / "train.jsonl"
val_path = target_dir / "val.jsonl"

with open(train_path, "w", encoding="utf-8") as f:
    for r in train:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

with open(val_path, "w", encoding="utf-8") as f:
    for r in val:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

print(f"[OK] Wrote {len(train)} train and {len(val)} val samples to {target_dir}")
