import json
from pathlib import Path
from tqdm import tqdm
import statistics as stats

INPUT_JSONL = Path("data/mba/datasets/sft_score_regression_text.jsonl")

def main():
    if not INPUT_JSONL.exists():
        raise FileNotFoundError(f"❌ File not found: {INPUT_JSONL}")

    lengths = []
    bad_lines = 0
    with open(INPUT_JSONL, "r", encoding="utf-8") as f:
        for line in tqdm(f, desc="[checking text dataset]"):
            try:
                item = json.loads(line)
                text = item.get("text", "").strip()
                if not text or len(text) < 50:
                    bad_lines += 1
                else:
                    lengths.append(len(text))
            except Exception:
                bad_lines += 1

    print("\n📊 Text Dataset Summary")
    print(f"Total samples: {len(lengths) + bad_lines}")
    print(f"Valid samples: {len(lengths)}")
    print(f"Invalid/empty lines: {bad_lines}")

    if lengths:
        print(f"Min length: {min(lengths)}")
        print(f"Max length: {max(lengths)}")
        print(f"Mean length: {round(stats.mean(lengths), 2)}")
        print(f"Std dev: {round(stats.pstdev(lengths), 2)}")

if __name__ == "__main__":
    main()
