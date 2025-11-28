#!/usr/bin/env python3
"""
mba_hybrid_pipeline.py v3.2 - FIXED
Hybrid pipeline: HuggingFace Inference API (primary) + Groq verifier/re-writer + Local LoRA (optional)
FIXED: Made resume improvement optional (on-demand via /rewrite endpoint)
"""
import os
import json
import sys
import time
import re
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()
import requests

# -------------------------------------------------------
# PDF SUPPORT
# -------------------------------------------------------
try:
    import PyPDF2
    PDF_SUPPORT = True
    print("[PDF] PyPDF2 loaded successfully", file=sys.stderr)
except ImportError:
    PDF_SUPPORT = False
    print("[PDF] PyPDF2 not installed. PDF support disabled. Run: pip install PyPDF2", file=sys.stderr)

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF file using PyPDF2."""
    if not PDF_SUPPORT:
        raise RuntimeError("PyPDF2 not installed. Run: pip install PyPDF2")
    
    print(f"[PDF] Extracting text from: {pdf_path}", file=sys.stderr)
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ''
            num_pages = len(reader.pages)
            print(f"[PDF] Processing {num_pages} pages...", file=sys.stderr)
            
            for page_num, page in enumerate(reader.pages, 1):
                page_text = page.extract_text()
                if page_text:
                    text += page_text + '\n\n'
                print(f"[PDF] Page {page_num}/{num_pages} extracted", file=sys.stderr)
            
            if not text.strip():
                raise RuntimeError("No text extracted from PDF. Document may be image-based or scanned.")
            
            print(f"[PDF] [OK] Extracted {len(text)} characters total", file=sys.stderr)
            return text.strip()
    except Exception as e:
        print(f"[PDF] [FAIL] Extraction error: {e}", file=sys.stderr)
        raise RuntimeError(f"Failed to extract PDF: {e}")

# -------------------------------------------------------
# ENV - INFERENCE METHOD CONFIGURATION
# -------------------------------------------------------
USE_HUGGINGFACE = os.environ.get("USE_HUGGINGFACE", "false").lower() == "true"
USE_LOCAL_LORA = os.environ.get("USE_LOCAL_LORA", "false").lower() == "true"

# HuggingFace Configuration
HF_API_KEY = os.environ.get("HF_API_KEY")
HF_MODEL = os.environ.get("HF_MODEL", "Mayururur/admit55-llama32-3b-lora")

# Local LoRA Configuration
LORA_ADAPTER_DIR = os.environ.get("LORA_ADAPTER_DIR", "lora-llama3")
LORA_BASE_MODEL = os.environ.get("LORA_BASE_MODEL", "meta-llama/Llama-3.2-3B-Instruct")

# Groq Configuration (for verification and improvement)
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_API_URL = os.environ.get("GROQ_API_URL", "https://api.groq.com/openai/v1")
GROQ_MODEL = "llama-3.1-8b-instant"

_local_model = None
_local_tokenizer = None

# -------------------------------------------------------
# HUGGINGFACE INFERENCE SUPPORT
# -------------------------------------------------------
HF_AVAILABLE = False
if USE_HUGGINGFACE:
    try:
        from hf_inference import call_hf_inference, test_hf_connection, HuggingFaceInferenceError
        HF_AVAILABLE = True
        print("[HF] ✓ HuggingFace inference module loaded", file=sys.stderr)
        print(f"[HF] Model: {HF_MODEL}", file=sys.stderr)
    except ImportError as e:
        print(f"[HF] ✗ Failed to import hf_inference module: {e}", file=sys.stderr)
        print("[HF] Make sure hf_inference.py is in the same directory", file=sys.stderr)
        HF_AVAILABLE = False
else:
    print("[HF] HuggingFace inference disabled (USE_HUGGINGFACE=false)", file=sys.stderr)

# -------------------------------------------------------
# JSON Extraction Utility (ENHANCED)
# -------------------------------------------------------
def extract_first_json(text: str):
    """Extract and parse the first valid JSON object from text with robust error handling."""
    if not isinstance(text, str):
        text = str(text)
    
    # Remove markdown code fences and common prefixes
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()
    
    # Remove common text prefixes that might appear before JSON
    prefixes_to_remove = [
        "Here is the JSON:",
        "Here's the JSON:",
        "JSON output:",
        "Result:",
        "Output:",
    ]
    for prefix in prefixes_to_remove:
        if text.lower().startswith(prefix.lower()):
            text = text[len(prefix):].strip()
    
    # Try to find JSON object boundaries
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in text")
    
    # Find matching closing brace by counting braces
    brace_count = 0
    end = -1
    for i in range(start, len(text)):
        if text[i] == '{':
            brace_count += 1
        elif text[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                end = i
                break
    
    if end == -1:
        # Fallback: try rfind
        end = text.rfind("}")
        if end == -1 or end <= start:
            raise ValueError("No complete JSON object found")
    
    # Extract potential JSON
    json_str = text[start:end+1]
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        # Last resort: try to fix common JSON issues
        json_str = json_str.replace("'", '"')  # Single to double quotes
        json_str = re.sub(r',\s*}', '}', json_str)  # Trailing commas
        json_str = re.sub(r',\s*]', ']', json_str)  # Trailing commas in arrays
        try:
            return json.loads(json_str)
        except:
            raise ValueError(f"Failed to parse JSON after cleanup: {e}")

# -------------------------------------------------------
# GROQ CHAT API (ENHANCED ERROR HANDLING)
# -------------------------------------------------------
class GroqError(Exception):
    pass

def call_groq(prompt: str, max_tokens: int = 300, retry_count: int = 2, timeout: int = 40) -> str:
    """Call Groq API with error handling and retry logic."""
    if not GROQ_API_KEY:
        raise GroqError("Missing GROQ_API_KEY")
    
    url = f"{GROQ_API_URL}/chat/completions"
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": 0.1
    }
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    last_error = None
    for attempt in range(retry_count):
        try:
            r = requests.post(url, json=payload, headers=headers, timeout=timeout)
            if r.status_code != 200:
                last_error = f"HTTP {r.status_code}: {r.text}"
                if attempt < retry_count - 1:
                    time.sleep(1)
                    continue
                raise GroqError(last_error)
            
            data = r.json()
            if "choices" not in data or len(data["choices"]) == 0:
                last_error = f"Invalid response format: {data}"
                if attempt < retry_count - 1:
                    time.sleep(1)
                    continue
                raise GroqError(last_error)
            
            return data["choices"][0]["message"]["content"]
            
        except requests.exceptions.Timeout:
            last_error = "Request timed out"
            if attempt < retry_count - 1:
                time.sleep(2)
                continue
        except requests.exceptions.RequestException as e:
            last_error = f"Request failed: {e}"
            if attempt < retry_count - 1:
                time.sleep(1)
                continue
    
    raise GroqError(last_error or "All retry attempts failed")

# -------------------------------------------------------
# LOCAL LORA LOADING (IMPROVED)
# -------------------------------------------------------
def try_load_local_lora():
    """Load local LoRA model with proper error handling."""
    global _local_model, _local_tokenizer
    
    if not USE_LOCAL_LORA:
        print("[local lora] disabled", file=sys.stderr)
        return False
    
    if not os.path.isdir(LORA_ADAPTER_DIR):
        print(f"[local lora] adapter dir missing: {LORA_ADAPTER_DIR}", file=sys.stderr)
        return False
    
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
        from peft import PeftModel
        
        bnb = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
        )
        
        print(f"[local lora] Loading tokenizer from {LORA_BASE_MODEL}...", file=sys.stderr)
        _local_tokenizer = AutoTokenizer.from_pretrained(LORA_BASE_MODEL, use_fast=True)
        
        print(f"[local lora] Loading base model...", file=sys.stderr)
        base = AutoModelForCausalLM.from_pretrained(
            LORA_BASE_MODEL,
            quantization_config=bnb,
            device_map="auto",
            low_cpu_mem_usage=True
        )
        
        print(f"[local lora] Loading LoRA adapter from {LORA_ADAPTER_DIR}...", file=sys.stderr)
        _local_model = PeftModel.from_pretrained(base, LORA_ADAPTER_DIR)
        _local_model.eval()
        
        if _local_tokenizer.pad_token is None:
            _local_tokenizer.pad_token = _local_tokenizer.eos_token
        
        print("[local lora] [OK] Loaded successfully.", file=sys.stderr)
        return True
    except Exception as e:
        print(f"[local lora] [FAIL] Failed to load: {e}", file=sys.stderr)
        _local_model = None
        _local_tokenizer = None
        return False

def predict_local(prompt: str, max_new_tokens=250) -> str:
    """Generate prediction using local LoRA model."""
    global _local_model, _local_tokenizer
    
    if _local_model is None or _local_tokenizer is None:
        raise RuntimeError("Local model not loaded")
    
    import torch
    import warnings
    
    inputs = _local_tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)
    inputs = {k: v.to(_local_model.device) for k, v in inputs.items()}
    
    with torch.no_grad():
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=UserWarning, module="transformers")
            out = _local_model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False,
                temperature=None,
                top_p=None,
                pad_token_id=_local_tokenizer.pad_token_id
            )
    
    full_output = _local_tokenizer.decode(out[0], skip_special_tokens=True)
    if full_output.startswith(prompt):
        full_output = full_output[len(prompt):].strip()
    
    return full_output

# -------------------------------------------------------
# SCORE NORMALIZATION UTILITY
# -------------------------------------------------------
def normalize_scores_to_0_10(scores_dict: dict) -> dict:
    """Normalize scores to 0-10 range. If score > 10, assume it's 0-100 and scale down."""
    out = {}
    for k, v in scores_dict.items():
        try:
            n = float(v)
        except:
            n = 5.0
        
        # If model returned 0-100, convert to 0-10
        if n > 10:
            n = max(0, min(10, n / 10.0))
        else:
            n = max(0, min(10, n))
        
        out[k] = round(n, 2)
    return out

