#!/usr/bin/env python3
# evaluate_lora_model.py
# Evaluate fine-tuned LoRA model for Admit55 with reasoning + metric breakdown

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import re

# -------------------- CONFIG --------------------
base_model = "Qwen/Qwen1.5-1.8B-Chat"
adapter_dir = "runs/admit55_lora_gpu"
device = "cuda" if torch.cuda.is_available() else "cpu"

# -------------------- LOAD MODEL --------------------
print("🚀 Loading base model and LoRA adapter...")

model = AutoModelForCausalLM.from_pretrained(
    base_model,
    device_map="auto" if torch.cuda.is_available() else None,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    low_cpu_mem_usage=True,
)

model = PeftModel.from_pretrained(model, adapter_dir)
tokenizer = AutoTokenizer.from_pretrained(base_model)

model.to(device)
model.eval()

print(f"🔥 Using device: {device.upper()}")
print("✅ Model & adapter loaded successfully on CUDA" if device == "cuda" else "✅ Model loaded on CPU")

# -------------------- PROMPT --------------------
prompt = """You are an MBA admissions evaluator for Admit55.

Your task:
1️⃣ Rate the candidate on these metrics (0–10)
2️⃣ Provide reasoning for each score
3️⃣ Suggest specific, actionable recommendations

Candidate:
- Experience: Worked at Deloitte India as Senior Analyst (2 years)
- Education: B.Tech IIT Bombay, GPA 8.6/10
- GMAT: 740
- Achievements: Led cross-functional AI project saving 10M USD annually

Output format:
Academics: <score>/10
Industry Exposure: <score>/10
Leadership: <score>/10
GMAT: <score>/10
Overall MBA Admit Score: <score>/10
Reasoning: <why these scores make sense>
Recommendations: <actionable improvement tips>
"""


# -------------------- GENERATION --------------------
print("\n🧠 Generating model response...\n")

inputs = tokenizer(prompt, return_tensors="pt").to(device)

with torch.no_grad():
    output = model.generate(
        **inputs,
        max_new_tokens=400,  # ensure full reasoning
        temperature=0.7,
        top_p=0.9
    )

response = tokenizer.decode(output[0], skip_special_tokens=True)
print("\n--- Model Output ---\n")
print(response)

# -------------------- SMART METRIC EXTRACTION --------------------
metrics = {
    "Academics": None,
    "Industry Exposure": None,
    "Leadership": None,
    "GMAT": None,
    "Overall MBA Admit Score": None,
}

for key in metrics.keys():
    pattern = rf"{key}[^0-9]*?(\d+(\.\d+)?)"
    match = re.search(pattern, response, re.IGNORECASE)
    if match:
        metrics[key] = match.group(1)

# --- Normalize absurdly high scores ---
for k, v in metrics.items():
    if v:
        try:
            val = float(v)
            if val > 10:
                metrics[k] = str(round(val / 100, 2))  # Convert 740 -> 7.4
        except:
            pass

# -------------------- OUTPUT --------------------
print("\n📊 --- Metric Breakdown ---")
for key, val in metrics.items():
    print(f"{key:25}: {val or 'N/A'} / 10")

final_score = metrics.get("Overall MBA Admit Score", "N/A")
print(f"\n🎯 Final Predicted MBA Admit Score: {final_score}/10")
