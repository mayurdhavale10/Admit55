import torch
import json
import re
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

# ✅ Path to your aligned LoRA model
MODEL_PATH = "data/mba/fine_tune/artifacts/lora/qwen2_5_1.5b_REAL_aligned"

# ✅ Use GPU only (strict)
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🧠 Using device: {device}")

# ✅ Load model + tokenizer
print("🔄 Loading model...")
pipe = pipeline(
    "text-generation",
    model=MODEL_PATH,
    tokenizer=MODEL_PATH,
    torch_dtype=torch.float16,
    device_map="auto"
)

print("✅ Model loaded successfully!\n")

# ✅ Test prompt
prompt = """You are a professional resume normalizer.
Output ONLY valid JSON following this schema:
{
  "tier": "tier2_mid",
  "career": {"total_years": 5, "current_role": "Analyst"},
  "industry": {"sector": "Consulting", "company_tier": 2},
  "signals": {"leadership": true, "impact": true, "international": false}
}

Resume:
Analyst with 5 years' experience in Consulting; educated at NMIMS Mumbai; focus: Strategy.
JSON:
"""

print("⚙️ Generating response...\n")
out = pipe(
    prompt,
    max_new_tokens=400,
    temperature=0.1,
    do_sample=False
)[0]["generated_text"]

print("📜 RAW MODEL OUTPUT:\n")
print(out)
print("\n" + "=" * 80 + "\n")

# ✅ Try to extract JSON
match = re.search(r"\{[\s\S]*\}", out)
if match:
    raw_json = match.group(0)
    try:
        parsed = json.loads(raw_json)
        print("✅ JSON Parsed Successfully!\n")
        print(json.dumps(parsed, indent=2))
    except Exception as e:
        print(f"❌ JSON Parse Failed! Error: {e}")
        print("\nExtracted segment:\n", raw_json)
else:
    print("❌ No JSON detected in the model output!")
