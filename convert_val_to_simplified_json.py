import json, os

input_path = "data/mba/datasets/latest/val.jsonl"
output_path = "data/mba/fine_tune/validation.json"

os.makedirs(os.path.dirname(output_path), exist_ok=True)

converted = []
with open(input_path, "r", encoding="utf-8") as f:
    for line in f:
        if not line.strip():
            continue
        try:
            item = json.loads(line)
            resume_text = item.get("input") or item.get("resume", "")
            output = item.get("output", {})
            tier = output.get("tier") or output.get("meta", {}).get("tier") or "unknown"
            converted.append({"resume": resume_text.strip(), "tier": tier})
        except Exception as e:
            print(f"❌ Skipping invalid line: {e}")

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(converted, f, indent=2, ensure_ascii=False)

print(f"✅ Created {len(converted)} validation samples at {output_path}")
