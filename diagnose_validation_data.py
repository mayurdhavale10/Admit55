import json
from collections import Counter

VAL_PATH = "data/mba/datasets/latest/val.jsonl"

print("=" * 80)
print("🔍 VALIDATION DATA DIAGNOSIS")
print("=" * 80)

# Load validation data
val_data = []
with open(VAL_PATH, "r", encoding="utf-8") as f:
    for line in f:
        if line.strip():
            val_data.append(json.loads(line.strip()))

print(f"\n✅ Loaded {len(val_data)} samples\n")

# Check first 5 samples in detail
print("=" * 80)
print("📋 FIRST 5 SAMPLES - DETAILED INSPECTION")
print("=" * 80)

for i in range(min(5, len(val_data))):
    sample = val_data[i]
    
    print(f"\n{'='*60}")
    print(f"SAMPLE {i}")
    print(f"{'='*60}")
    
    # Check keys
    print(f"Keys: {list(sample.keys())}")
    
    # Check output structure
    output = sample.get('output', {})
    print(f"\nOutput type: {type(output).__name__}")
    print(f"Output: {json.dumps(output, indent=2)}")
    
    # Try to get tier
    if isinstance(output, dict):
        tier = output.get('tier')
        print(f"\nTier value: {tier}")
        print(f"Tier type: {type(tier).__name__ if tier else 'None'}")
    else:
        print(f"\n⚠️ Output is not a dict! It's: {output}")
    
    # Show input preview
    print(f"\nInput preview (first 200 chars):")
    print(sample.get('input', 'N/A')[:200])

# Check ground truth tier distribution
print("\n" + "=" * 80)
print("📊 GROUND TRUTH TIER DISTRIBUTION (First 100 samples)")
print("=" * 80)

tiers = []
none_count = 0
invalid_count = 0

for sample in val_data[:100]:
    output = sample.get('output', {})
    
    if isinstance(output, dict):
        tier = output.get('tier')
        if tier is None:
            none_count += 1
        elif tier in ["tier1_elite", "tier2_mid", "tier3_regular", "nontraditional", "unknown"]:
            tiers.append(tier)
        else:
            invalid_count += 1
            if invalid_count <= 3:  # Show first 3 invalid
                print(f"⚠️ Invalid tier value found: {tier}")
    else:
        print(f"⚠️ Output is not a dict in sample {val_data.index(sample)}")

if tiers:
    tier_dist = Counter(tiers)
    print(f"\nValid tiers found: {len(tiers)}")
    for tier, count in tier_dist.most_common():
        print(f"  {tier}: {count} ({100*count/len(tiers):.1f}%)")
else:
    print("\n❌ NO VALID TIERS FOUND!")

if none_count > 0:
    print(f"\n⚠️ Found {none_count} samples with tier = None")

if invalid_count > 0:
    print(f"\n⚠️ Found {invalid_count} samples with invalid tier values")

# Check if training data has same issue
print("\n" + "=" * 80)
print("📊 TRAINING DATA CHECK")
print("=" * 80)

TRAIN_PATH = "data/mba/datasets/latest/train.jsonl"
try:
    with open(TRAIN_PATH, "r", encoding="utf-8") as f:
        train_sample = json.loads(f.readline().strip())
    
    print("\nFirst training sample output:")
    print(json.dumps(train_sample.get('output', {}), indent=2))
    
    # Check first 10 training samples
    train_tiers = []
    with open(TRAIN_PATH, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i >= 10:
                break
            sample = json.loads(line.strip())
            output = sample.get('output', {})
            if isinstance(output, dict):
                tier = output.get('tier')
                train_tiers.append(tier)
    
    print(f"\nFirst 10 training tiers: {train_tiers}")
    
except Exception as e:
    print(f"⚠️ Could not check training data: {e}")

print("\n" + "=" * 80)
print("💡 DIAGNOSIS")
print("=" * 80)

if none_count > 0:
    print("""
❌ PROBLEM: Some validation samples have tier = None

This means:
1. Your validation data was not properly labeled
2. The 'tier' field exists but is set to null/None
3. These samples are unusable for evaluation

SOLUTIONS:
1. Filter out samples where tier is None before evaluation
2. Re-label your validation dataset
3. Check your data preparation pipeline
""")
elif not tiers:
    print("""
❌ PROBLEM: No valid tier labels found in validation data

This means:
1. The output format is wrong
2. Tier field doesn't exist or has wrong format
3. Data preprocessing issue

SOLUTION:
Check your data preparation script - validation data should have:
{"input": "...", "output": {"tier": "tier1_elite"}}
""")
else:
    print("""
✅ Data format looks OK

The 0% accuracy means:
1. Model is generating wrong predictions (not trained properly)
2. Model checkpoint is from wrong training run
3. Model needs more training epochs
4. Training data might be corrupted
""")