# -------------------------------------------------------
# PROMPTS (UPDATED WITH RICH STRENGTHS/IMPROVEMENTS)
# -------------------------------------------------------
SCORER_PROMPT = """You are an MBA admissions scorer. Analyze the resume and return ONLY a valid JSON object with these exact keys:

{
  "academics": <score>,
  "test_readiness": <score>,
  "leadership": <score>,
  "extracurriculars": <score>,
  "international": <score>,
  "work_impact": <score>,
  "impact": <score>,
  "industry": <score>
}

Scoring guidelines (all scores 0-10):
- academics: Academic achievements, GPA, coursework quality
- test_readiness: Quantitative/analytical skills, potential test performance
- leadership: Team leadership, initiative ownership, people management
- extracurriculars: Non-work activities, volunteering, community involvement
- international: Global experience, cross-cultural work, languages
- work_impact: Career progression, quantified results, business outcomes
- impact: Overall measurable impact and achievements
- industry: Relevant industry experience and domain expertise

Resume:
{resume}

CRITICAL: Return ONLY the JSON object with scores 0-10. No explanations, no markdown, no extra text. Just the raw JSON."""

STRENGTHS_PROMPT = """You are an MBA admissions expert. Analyze this resume and extract:

1. Top 3-5 STRENGTHS with:
   - title: Compelling 4-8 word headline (e.g., "Exceptional Entrepreneurial Drive & Impact")
   - score: 0-100 rating
   - summary: ONE sentence with specific facts/numbers from resume

2. Top 3-5 IMPROVEMENTS/GAPS with:
   - area: Short label (e.g., "Standardized Test Score")
   - score: 0-100 current rating
   - suggestion: ONE actionable sentence

3. 3-6 PRIORITIZED RECOMMENDATIONS with:
   - id: Unique identifier (e.g., "rec_1")
   - type: One of [skill, test, extracurricular, career, resume, networking, other]
   - area: Short label
   - priority: One of [high, medium, low]
   - action: Clear, actionable step(s) the candidate should take
   - estimated_impact: One sentence explaining the benefit
   - score: 0-100 (optional, represents current state if applicable)

Return ONLY valid JSON in this EXACT format:
{
  "strengths": [
    {
      "title": "...",
      "score": 90,
      "summary": "..."
    }
  ],
  "improvements": [
    {
      "area": "...",
      "score": 40,
      "suggestion": "..."
    }
  ],
  "recommendations": [
    {
      "id": "rec_1",
      "type": "test",
      "area": "GMAT Preparation",
      "priority": "high",
      "action": "...",
      "estimated_impact": "...",
      "score": 30
    }
  ]
}

Resume:
{resume}

CRITICAL: Return ONLY the JSON object with scores 0-100 for strengths/improvements/recommendations. No markdown, no preamble, just raw JSON."""

