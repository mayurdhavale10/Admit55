import json
from pathlib import Path
from prettytable import PrettyTable

DATASETS = [
    ("Scores",      Path("data/mba/datasets/sft_scores.jsonl")),
    ("Reasoning",   Path("data/mba/datasets/sft_reasoning.jsonl")),
    ("Rewrite",     Path("data/mba/datasets/sft_rewrite.jsonl")),
    ("MultiTask",   Path("data/mba/datasets/sft_multitask.jsonl")),
]

def validate_file(name, path: Path):
    if not path.exists():
        return (
            name,
            0,   # lines
            0,   # invalid
            0,   # missing instruction
            0,   # missing input
            0,   # missing output
            "❌ Missing file"
        )

    total = 0
    invalid = 0
    missing_instr = 0
    missing_input = 0
    missing_output = 0

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            total += 1
            try:
                obj = json.loads(line)
            except:
                invalid += 1
                continue

            if "instruction" not in obj:
                missing_instr += 1

            if "input" not in obj or len(str(obj["input"]).strip()) < 10:
                missing_input += 1

            if "output" not in obj or len(str(obj["output"]).strip()) == 0:
                missing_output += 1

    status = "✅ OK" if (invalid + missing_instr + missing_input + missing_output) == 0 else "⚠ Issues"

    return (
        name,
        total,
        invalid,
        missing_instr,
        missing_input,
        missing_output,
        status
    )

def main():
    table = PrettyTable()
    table.field_names = [
        "Dataset",
        "Lines",
        "Invalid JSON",
        "Missing instruction",
        "Missing input",
        "Missing output",
        "Status"
    ]

    for (name, path) in DATASETS:
        result = validate_file(name, path)
        table.add_row(result)

    print("\n================ SFT DATASET QUALITY REPORT ================\n")
    print(table)
    print("\n✅ Validation finished.\n")

if __name__ == "__main__":
    main()
