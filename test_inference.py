from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

# ✅ Path to your fine-tuned LoRA model
model_id = "data/mba/fine_tune/artifacts/lora/qwen2_5_1.5b_REAL"

print("🔄 Loading model...")
pipe = pipeline("text-generation", model=model_id, tokenizer=model_id)
print("✅ Model loaded successfully!")

# 🧾 Example test resume
prompt = """You are a professional resume normalizer. 
Output ONLY a valid JSON object following this schema:

{
  "tier": "tier2_mid",
  "career": {
     "total_years": 5,
     "current_role": "Analyst",
     "role_level": "associate"
  },
  "industry": {
     "sector": "Consulting",
     "company_tier": 2
  },
  "signals": {
     "leadership": true,
     "impact": true,
     "international": false,
     "tools": ["Excel", "SQL"]
  }
}

Now label this resume into categories:
Resume:
Analyst with ~5 years' experience in Consulting; educated at NMIMS Mumbai; focus: Strategy.
JSON:
"""

# ⚙️ Generate structured output
print("\n⚙️ Generating structured JSON output...\n")
result = pipe(prompt, max_new_tokens=400, do_sample=False)[0]["generated_text"]

print("=" * 80)
print("RAW MODEL OUTPUT:\n")
print(result)
print("=" * 80)
