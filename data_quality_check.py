import os
import json
from pathlib import Path
from prettytable import PrettyTable

ROOT = Path.cwd()
RESUME_DIR = ROOT / "data" / "mba" / "resumes_raw" / "synthetic" / "processed"
LABEL_DIR = ROOT / "data" / "mba" / "labels_normalized" / "synthetic" / "processed"

def validate_quality():
    print("[quality] 🧪 Checking dataset consistency...\n")

    summary = []

    for tier in os.listdir(RESUME_DIR):
        resume_path = RESUME_DIR / tier
        label_path = LABEL_DIR / tier

        txt_files = list(resume_path.glob("*.txt"))
        json_files = list(label_path.glob("*.json"))

        valid_json = 0
        invalid_json = 0
        empty_resumes = 0

        for file in json_files:
            try:
                with open(file, "r", encoding="utf-8") as f:
                    obj = json.load(f)

                # strong validation
                if (
                    isinstance(obj, dict)
                    and "tier" in obj
                    and "academics" in obj
                    and "career" in obj
                ):
                    valid_json += 1
                else:
                    invalid_json += 1
            except Exception:
                invalid_json += 1

        for txt in txt_files:
            content = txt.read_text(encoding="utf-8").strip()
            if len(content) < 100:
                empty_resumes += 1

        match_ratio = round(len(txt_files) / max(1, len(json_files)), 2)

        summary.append({
            "Tier": tier,
            "TXT": len(txt_files),
            "JSON": len(json_files),
            "Invalid JSON": invalid_json,
            "Empty": empty_resumes,
            "Match Ratio": match_ratio
        })

    table = PrettyTable()
    table.field_names = ["Tier", "TXT", "JSON", "Invalid JSON", "Empty", "Match Ratio"]
    for row in summary:
        table.add_row([
            row["Tier"], row["TXT"], row["JSON"],
            row["Invalid JSON"], row["Empty"], row["Match Ratio"]
        ])

    print(table)

    total_txt = sum(r["TXT"] for r in summary)
    total_invalid = sum(r["Invalid JSON"] for r in summary)
    total_empty = sum(r["Empty"] for r in summary)

    print(f"\n[quality] ✅ Done! Data quality summary above.")
    print(f"Total resumes: {total_txt}")
    print(f"Invalid JSONs: {total_invalid}")
    print(f"Empty resumes: {total_empty}\n")

if __name__ == "__main__":
    validate_quality()
