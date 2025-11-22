import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import json
import re

# ===============================
# CONFIG
# ===============================
BASE = "Qwen/Qwen2.5-1.5B-Instruct"
LORA = "data/mba/fine_tune/artifacts/lora/qwen2_5_1.5b_REAL"

# 🔥 STRONG INSTRUCTION: enforce JSON-only schema output
INSTRUCTION = (
    "You are a professional resume normalizer. "
    "You must return a valid JSON object following this exact schema. "
    "Do NOT add explanations, markdown, or text outside JSON. "
    "The JSON must be fully parseable.\n\n"
    "Schema example:\n"
    "{\n"
    '  \"tier\": \"tier2_mid\",\n'
    '  \"career\": {\n'
    '     \"total_years\": 5,\n'
    '     \"current_role\": \"Analyst\",\n'
    '     \"role_level\": \"associate\"\n'
    "  },\n"
    '  \"industry\": {\n'
    '     \"sector\": \"Consulting\",\n'
    '     \"company_tier\": 2\n'
    "  },\n"
    '  \"signals\": {\n'
    '     \"leadership\": true,\n'
    '     \"impact\": true,\n'
    '     \"international\": false,\n'
    '     \"tools\": [\"Excel\", \"SQL\"]\n'
    "  }\n"
    "}\n"
)

# 🧾 SAMPLE RESUME
TEST_RESUME = """CANDIDATE: Candidate-T2-0480
EMAIL: hidden+t2_480@example.com

Career Summary
Analyst with ~5 years' experience in Consulting; educated at NMIMS Mumbai; focus: Strategy.
Professional Experience
Education
— undefined —
"""

# ===============================
# LOAD MODEL
# ===============================
print("🔄 Loading model...")
tokenizer = AutoTokenizer.from_pretrained(BASE, trust_remote_code=True)

model = AutoModelForCausalLM.from_pretrained(
    BASE,
    trust_remote_code=True,
    device_map="auto",
    torch_dtype=torch.bfloat16,
    low_cpu_mem_usage=True,
)

model = PeftModel.from_pretrained(model, LORA)
model.eval()
print("✅ Model + LoRA loaded successfully!\n")

# ===============================
# BUILD PROMPT (MIRRORS TRAINING PATTERN)
# ===============================
prompt = (
    f"Instruction: {INSTRUCTION}\n\n"
    f"Input Resume:\n{TEST_RESUME}\n\n"
    f"Output (valid JSON only):"
)

inputs = tokenizer(prompt, return_tensors="pt").to("cuda")

# ===============================
# GENERATE OUTPUT
# ===============================
print("⚙️ Generating structured JSON output...\n")
with torch.no_grad():
    output = model.generate(
        **inputs,
        max_new_tokens=512,
        temperature=0.1,
        do_sample=False,
        top_p=0.9,
        repetition_penalty=1.05,
        bos_token_id=tokenizer.bos_token_id,
        eos_token_id=tokenizer.eos_token_id,
        pad_token_id=tokenizer.pad_token_id,
    )

decoded = tokenizer.decode(output[0], skip_special_tokens=True)

print("=" * 80)
print("RAW MODEL OUTPUT:")
print("=" * 80)
print(decoded)
print("=" * 80 + "\n")

# ===============================
# PARSE JSON FROM OUTPUT
# ===============================
print("🧩 Attempting to extract JSON...\n")

# Extract first {...} block safely
match = re.search(r"\{(?:[^{}]|(?:\{[^{}]*\}))*\}", decoded, re.DOTALL)
if match:
    json_str = match.group(0)
    try:
        parsed = json.loads(json_str)
        print("✅ Parsed JSON Output:\n")
        print(json.dumps(parsed, indent=2))
    except Exception as e:
        print(f"⚠️ Could not parse JSON: {e}\n")
        print("Raw segment:\n", json_str)
else:
    print("❌ No JSON detected in model output.")