VERIFY_PROMPT = """You are a verification agent. Check if the scores are reasonable given the resume.

Return ONLY a valid JSON object with this exact format:
{
  "ok": true,
  "explanation": "brief explanation"
}

Resume:
{resume}

Scores:
{scores}

CRITICAL: Return ONLY the JSON object. No explanations, no markdown, no extra text. Just the raw JSON with "ok" as boolean and "explanation" as string."""

IMPROVE_PROMPT = """You are a professional resume writer specializing in MBA applications. Improve this resume to be:
- ATS-friendly with clear structure
- Leadership and impact focused
- Better formatted with bullet points
- Professional tone

CRITICAL RULES:
1. Use ONLY the facts and numbers provided in the original resume
2. DO NOT add any new metrics, percentages, or achievements
3. DO NOT invent job titles, companies, or dates
4. DO NOT add education, certifications, or contact information unless present in original
5. Reorganize and reword existing content for clarity and impact

Original Resume:
{resume}

Return ONLY the improved resume text based strictly on the original content. No explanations, no preamble, just the improved resume."""

# -------------------------------------------------------
# Pipeline Steps (ALL LOGS TO STDERR) - UPDATED WITH HF
# -------------------------------------------------------
def score_resume(resume_text: str) -> dict:
    """Score resume using HuggingFace (primary), local LoRA (secondary), or Groq (fallback)."""
    prompt = SCORER_PROMPT.replace("{resume}", resume_text)
    
    # PRIORITY 1: Try HuggingFace Inference API first
    if USE_HUGGINGFACE and HF_AVAILABLE:
        try:
            print("[score] Using HuggingFace Inference API (primary)...", file=sys.stderr)
            raw = call_hf_inference(prompt, max_new_tokens=250, temperature=0.1)
            print(f"[score] Raw output: {raw[:200]}...", file=sys.stderr)
            
            scores = extract_first_json(raw)
            scores = normalize_scores_to_0_10(scores)
            
            if validate_scores(scores):
                print(f"[score] ✓ HuggingFace succeeded", file=sys.stderr)
                return scores
            else:
                print(f"[score] ✗ Invalid scores from HuggingFace, trying next method", file=sys.stderr)
        except HuggingFaceInferenceError as e:
            print(f"[score] ✗ HuggingFace failed: {e}", file=sys.stderr)
        except Exception as e:
            print(f"[score] ✗ HuggingFace unexpected error: {e}", file=sys.stderr)
    
    # PRIORITY 2: Try local LoRA second
    if USE_LOCAL_LORA and _local_model is not None:
        try:
            print("[score] Using local LoRA model (secondary)...", file=sys.stderr)
            raw = predict_local(prompt, max_new_tokens=250)
            print(f"[score] Raw output: {raw[:200]}...", file=sys.stderr)
            
            scores = extract_first_json(raw)
            scores = normalize_scores_to_0_10(scores)
            
            if validate_scores(scores):
                print(f"[score] ✓ Local LoRA succeeded", file=sys.stderr)
                return scores
            else:
                print(f"[score] ✗ Invalid scores from local model, falling back to Groq", file=sys.stderr)
        except Exception as e:
            print(f"[score] ✗ Local LoRA failed: {e}", file=sys.stderr)
    
    # PRIORITY 3: Fallback to Groq
    try:
        print("[score] Using Groq API (fallback)...", file=sys.stderr)
        out = call_groq(prompt, max_tokens=250, timeout=40)
        print(f"[score] Raw output: {out[:200]}...", file=sys.stderr)
        
        scores = extract_first_json(out)
        scores = normalize_scores_to_0_10(scores)
        
        if validate_scores(scores):
            print(f"[score] ✓ Groq succeeded", file=sys.stderr)
            return scores
        else:
            print(f"[score] ⚠ Invalid scores from Groq, using defaults", file=sys.stderr)
    except Exception as e:
        print(f"[score] ✗ Groq failed: {e}", file=sys.stderr)
    
    # Return default scores if all methods fail
    print("[score] ⚠ All methods failed, returning default scores", file=sys.stderr)
    return {
        "academics": 5.0,
        "test_readiness": 5.0,
        "leadership": 5.0,
        "extracurriculars": 5.0,
        "international": 5.0,
        "work_impact": 5.0,
        "impact": 5.0,
        "industry": 5.0
    }

