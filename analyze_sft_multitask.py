import json
from pathlib import Path
from statistics import mean
import random

DATASET_PATH = Path("data/mba/datasets/sft_multitask.jsonl")


def load_dataset(path: Path):
    items = []
    with path.open("r", encoding="utf-8") as f:
        for i, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                print(f"[WARN] Invalid JSON at line {i}")
                continue

            # basic required fields
            if not all(k in obj for k in ("instruction", "input", "output")):
                print(f"[WARN] Missing field(s) at line {i}")
                continue

            items.append(obj)
    return items


def basic_stats(items):
    n = len(items)
    instr_lens = [len(x["instruction"]) for x in items]
    input_lens = [len(str(x["input"])) for x in items]
    output_lens = [len(str(x["output"])) for x in items]

    print("\n==== BASIC STATS ====")
    print(f"Total examples: {n}")
    print(f"Instruction length (chars): mean={mean(instr_lens):.1f}, "
          f"min={min(instr_lens)}, max={max(instr_lens)}")
    print(f"Input length (chars):       mean={mean(input_lens):.1f}, "
          f"min={min(input_lens)}, max={max(input_lens)}")
    print(f"Output length (chars):      mean={mean(output_lens):.1f}, "
          f"min={min(output_lens)}, max={max(output_lens)}")

    # Very short outputs (probably low-quality)
    very_short = sum(1 for L in output_lens if L < 20)
    print(f"Outputs < 20 chars: {very_short} ({very_short/n*100:.2f}%)")

    # Suspicious examples where output == input
    same_io = sum(
        1 for x in items
        if str(x["input"]).strip() == str(x["output"]).strip()
    )
    print(f"Input == Output: {same_io} ({same_io/n*100:.2f}%)")


def sample_examples(items, k=5):
    print(f"\n==== RANDOM SAMPLE ({k} examples) ====\n")
    sample = random.sample(items, min(k, len(items)))
    for i, ex in enumerate(sample, start=1):
        print(f"--- Example {i} ---")
        print("Instruction:")
        print(ex["instruction"])
        print("\nInput:")
        print(ex["input"])
        print("\nOutput:")
        print(ex["output"])
        print("\n" + "-"*60 + "\n")


def main():
    if not DATASET_PATH.exists():
        print("❌ sft_multitask.jsonl not found at", DATASET_PATH)
        return

    items = load_dataset(DATASET_PATH)
    if not items:
        print("No valid items loaded.")
        return

    basic_stats(items)
    sample_examples(items, k=10)  # show 10 random examples to eyeball


if __name__ == "__main__":
    main()
