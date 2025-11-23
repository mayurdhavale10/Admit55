import json
from pathlib import Path

# Input and output file paths
INPUT_JSONL = Path("data/mba/datasets/sft_score_regression.jsonl")
OUTPUT_JSONL = Path("data/mba/datasets/sft_score_regression_text.jsonl")

def main():
    if not INPUT_JSONL.exists():
        raise FileNotFoundError(f"❌ Input file not found: {INPUT_JSONL}")

    with open(INPUT_JSONL, "r", encoding="utf-8") as fin, \
         open(OUTPUT_JSONL, "w", encoding="utf-8") as fout:
        
        count = 0
        for line in fin:
            try:
                item = json.loads(line)
                resume_text = item.get("input", "").strip()
                score = str(item.get("output", "")).strip()

                if not resume_text or not score:
                    continue

                # 🔹 Build a natural language prompt for QLoRA training
                text = (
                    f"Rate this resume on a scale of 0 to 100.\n\n"
                    f"{resume_text}\n\n"
                    f"Answer: {score}"
                )

                fout.write(json.dumps({"text": text}, ensure_ascii=False) + "\n")
                count += 1
            except Exception as e:
                print(f"[warn] Skipped one line due to error: {e}")

    print(f"✅ Converted {count} samples → {OUTPUT_JSONL}")

if __name__ == "__main__":
    main()
