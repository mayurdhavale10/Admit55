from peft import PeftModel
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
import json
import re
import torch

# Load your trained model
base_model = "Qwen/Qwen2.5-1.5B-Instruct"
adapter_path = "data/mba/fine_tune/artifacts/lora/qwen2_5_1.5b_REAL"

print("Loading model...")
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.bfloat16
)
tokenizer = AutoTokenizer.from_pretrained(base_model)
model = AutoModelForCausalLM.from_pretrained(
    base_model, 
    device_map="auto", 
    quantization_config=bnb_config
)
model = PeftModel.from_pretrained(model, adapter_path)
print("Model loaded! ✅\n")

# Load a real validation example
with open("data/mba/datasets/latest/val.jsonl", "r", encoding="utf-8") as f:
    test_data = json.loads(f.readline())

resume_text = test_data["input"]
expected_output = test_data["output"]

print("="*80)
print("TEST RESUME (first 300 chars):")
print("="*80)
print(resume_text[:300])
print("...\n")

# Create prompt using chat template (same as training)
messages = [
    {
        "role": "system",
        "content": "You are a resume normalizer. Output ONLY a JSON object that matches the NormalizedProfile schema. No extra text, no explanations, no markdown fences. If a field is unknown, use null or an empty string."
    },
    {
        "role": "user",
        "content": f"Resume:\n{resume_text}\n\nJSON:"
    }
]

prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)

print("="*80)
print("GENERATING OUTPUT...")
print("="*80)

inputs = tokenizer(prompt, return_tensors="pt", max_length=1024, truncation=True).to("cuda")
outputs = model.generate(
    **inputs, 
    max_new_tokens=300,
    pad_token_id=tokenizer.eos_token_id,
    eos_token_id=tokenizer.eos_token_id
)

result = tokenizer.decode(outputs[0], skip_special_tokens=True)

print("\nMODEL OUTPUT:")
print("="*80)
print(result)
print("="*80)

# Try to extract JSON
print("\nJSON EXTRACTION:")
print("="*80)
try:
    json_match = re.search(r'\{.*\}', result, re.DOTALL)
    if json_match:
        extracted_json = json_match.group()
        parsed = json.loads(extracted_json)
        print("✅ Valid JSON extracted!")
        print(json.dumps(parsed, indent=2))
    else:
        print("❌ No JSON pattern found in output")
except json.JSONDecodeError as e:
    print(f"❌ JSON parsing failed: {e}")
    print("\nRaw extracted text:")
    if json_match:
        print(json_match.group()[:500])

print("\n" + "="*80)
print("EXPECTED OUTPUT:")
print("="*80)
print(json.dumps(expected_output, indent=2))
print("="*80)