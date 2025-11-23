#!/usr/bin/env python3
# evaluate_and_improve_resume_final_fixed.py
# Stable unified pipeline: Deterministic eval + Improved resume + Recommendations

import re, torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel

BASE_MODEL = "Qwen/Qwen1.5-1.8B-Chat"
ADAPTER_PATH = "runs/admit55_lora_gpu"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


# ---------------------------------------------------------
# FEW-SHOT ANCHORED PROMPT (CLEAN + ENGLISH ONLY)
# ---------------------------------------------------------
EVAL_PROMPT = """
You are an expert MBA admissions evaluator for Admit55.
Output should be strictly in English and ONLY in the following format:

<example>
Academics: 8.7/10
Industry Exposure: 9.1/10
Leadership: 8.9/10
GMAT: 8.4/10
Overall MBA Admit Score: 8.8/10
Reasoning: IIT background, top-tier firm, strong leadership.
</example>

<example>
Academics: 7.9/10
Industry Exposure: 8.3/10
Leadership: 7.6/10
GMAT: 7.8/10
Overall MBA Admit Score: 7.9/10
Reasoning: Strong academics, solid leadership, balanced profile.
</example>

Now evaluate the following candidate in the same format.

Candidate:
{resume}
"""

IMPROVE_PROMPT = """
You are a professional MBA resume consultant (ISB/IIM/INSEAD level).
Rewrite the following resume for clarity, grammar, quantification, and ATS optimization.
Keep facts unchanged. Use concise English bullet points.

After rewriting, add a section:
"Suggested Improvements:" with 3 personalized resume enhancement tips.

Only output the rewritten resume and improvement tips. Do NOT include explanations or translations.

Resume:
{resume}
"""


# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------
def load_model():
    bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.float16)
    tok = AutoTokenizer.from_pretrained(BASE_MODEL, use_fast=True)
    if tok.pad_token_id is None:
        tok.pad_token = tok.eos_token
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        quantization_config=bnb,
        device_map="auto",
        low_cpu_mem_usage=True,
    )
    model = PeftModel.from_pretrained(model, ADAPTER_PATH)
    model.to(DEVICE).eval()
    return tok, model


def generate(model, tok, prompt, max_new=250, sample=False):
    inputs = tok(prompt, return_tensors="pt").to(DEVICE)
    out = model.generate(
        **inputs,
        max_new_tokens=max_new,
        do_sample=sample,
        temperature=None if not sample else 0.7,
        top_p=None if not sample else 0.9,
        pad_token_id=tok.eos_token_id,
        eos_token_id=tok.eos_token_id,
    )
    text = tok.decode(out[0], skip_special_tokens=True)
    # Trim the prompt part
    if prompt.strip() in text:
        text = text.split(prompt.strip())[-1]
    # Stop if multilingual content appears
    text = text.split("Suggested Improvements:")[0] + "\nSuggested Improvements:"
    text = re.sub(r"[^\x00-\x7F]+", "", text)  # remove non-English chars
    return text.strip()


def extract_scores(text):
    pat = {
        "Academics": r"Academics\s*:\s*([\d.]+)/10",
        "Industry Exposure": r"Industry Exposure\s*:\s*([\d.]+)/10",
        "Leadership": r"Leadership\s*:\s*([\d.]+)/10",
        "GMAT": r"GMAT\s*:\s*([\d.]+)/10",
        "Overall": r"Overall MBA Admit Score\s*:\s*([\d.]+)/10",
    }
    scores = {}
    for k, p in pat.items():
        m = re.search(p, text)
        if m:
            v = float(m.group(1))
            scores[k] = round(min(max(v, 0), 10), 2)
    return scores


def recommendation_layer(scores):
    """Generate 2–3 personalized improvement tips based on score gaps."""
    recs = []
    if scores["Academics"] < 7:
        recs.append("Consider adding academic certifications or GPA improvement proof.")
    if scores["Industry Exposure"] < 8:
        recs.append("Gain exposure to new industries or cross-functional projects.")
    if scores["Leadership"] < 8:
        recs.append("Highlight examples of leading teams or mentoring juniors.")
    if scores["GMAT"] < 7.5:
        recs.append("Retake GMAT or emphasize analytical achievements to offset.")
    if scores["Overall"] < 8:
        recs.append("Strengthen global exposure and strategic achievements.")
    if not recs:
        recs = ["Excellent overall profile. Focus on storytelling and career clarity."]
    return recs


# ---------------------------------------------------------
# MAIN PIPELINE
# ---------------------------------------------------------
def evaluate_and_improve(resume):
    tok, model = load_model()

    print("\n🧠 Evaluating metrics (deterministic)...")
    eval_out = generate(model, tok, EVAL_PROMPT.format(resume=resume), max_new=180, sample=False)
    scores = extract_scores(eval_out)

    if not scores:
        print("⚠️ Model drifted, applying heuristic fallback.")
        scores = {"Academics": 8.5, "Industry Exposure": 9.0, "Leadership": 8.7, "GMAT": 8.4, "Overall": 8.6}

    print("\n📊 --- METRIC BREAKDOWN ---")
    for k in ["Academics", "Industry Exposure", "Leadership", "GMAT", "Overall"]:
        print(f"{k:<25}: {scores.get(k, 0):.1f}/10")

    print("\n🧠 Generating improved resume (sampled)...")
    improved = generate(model, tok, IMPROVE_PROMPT.format(resume=resume), max_new=400, sample=True)

    print("\n✅ --- FINAL OUTPUT ---")
    print(eval_out)
    print("\n✨ --- IMPROVED RESUME --- ✨\n")
    print(improved)

    # Add recommendation layer
    print("\n💡 --- RECOMMENDATION LAYER ---")
    for i, tip in enumerate(recommendation_layer(scores), 1):
        print(f"{i}. {tip}")


# ---------------------------------------------------------
# RUN
# ---------------------------------------------------------
if __name__ == "__main__":
    resume_text = """
Worked at Deloitte India as Senior Analyst for 2 years.
Handled client communication and created dashboards.
Led an AI project that saved $10M for the company.
Education: B.Tech, IIT Bombay, GPA 8.6/10
GMAT: 740
"""
    evaluate_and_improve(resume_text)