def validate_scores(scores: dict) -> bool:
    """Validate that scores are in expected format and range with 8-key system."""
    required_keys = [
        "academics", "test_readiness", "leadership", "extracurriculars",
        "international", "work_impact", "impact", "industry"
    ]
    
    if not all(key in scores for key in required_keys):
        missing = set(required_keys) - set(scores.keys())
        print(f"[validate] Missing required keys: {missing}", file=sys.stderr)
        return False
    
    for key in required_keys:
        value = scores[key]
        if not isinstance(value, (int, float)):
            print(f"[validate] Non-numeric score for {key}: {value}", file=sys.stderr)
            return False
        if value < 0 or value > 10:
            print(f"[validate] Score out of range for {key}: {value}", file=sys.stderr)
            return False
    
    return True

def extract_strengths_and_improvements(resume_text: str) -> dict:
    """Extract rich strengths, improvements and explicit recommendations using Groq."""
    prompt = STRENGTHS_PROMPT.replace("{resume}", resume_text)
    
    try:
        print("[strengths] Using Groq API to extract strengths/improvements/recommendations...", file=sys.stderr)
        out = call_groq(prompt, max_tokens=1000, retry_count=3, timeout=60)
        print(f"[strengths] Raw output: {out[:400]}...", file=sys.stderr)
        
        result = extract_first_json(out)
        
        # Ensure keys exist
        strengths = result.get("strengths", [])
        improvements = result.get("improvements", [])
        recommendations = result.get("recommendations", [])
        
        # Normalize strengths: ensure title, summary, score (0-100)
        for s in strengths:
            s["title"] = s.get("title", "Strength")
            s["summary"] = s.get("summary", "") or "Notable achievement identified."
            
            # Normalize score to 0-100
            sc = s.get("score", 70)
            try:
                sc = float(sc)
            except:
                sc = 70.0
            s["score"] = int(max(0, min(100, round(sc))))
        
        # Normalize improvements
        for imp in improvements:
            imp["area"] = imp.get("area", "Area")
            imp["suggestion"] = imp.get("suggestion", imp.get("recommendation", "Consider strengthening this area"))
            
            sc = imp.get("score", 50)
            try:
                sc = float(sc)
            except:
                sc = 50.0
            imp["score"] = int(max(0, min(100, round(sc))))
        
        # Normalize recommendations (ensure full shape)
        normalized_recs = []
        for i, rec in enumerate(recommendations or []):
            nr = {
                "id": rec.get("id") or f"rec_{i+1}",
                "type": rec.get("type") or "other",
                "area": rec.get("area") or rec.get("title") or "General",
                "priority": rec.get("priority") or "medium",
                "action": rec.get("action") or rec.get("recommendation") or "",
                "estimated_impact": rec.get("estimated_impact") or "",
                "score": None
            }
            if "score" in rec:
                try:
                    nr["score"] = int(max(0, min(100, round(float(rec["score"])))))
                except:
                    nr["score"] = None
            normalized_recs.append(nr)
        
        print(f"[strengths] ✓ Extracted {len(strengths)} strengths, {len(improvements)} improvements, {len(normalized_recs)} recommendations", file=sys.stderr)
        return {
            "strengths": strengths,
            "improvements": improvements,
            "recommendations": normalized_recs
        }
    except Exception as e:
        print(f"[strengths] ✗ Failed: {e}", file=sys.stderr)
        return {
            "strengths": [],
            "improvements": [],
            "recommendations": []
        }

