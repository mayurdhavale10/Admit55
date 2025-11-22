"""
Check if your model was trained properly by analyzing training samples
"""
import json
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

MODEL_PATH = "data/mba/fine_tune/artifacts/lora/qwen2_5_1.5b_REAL_aligned"
TRAIN_PATH = "data/mba/datasets/latest/train.jsonl"

print("=" * 80)
print("🔍 TRAINING QUALITY DIAGNOSIS")
print("=" * 80)

# Load model
print("\n🔄 Loading model...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH, torch_dtype=torch.bfloat16, device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

pipe = pipeline("text-generation", model=model, tokenizer=tokenizer)
print("✅ Model loaded\n")

# Load training samples
train_samples = []
with open(TRAIN_PATH, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if i >= 5:  # Just check first 5
            break
        if line.strip():
            train_samples.append(json.loads(line.strip()))

print("=" * 80)
print("🧪 TEST: Can model reproduce training examples?")
print("=" * 80)
print("If model was trained properly, it should predict correctly on training data.\n")

correct = 0
for i, sample in enumerate(train_samples):
    if sample['output'].get('tier') is None:
        continue
    
    ground_truth = sample['output']['tier']
    
    prompt = (
        "You are a professional resume normalizer. "
        "Return ONLY valid JSON (no markdown, no explanations). "
        "Use this schema:\n"
        '{ "tier": "tier1_elite" | "tier2_mid" | "tier3_regular" | "nontraditional" | "unknown" }\n\n'
        f"Resume:\n{sample['input']}\nJSON:\n"
    )
    
    response = pipe(
        prompt,
        max_new_tokens=200,
        temperature=0.0,
        do_sample=False,
        return_full_text=False,
    )[0]["generated_text"]
    
    # Extract tier
    import re
    tier_match = re.search(r'"tier"\s*:\s*"([^"]+)"', response)
    predicted = tier_match.group(1) if tier_match else "unknown"
    
    match = "✅" if predicted == ground_truth else "❌"
    if predicted == ground_truth:
        correct += 1
    
    print(f"\nTraining Sample {i}:")
    print(f"  Expected: {ground_truth}")
    print(f"  Predicted: {predicted} {match}")
    print(f"  Input preview: {sample['input'][:150]}...")

print("\n" + "=" * 80)
print("📊 TRAINING DATA MEMORIZATION")
print("=" * 80)
print(f"Correct on training samples: {correct}/{len([s for s in train_samples if s['output'].get('tier')])}")

if correct == 0:
    print("\n❌ CRITICAL: Model can't even predict training examples correctly!")
    print("\nPossible causes:")
    print("1. LoRA weights didn't load properly (see warning about unexpected keys)")
    print("2. Model wasn't trained long enough (check training loss)")
    print("3. Learning rate too high/low")
    print("4. Wrong target modules in LoRA config")
    print("5. Training script had bugs")
    print("\n💡 Solutions:")
    print("- Check training logs for final loss value")
    print("- Try loading base model without LoRA to compare")
    print("- Retrain with verified LoRA config")
    print("- Increase training epochs (try 5-10 epochs)")
elif correct < len(train_samples) * 0.8:
    print("\n⚠️ Model memorization is poor (<80% on training data)")
    print("This suggests underfitting - train longer or adjust hyperparameters")
else:
    print("\n✅ Model memorizes training data well")
    print("The validation performance issue is likely:")
    print("- Distribution shift between train and val")
    print("- Need more diverse training data")
    print("- Overfitting to training set")

print("\n" + "=" * 80)
print("🔍 NEXT STEPS")
print("=" * 80)
print("""
1. Check your training script logs:
   - What was the final training loss?
   - Did loss decrease over epochs?
   - Were there any errors/warnings?

2. Verify LoRA configuration:
   - Target modules should include attention layers
   - Rank (r) should be 8-32 for this task
   - Alpha should be 16-64

3. If training looks good but results are bad:
   - Data quality issue (check if training data is correctly labeled)
   - Need more training data
   - Try different prompt format during training

4. Try training without LoRA (full fine-tune) as baseline
""")