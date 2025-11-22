# tools/check_dataset_quality.py
import json
import re
from collections import Counter
from pathlib import Path

# Paths
train_path = Path("data/mba/datasets/latest/train.jsonl")
val_path = Path("data/mba/datasets/latest/val.jsonl")

def analyze_data(file_path: Path, num_samples=100):
    print(f"\n{'='*90}")
    print(f"🔍 Analyzing: {file_path}")
    print(f"{'='*90}\n")

    issues = {
        'weird_chars': 0,
        'empty_inputs': 0,
        'empty_outputs': 0,
        'invalid_json': 0,
        'very_long': 0,
        'very_short': 0,
        'encoding_issues': 0
    }

    samples = []
    tier_counts = Counter()

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for i, line in enumerate(f):
                try:
                    data = json.loads(line)
                    samples.append(data)

                    input_text = data.get("input", "").strip()
                    output = data.get("output", {})

                    # Tier tracking
                    if isinstance(output, dict) and "tier" in output:
                        tier_counts[output["tier"]] += 1

                    # Basic quality checks
                    if not input_text:
                        issues["empty_inputs"] += 1
                    if not output:
                        issues["empty_outputs"] += 1
                    if len(input_text) > 5000:
                        issues["very_long"] += 1
                    elif len(input_text) < 50:
                        issues["very_short"] += 1

                    if re.search(r"[^\x00-\x7F]", input_text):
                        issues["weird_chars"] += 1
                    if "�" in input_text or "�" in str(output):
                        issues["encoding_issues"] += 1

                except json.JSONDecodeError:
                    issues["invalid_json"] += 1
                if i >= num_samples:
                    break
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        return {}, [], Counter()

    # Summary
    total = len(samples)
    print(f"📊 Samples analyzed: {total}")
    print("\n⚠️ Issues found:")
    for k, v in issues.items():
        pct = (v / total * 100) if total > 0 else 0
        print(f"  - {k:<20}: {v:<5} ({pct:.1f}%)")

    print("\n📈 Tier distribution (from sampled data):")
    for t, c in tier_counts.items():
        print(f"  - {t:<15}: {c}")

    # Show example samples
    print(f"\n{'='*90}")
    print("🧾 SAMPLE RESUMES (first 3 examples):")
    print(f"{'='*90}\n")
    for i, sample in enumerate(samples[:3]):
        print(f"Example {i+1}")
        print("-" * 80)
        print("INPUT (first 300 chars):")
        print(sample.get("input", "")[:300])
        print("\nOUTPUT:")
        print(json.dumps(sample.get("output", {}), indent=2)[:500])
        print("-" * 80 + "\n")

    return issues, samples, tier_counts


# Run analysis for train and val
train_issues, train_samples, train_tiers = analyze_data(train_path, num_samples=100)
val_issues, val_samples, val_tiers = analyze_data(val_path, num_samples=50)

# Overall assessment
print(f"\n{'='*90}")
print("🧠 OVERALL DATASET ASSESSMENT")
print(f"{'='*90}\n")

total_issues = sum(train_issues.values()) + sum(val_issues.values())

if total_issues > 50:
    print("⚠️  HIGH number of data quality issues detected!")
    print("   → Recommend cleaning data before training.")
elif total_issues > 20:
    print("⚠️  MODERATE number of issues detected.")
    print("   → Some minor cleaning may improve results.")
else:
    print("✅ Data quality looks excellent!")
    print("   → You’re ready for supervised fine-tuning 🚀")

print(f"\n📚 Train samples: {len(train_samples)} | Val samples: {len(val_samples)}")
print(f"🎯 Total issues: {total_issues}")
print(f"{'='*90}\n")