def verify_scores(resume_text: str, scores: dict) -> dict:
    """Verify scores using Groq with robust error handling."""
    prompt = (
        VERIFY_PROMPT
        .replace("{resume}", resume_text)
        .replace("{scores}", json.dumps(scores, indent=2))
    )
    
    try:
        print("[verify] Using Groq API...", file=sys.stderr)
        out = call_groq(prompt, max_tokens=200, retry_count=3, timeout=40)
        print(f"[verify] Raw output: {out[:200]}...", file=sys.stderr)
        
        verification = extract_first_json(out)
        
        # Ensure required keys exist
        if "ok" not in verification:
            verification["ok"] = True
        if "explanation" not in verification:
            verification["explanation"] = "Scores verified"
        
        # Ensure "ok" is boolean
        if isinstance(verification["ok"], str):
            verification["ok"] = verification["ok"].lower() in ["true", "yes", "1"]
        
        print(f"[verify] ✓ Verification complete: ok={verification['ok']}", file=sys.stderr)
        return verification
    except Exception as e:
        print(f"[verify] ✗ Failed: {e}", file=sys.stderr)
        # Return safe default that won't break pipeline
        return {
            "ok": True,
            "explanation": f"Verification completed with fallback (error: {str(e)[:100]})"
        }

def analyze_gaps(scores: dict) -> list:
    """Analyze score gaps and identify improvement areas with 8-key system."""
    gaps = []
    threshold = 7
    
    gap_suggestions = {
        "academics": "Highlight academic achievements, relevant coursework, honors, or certifications. Mention GPA if strong (>3.5).",
        "test_readiness": "Demonstrate quantitative and analytical skills through projects, data analysis, or technical work. Mention any standardized test scores if strong.",
        "leadership": "Add more examples of leading teams, initiatives, or projects. Include team size, outcomes, and your specific role in driving results.",
        "extracurriculars": "Include volunteering, community involvement, board positions, or passion projects. Show commitment and impact beyond work.",
        "international": "Highlight international work experience, cross-cultural projects, foreign language skills, or global team collaboration.",
        "work_impact": "Quantify career achievements with metrics, percentages, revenue impact, or user growth. Show clear progression and promotions.",
        "impact": "Add measurable outcomes and results. Use the format: 'Action verb + what you did + quantified result'. Focus on business impact.",
        "industry": "Emphasize domain expertise, industry-specific challenges solved, and relevant sector experience. Mention any specialized training or certifications."
    }
    
    for key, suggestion in gap_suggestions.items():
        score = scores.get(key, 0)
        if score < threshold:
            gaps.append({
                "area": key.replace("_", " ").title(),
                "score": score,
                "suggestion": suggestion
            })
    
    if not gaps:
        gaps.append({
            "area": "Overall Profile",
            "score": sum(scores.values()) / len(scores),
            "suggestion": "Strong profile overall. Consider adding C-suite exposure, P&L responsibility, or strategic initiatives to reach elite MBA programs."
        })
    
    return gaps

