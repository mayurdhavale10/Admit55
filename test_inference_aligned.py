from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch, json

model_id = "data/mba/fine_tune/artifacts/lora/qwen2_5_1.5b_REAL_aligned"

print("🔄 Loading model...")
pipe = pipeline(
    "text-generation",
    model=model_id,
    tokenizer=model_id,
    torch_dtype=torch.float16,
    device_map="auto"
)
print("✅ Model loaded successfully!")

prompt = """You are a professional resume normalizer.
Output ONLY valid JSON following this schema:
{
  "tier": "tier2_mid",
  "career": {"total_years": 5, "current_role": "Analyst", "role_level": "associate"},
  "industry": {"sector": "Consulting", "company_tier": 2},
  "signals": {"leadership": true, "impact": true, "international": false, "tools": ["Excel", "SQL"]}
}

Resume:
Analyst with ~5 years' experience in Consulting; educated at NMIMS Mumbai; focus: Strategy.
JSON:
"""

print("⚙️ Generating...")
out = pipe(prompt, max_new_tokens=400, temperature=0.1, do_sample=False)[0]['generated_text']
print("\n================ RAW OUTPUT ================\n")
print(out)

# Try JSON extraction
try:
    start = out.index("{")
    end = out.rindex("}") + 1
    parsed = json.loads(out[start:end])
    print("\n✅ Parsed JSON:")
    print(json.dumps(parsed, indent=2, ensure_ascii=False))
except Exception as e:
    print("\n⚠️ Could not parse JSON cleanly:", e)
