#!/usr/bin/env python3
# resume_improver.py — Admit55 Resume Correction Module

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel

# ✅ CONFIG
BASE_MODEL = "Qwen/Qwen1.5-1.8B-Chat"
ADAPTER_PATH = "runs/admit55_lora_gpu"  # your LoRA checkpoint
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ✅ PROMPT TEMPLATE
PROMPT_TEMPLATE = """
You are a professional MBA resume consultant specializing in top B-school admissions (ISB, IIM, INSEAD).
Your task is to rewrite and correct this resume text for clarity, grammar, impact, and ATS optimization — 
without changing factual content. Use strong action verbs, quantify impact where possible, and structure it cleanly.

Also, after the rewritten resume, provide a short section titled:
"Suggested Improvements" listing 3–4 specific tips to strengthen this resume further.

Here is the candidate's resume text:

"{resume}"

Now rewrite and improve it below:
"""

# ✅ LOAD MODEL + TOKENIZER
def load_lora_model():
    print("🚀 Loading base model and LoRA adapter...")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    )

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, use_fast=True)
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        device_map="auto",
        quantization_config=bnb_config,
        low_cpu_mem_usage=True,
    )
    model = PeftModel.from_pretrained(model, ADAPTER_PATH)
    model = model.to(DEVICE)
    print(f"✅ Model loaded successfully on {DEVICE.upper()}")
    return tokenizer, model


# ✅ GENERATE IMPROVED RESUME
def improve_resume(resume_text, max_new_tokens=600):
    tokenizer, model = load_lora_model()
    prompt = PROMPT_TEMPLATE.format(resume=resume_text)

    inputs = tokenizer(prompt, return_tensors="pt").to(DEVICE)

    print("\n🧠 Generating improved resume...\n")

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )

    result = tokenizer.decode(output[0], skip_special_tokens=True)
    print("\n--- ✨ IMPROVED RESUME OUTPUT ✨ ---\n")
    print(result)
    print("\n----------------------------------\n")
    return result


# ✅ MAIN EXECUTION
if __name__ == "__main__":
    sample_resume = """
Worked at Deloitte India as Senior Analyst for 2 years.
Handled client communication and created dashboards.
Led an AI project that saved $10M for the company.
"""
    improve_resume(sample_resume)