def recommend_actions(gaps: list) -> list:
    """Convert gaps into actionable recommendations with rich shape."""
    recs = []
    for i, g in enumerate(gaps):
        score = g.get("score", 0)
        # Convert 0-10 score to 0-100 for consistency
        score_100 = int(max(0, min(100, round(float(score) * 10))))
        
        recs.append({
            "id": f"rec_fallback_{i+1}",
            "type": "improvement",
            "area": g.get("area", "Overall"),
            "priority": "high" if score < 4 else "medium",
            "action": g.get("suggestion", ""),
            "estimated_impact": "Moderate — strengthens profile and competitiveness",
            "score": score_100
        })
    return recs

def improve_resume(resume_text: str) -> str:
    """Generate improved version of resume - try Groq first, then HF, then local."""
    prompt = IMPROVE_PROMPT.replace("{resume}", resume_text)
    
    # PRIORITY 1: Try Groq first (best for creative writing)
    try:
        print("[improve] Using Groq API (primary)...", file=sys.stderr)
        improved = call_groq(prompt, max_tokens=800, retry_count=3, timeout=60)
        
        # Clean up any markdown or preamble
        improved = improved.strip()
        
        # Remove common unwanted prefixes
        unwanted_prefixes = [
            "Here is the improved resume:",
            "Here's the improved resume:",
            "Improved Resume:",
            "**Improved Resume**",
        ]
        for prefix in unwanted_prefixes:
            if improved.startswith(prefix):
                improved = improved[len(prefix):].strip()
        
        # Remove markdown code blocks if present
        improved = re.sub(r'^```.*?\n', '', improved)
        improved = re.sub(r'\n```$', '', improved)
        
        print(f"[improve] ✓ Groq succeeded ({len(improved)} chars)", file=sys.stderr)
        return improved
    except Exception as e:
        print(f"[improve] ✗ Groq failed: {e}", file=sys.stderr)
    
    # PRIORITY 2: Try HuggingFace if available
    if USE_HUGGINGFACE and HF_AVAILABLE:
        try:
            print("[improve] Using HuggingFace Inference API (secondary)...", file=sys.stderr)
            improved = call_hf_inference(prompt, max_new_tokens=600, temperature=0.2)
            
            # Clean up
            improved = improved.strip()
            improved = re.sub(r'^```.*?\n', '', improved)
            improved = re.sub(r'\n```$', '', improved)
            
            print(f"[improve] ✓ HuggingFace succeeded ({len(improved)} chars)", file=sys.stderr)
            return improved
        except Exception as e:
            print(f"[improve] ✗ HuggingFace failed: {e}", file=sys.stderr)
    
    # PRIORITY 3: Try local LoRA last
    if USE_LOCAL_LORA and _local_model:
        try:
            print("[improve] Using local LoRA model (tertiary)...", file=sys.stderr)
            improved = predict_local(prompt, max_new_tokens=600)
            print(f"[improve] ✓ Local LoRA succeeded ({len(improved)} chars)", file=sys.stderr)
            return improved
        except Exception as e:
            print(f"[improve] ✗ Local LoRA failed: {e}", file=sys.stderr)
    
    # All methods failed
    print("[improve] ✗ All improvement methods failed", file=sys.stderr)
    return f"[Unable to generate improved resume - all methods failed]\n\nOriginal:\n{resume_text}"

