import json
import re
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

# =========================================================
# Show side-by-side: what model generates vs ground truth
# =========================================================

MODEL_PATH = "data/mba/fine_tune/artifacts/lora/qwen2_5_1.5b_REAL_aligned"
VAL_PATH = "data/mba/datasets/latest/val.jsonl"

print("🔄 Loading model...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH,
    torch_dtype=torch.bfloat16,
    device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
pipe = pipeline("text-generation", model=model, tokenizer=tokenizer)
print("✅ Model loaded!\n")

# Helper functions
def find_tier_recursive(obj, depth=0, max_depth=5):
    if depth > max_depth:
        return None
    
    if isinstance(obj, dict):
        if "tier" in obj:
            return obj["tier"]
        if "company_tier" in obj:
            return obj["company_tier"]
        for value in obj.values():
            result = find_tier_recursive(value, depth + 1, max_depth)
            if result:
                return result
    elif isinstance(obj, list):
        for item in obj:
            result = find_tier_recursive(item, depth + 1, max_depth)
            if result:
                return result
    return None

def extract_clean_json(output_text):
    cleaned = (
        output_text.replace("```json", "").replace("```", "")
        .replace("JSON:", "").replace("Resume:", "").strip()
    )
    if "{" in cleaned and "}" in cleaned:
        cleaned = cleaned[cleaned.find("{"): cleaned.rfind("}") + 1]
    cleaned = re.sub(r"[^\x00-\x7F]+", " ", cleaned)
    try:
        return json.loads(cleaned)
    except:
        return None

# Load validation data
val_data = []
with open(VAL_PATH, "r", encoding="utf-8") as f:
    for line in f:
        if line.strip():
            val_data.append(json.loads(line.strip()))

print("=" * 80)
print("📊 SIDE-BY-SIDE COMPARISON (First 5 Samples)")
print("=" * 80)

for i in range(min(5, len(val_data))):
    sample = val_data[i]
    
    print(f"\n{'='*80}")
    print(f"SAMPLE {i}")
    print(f"{'='*80}")
    
    # Show input
    print(f"\n📄 INPUT (first 300 chars):")
    print(sample['input'][:300])
    print("...")
    
    # Show ground truth
    print(f"\n✅ GROUND TRUTH:")
    gt_output = sample.get('output', {})
    print(json.dumps(gt_output, indent=2))
    gt_tier = gt_output.get('tier') if isinstance(gt_output, dict) else None
    print(f"\n   → Ground truth tier: {gt_tier}")
    
    # Generate prediction
    prompt = (
        "You are a professional resume normalizer. "
        "Return ONLY valid JSON (no markdown, no explanations). "
        "Use this schema:\n"
        "{ 'tier': 'tier1_elite' | 'tier2_mid' | 'tier3_regular' | 'nontraditional' | 'unknown' }\n\n"
        f"Resume:\n{sample['input']}\nJSON:\n"
    )
    
    response = pipe(
        prompt,
        max_new_tokens=400,
        temperature=0.0,
        do_sample=False,
    )[0]["generated_text"]
    
    # Parse prediction
    parsed = extract_clean_json(response)
    
    print(f"\n🤖 MODEL OUTPUT:")
    if parsed:
        # Show structure
        print(json.dumps(parsed, indent=2)[:500])  # First 500 chars
        if len(json.dumps(parsed)) > 500:
            print("...")
        
        # Extract tier
        pred_tier = find_tier_recursive(parsed)
        print(f"\n   → Predicted tier: {pred_tier}")
    else:
        print("⚠️ Failed to parse JSON")
        print(response[:300])
    
    # Compare
    print(f"\n{'='*40}")
    if gt_tier and pred_tier:
        if gt_tier == pred_tier:
            print("✅ MATCH!")
        else:
            print(f"❌ MISMATCH: Expected '{gt_tier}', got '{pred_tier}'")
    else:
        print(f"⚠️ INCOMPLETE: GT={gt_tier}, Pred={pred_tier}")
    print(f"{'='*40}")

print("\n" + "=" * 80)
print("🔍 ANALYSIS")
print("=" * 80)
print("""
Look at the comparison above and ask:

1. Does ground truth have a 'tier' field?
   - If NO → validation data is corrupted/wrong format
   - If YES but None → validation data needs proper labels

2. Does model output have tier information?
   - If NO → model wasn't trained on tier classification
   - If YES → check if it's in the right location

3. Are the tiers semantically correct?
   - Even if locations don't match, does the tier value make sense?
   - E.g., if resume mentions "Goldman Sachs", model should predict tier1_elite

4. Is there a pattern to the mismatches?
   - Model always predicts tier3 → bias in training data
   - Model predicts random tiers → not trained properly
   - Model predicts correct semantic tier but wrong format → easy fix
""")