def build_report(resume_text: str, scores: dict, verification: dict, gaps: list, 
                recs: list, improved: str, strengths: list, improvements: list) -> dict:
    """Build final report dictionary."""
    return {
        "original_resume": resume_text,
        "scores": scores,
        "strengths": strengths,
        "improvements": improvements,
        "verification": verification,
        "gaps": gaps,
        "recommendations": recs,
        "improved_resume": improved,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "pipeline_version": "3.2.0"
    }

# -------------------------------------------------------
# Main Runner - FIXED: Made improvement optional
# -------------------------------------------------------
def run_pipeline(resume_text: str, include_improvement: bool = False) -> dict:
    """
    Execute full pipeline.
    
    Args:
        resume_text: Resume text to analyze
        include_improvement: Whether to generate improved resume (default: False)
                           Set to False to skip improvement and save resources.
                           Use /rewrite endpoint for on-demand improvement.
    
    Returns:
        Complete analysis report dictionary
    """
    print("\n" + "="*60, file=sys.stderr)
    print("MBA RESUME ANALYSIS PIPELINE v3.2", file=sys.stderr)
    print("HuggingFace Inference (Primary) + Groq + Local LoRA", file=sys.stderr)
    print("8-Key Scoring (0-10) + Rich Strengths/Improvements (0-100)", file=sys.stderr)
    print("="*60 + "\n", file=sys.stderr)
    
    # Display inference configuration
    print("Inference Configuration:", file=sys.stderr)
    print(f"  HuggingFace: {'✓ Enabled' if USE_HUGGINGFACE and HF_AVAILABLE else '✗ Disabled'}", file=sys.stderr)
    if USE_HUGGINGFACE and HF_AVAILABLE:
        print(f"  Model: {HF_MODEL}", file=sys.stderr)
    print(f"  Local LoRA: {'✓ Enabled' if USE_LOCAL_LORA and _local_model else '✗ Disabled'}", file=sys.stderr)
    print(f"  Groq API: {'✓ Enabled' if GROQ_API_KEY else '✗ Disabled'}", file=sys.stderr)
    print(f"  Resume Improvement: {'✓ Included' if include_improvement else '✗ Skipped (use /rewrite endpoint)'}", file=sys.stderr)
    print("", file=sys.stderr)
    
    print("Step 1: Scoring resume (8 dimensions, 0-10 scale)...", file=sys.stderr)
    scores = score_resume(resume_text)
    
    print("\nStep 2: Extracting strengths, improvements, and recommendations...", file=sys.stderr)
    strength_data = extract_strengths_and_improvements(resume_text)
    strengths = strength_data.get("strengths", [])
    improvements = strength_data.get("improvements", [])
    recs = strength_data.get("recommendations", [])
    
    # If recommendations missing, convert gaps into recommended objects (rich shape)
    if not recs:
        print("\nStep 2b: No recommendations from model, generating from gaps...", file=sys.stderr)
        print("\nStep 3: Analyzing gaps...", file=sys.stderr)
        gaps = analyze_gaps(scores)
        
        recs = []
        for idx, g in enumerate(gaps[:5]):
            score = g.get("score", 0)
            score_100 = int(max(0, min(100, round(float(score) * 10))))
            
            recs.append({
                "id": f"rec_gap_{idx+1}",
                "type": "improvement",
                "area": g.get("area", "Overall Profile"),
                "priority": "high" if score < 4 else "medium",
                "action": g.get("suggestion", ""),
                "estimated_impact": "Moderate — should improve your competitiveness",
                "score": score_100
            })
    else:
        print("\nStep 3: Analyzing gaps (optional)...", file=sys.stderr)
        gaps = analyze_gaps(scores)
    
    print("\nStep 4: Verifying scores...", file=sys.stderr)
    verification = verify_scores(resume_text, scores)
    
    # ✅ CRITICAL FIX: Make improvement optional
    if include_improvement:
        print("\nStep 5: Improving resume...", file=sys.stderr)
        improved = improve_resume(resume_text)
    else:
        print("\nStep 5: Skipping resume improvement (use /rewrite endpoint for on-demand improvement)...", file=sys.stderr)
        improved = ""  # Empty string - will be generated on-demand via /rewrite endpoint
    
    print("\n" + "="*60, file=sys.stderr)
    print("PIPELINE COMPLETE", file=sys.stderr)
    print("="*60 + "\n", file=sys.stderr)
    
    return build_report(resume_text, scores, verification, gaps, recs, improved, strengths, improvements)

def main():
    """Main entry point with file reading support including PDF."""
    import argparse
    
    parser = argparse.ArgumentParser(description="MBA Resume Analysis Pipeline v3.2")
    parser.add_argument("resume_text", nargs="?", default="", 
                       help="Resume text or file path to analyze")
    parser.add_argument("--rewrite-only", action="store_true",
                       help="Only improve resume, skip analysis")
    parser.add_argument("--test-hf", action="store_true",
                       help="Test HuggingFace connection and exit")
    parser.add_argument("--include-improvement", action="store_true",
                       help="Include improved resume in analysis (default: False, use /rewrite endpoint instead)")
    args = parser.parse_args()
    
    # Test HuggingFace connection if requested
    if args.test_hf:
        if not USE_HUGGINGFACE:
            print("ERROR: USE_HUGGINGFACE is not enabled", file=sys.stderr)
            print("Set environment variable: USE_HUGGINGFACE=true", file=sys.stderr)
            sys.exit(1)
        
        if not HF_AVAILABLE:
            print("ERROR: HuggingFace inference module not available", file=sys.stderr)
            print("Check that hf_inference.py is in the same directory", file=sys.stderr)
            sys.exit(1)
        
        print("Testing HuggingFace connection...", file=sys.stderr)
        if test_hf_connection():
            print("\n✓ HuggingFace API is working!", file=sys.stderr)
            sys.exit(0)
        else:
            print("\n✗ HuggingFace API test failed", file=sys.stderr)
            sys.exit(1)
    
    # Load local model if enabled
    if USE_LOCAL_LORA:
        try_load_local_lora()
    
    # ---- Read file if path is provided ----
    resume_input = args.resume_text
    
    if not resume_input:
        print('Usage: python mba_hybrid_pipeline.py "resume text or file path"', file=sys.stderr)
        print('       python mba_hybrid_pipeline.py --rewrite-only "resume text or file path"', file=sys.stderr)
        print('       python mba_hybrid_pipeline.py --test-hf', file=sys.stderr)
        print('       python mba_hybrid_pipeline.py --include-improvement "resume text"', file=sys.stderr)
        print("\nExamples:", file=sys.stderr)
        print('  python mba_hybrid_pipeline.py "Software Engineer with 5 years experience..."', file=sys.stderr)
        print('  python mba_hybrid_pipeline.py resume.txt', file=sys.stderr)
        print('  python mba_hybrid_pipeline.py resume.pdf', file=sys.stderr)
        print('  python mba_hybrid_pipeline.py --rewrite-only resume.pdf', file=sys.stderr)
        print('  python mba_hybrid_pipeline.py --test-hf', file=sys.stderr)
        print('  python mba_hybrid_pipeline.py --include-improvement resume.txt', file=sys.stderr)
        return
    
    # Check if input is a file path
    if os.path.isfile(resume_input):
        print(f"[main] Reading resume from file: {resume_input}", file=sys.stderr)
        try:
            # Handle PDF files
            if resume_input.lower().endswith('.pdf'):
                resume_text = extract_text_from_pdf(resume_input)
                print(f"[main] ✓ Loaded {len(resume_text)} characters from PDF", file=sys.stderr)
            else:
                # Handle text/docx files (read as text)
                with open(resume_input, "r", encoding="utf-8") as f:
                    resume_text = f.read()
                print(f"[main] ✓ Loaded {len(resume_text)} characters from file", file=sys.stderr)
        except Exception as e:
            print(f"[main] ✗ Could not read file: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        # Input is direct text
        resume_text = resume_input
        print(f"[main] Using direct text input ({len(resume_text)} characters)", file=sys.stderr)
    
    # ---- REWRITE-ONLY MODE ----
    if args.rewrite_only:
        print("[rewrite] Starting resume improvement...", file=sys.stderr)
        improved = improve_resume(resume_text)
        
        # Output ONLY to stdout
        sys.stdout.write(improved)
        sys.stdout.flush()
        return
    
    # ---- FULL ANALYSIS MODE ----
    # ✅ CRITICAL FIX: Pass include_improvement parameter
    result = run_pipeline(resume_text, include_improvement=args.include_improvement)
    
    # Output ONLY JSON to stdout (compact)
    sys.stdout.write(json.dumps(result, ensure_ascii=False))
    sys.stdout.flush()

if __name__ == "__main__":
    main()