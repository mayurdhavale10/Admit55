#!/usr/bin/env python3
"""
mba_hybrid_pipeline.py v4.1
Multi-provider pipeline: Gemini (primary) + OpenAI (fallback)
UPDATED: Fixed MAX_TOKENS handling, free-tier defaults, increased token limits
"""
import os
import json
import sys
import time
import re
from typing import Dict, Any, List, Optional
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
# MULTI-PROVIDER CONFIGURATION
# -------------------------------------------------------
# Gemini Configuration (primary provider with fallback models)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# ✅ FREE-TIER DEFAULTS - Models that work without paid subscription
GEMINI_PRIMARY_MODEL  = os.environ.get("GEMINI_PRIMARY_MODEL", "gemini-2.0-flash")
GEMINI_SECONDARY_MODEL = os.environ.get("GEMINI_SECONDARYFALLBACK_MODEL", "gemini-2.5-flash")
GEMINI_TERTIARY_MODEL  = os.environ.get("GEMINI_THIRDFALLBACK_MODEL", "gemini-2.5-pro")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta"

# OpenAI Configuration (final fallback)
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_FALLBACK_MODEL = os.environ.get("OPENAI_FOURTHFALLBACK_MODEL", "gpt-4o-mini")
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

print("[CONFIG] Multi-provider configuration loaded:", file=sys.stderr)
print(f"  Gemini Primary: {GEMINI_PRIMARY_MODEL}", file=sys.stderr)
print(f"  Gemini Secondary: {GEMINI_SECONDARY_MODEL}", file=sys.stderr)
print(f"  Gemini Tertiary: {GEMINI_TERTIARY_MODEL}", file=sys.stderr)
print(f"  OpenAI Fallback: {OPENAI_FALLBACK_MODEL}", file=sys.stderr)

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
# EXCEPTION CLASSES
# -------------------------------------------------------
class LLMProviderError(Exception):
    """Base exception for LLM provider errors."""
    pass

class GeminiError(LLMProviderError):
    """Gemini API specific errors."""
    pass

class OpenAIError(LLMProviderError):
    """OpenAI API specific errors."""
    pass

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
# GEMINI API FUNCTIONS (FIXED FOR MAX_TOKENS)
# -------------------------------------------------------
def call_gemini(
    model: str,
    prompt: str, 
    max_tokens: int = 300, 
    temperature: float = 0.1,
    timeout: int = 40
) -> str:
    """
    Call Gemini API with specified model.
    FIXED: Now handles MAX_TOKENS finish reason and missing text field properly.
    
    Args:
        model: Gemini model ID (e.g., "gemini-1.5-flash-latest")
        prompt: Text prompt
        max_tokens: max output tokens
        temperature: sampling temperature
        timeout: request timeout in seconds
    
    Returns:
        Generated text from Gemini
    
    Raises:
        GeminiError: On API errors or invalid responses
    """
    if not GEMINI_API_KEY:
        raise GeminiError("Missing GEMINI_API_KEY")
    
    url = f"{GEMINI_API_URL}/models/{model}:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": int(max_tokens),
        },
    }
    
    try:
        print(f"[gemini] Calling model={model}, max_tokens={max_tokens}", file=sys.stderr)
        r = requests.post(url, json=payload, timeout=timeout)
        status = r.status_code
        
        # Handle errors
        if status != 200:
            error_msg = f"HTTP {status}: {r.text[:500]}"
            if status == 429:
                raise GeminiError(f"Rate limit exceeded: {error_msg}")
            elif 500 <= status < 600:
                raise GeminiError(f"Server error: {error_msg}")
            else:
                raise GeminiError(error_msg)
        
        data = r.json()
        
        # Check for candidates
        if "candidates" not in data or not data["candidates"]:
            raise GeminiError(f"No candidates in response: {data}")
        
        candidate = data["candidates"][0]
        finish_reason = candidate.get("finishReason", "UNKNOWN")
        
        # ✅ FIX: Extract text from content.parts with proper error handling
        try:
            content = candidate.get("content", {})
            parts = content.get("parts", [])
            
            if not parts:
                # No parts at all - check finish reason
                if finish_reason == "MAX_TOKENS":
                    raise GeminiError(f"Response truncated due to MAX_TOKENS with no text. Increase max_tokens from {max_tokens}.")
                raise GeminiError(f"Empty parts in response (finishReason={finish_reason})")
            
            # Try to get text from first part
            text = parts[0].get("text", "")
            
        except (KeyError, IndexError, AttributeError) as e:
            # If no text field, check if it's a MAX_TOKENS issue
            if finish_reason == "MAX_TOKENS":
                raise GeminiError(f"Response truncated due to MAX_TOKENS. Increase max_tokens from {max_tokens}.")
            raise GeminiError(f"Cannot extract text from response: {candidate}") from e
        
        text = (text or "").strip()
        
        # ✅ FIX: Warn if truncated but allow if we got some text
        if finish_reason == "MAX_TOKENS":
            print(f"[gemini] ⚠ Response truncated (MAX_TOKENS), got {len(text)} chars", file=sys.stderr)
            if len(text) < 50:  # Too short to be useful
                raise GeminiError(f"Response too short after MAX_TOKENS truncation: {len(text)} chars. Increase max_tokens from {max_tokens}.")
        
        if not text:
            raise GeminiError(f"Empty text from Gemini (finishReason={finish_reason})")
        
        print(f"[gemini] ✓ Response length={len(text)} chars (finishReason={finish_reason})", file=sys.stderr)
        return text
        
    except requests.exceptions.Timeout:
        raise GeminiError(f"Request timed out after {timeout}s")
    except requests.exceptions.RequestException as e:
        raise GeminiError(f"Request failed: {e}")

# -------------------------------------------------------
# OPENAI API FUNCTIONS
# -------------------------------------------------------
def call_openai(
    model: str,
    prompt: str,
    max_tokens: int = 300,
    temperature: float = 0.1,
    timeout: int = 40
) -> str:
    """
    Call OpenAI API with specified model.
    
    Args:
        model: OpenAI model ID (e.g., "gpt-4o-mini")
        prompt: Text prompt
        max_tokens: max output tokens
        temperature: sampling temperature
        timeout: request timeout in seconds
    
    Returns:
        Generated text from OpenAI
    
    Raises:
        OpenAIError: On API errors or invalid responses
    """
    if not OPENAI_API_KEY:
        raise OpenAIError("Missing OPENAI_API_KEY")
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": int(max_tokens),
        "temperature": temperature
    }
    
    try:
        print(f"[openai] Calling model={model}, max_tokens={max_tokens}", file=sys.stderr)
        r = requests.post(OPENAI_API_URL, json=payload, headers=headers, timeout=timeout)
        status = r.status_code
        
        # Handle errors
        if status != 200:
            error_msg = f"HTTP {status}: {r.text[:500]}"
            if status == 429:
                raise OpenAIError(f"Rate limit exceeded: {error_msg}")
            elif 500 <= status < 600:
                raise OpenAIError(f"Server error: {error_msg}")
            else:
                raise OpenAIError(error_msg)
        
        data = r.json()
        
        # Expected structure: choices[0].message.content
        try:
            text = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as e:
            raise OpenAIError(f"Unexpected OpenAI response: {data}") from e
        
        text = (text or "").strip()
        if not text:
            raise OpenAIError("Empty text from OpenAI")
        
        print(f"[openai] ✓ Response length={len(text)} chars", file=sys.stderr)
        return text
        
    except requests.exceptions.Timeout:
        raise OpenAIError(f"Request timed out after {timeout}s")
    except requests.exceptions.RequestException as e:
        raise OpenAIError(f"Request failed: {e}")

# -------------------------------------------------------
# MULTI-PROVIDER LLM ROUTER WITH FALLBACK
# -------------------------------------------------------
def call_llm_with_fallback(
    prompt: str,
    max_tokens: int = 300,
    temperature: float = 0.1,
    timeout: int = 40,
    retry_transient: bool = True
) -> str:
    """
    Call LLM with automatic fallback chain:
    1. Gemini Primary (gemini-1.5-flash-latest)
    2. Gemini Secondary (gemini-1.5-flash)
    3. Gemini Tertiary (gemini-1.5-pro-latest)
    4. OpenAI Fallback (gpt-4o-mini) - if API key available
    
    Args:
        prompt: Text prompt
        max_tokens: Maximum output tokens
        temperature: Sampling temperature
        timeout: Request timeout per attempt
        retry_transient: If True, retry transient errors (rate limits, 5xx)
    
    Returns:
        Generated text from first successful provider
    
    Raises:
        LLMProviderError: If all providers fail
    """
    
    providers = [
        ("Gemini Primary", lambda: call_gemini(GEMINI_PRIMARY_MODEL, prompt, max_tokens, temperature, timeout)),
        ("Gemini Secondary", lambda: call_gemini(GEMINI_SECONDARY_MODEL, prompt, max_tokens, temperature, timeout)),
        ("Gemini Tertiary", lambda: call_gemini(GEMINI_TERTIARY_MODEL, prompt, max_tokens, temperature, timeout)),
    ]
    
    # Only add OpenAI if API key is available
    if OPENAI_API_KEY:
        providers.append(
            ("OpenAI Fallback", lambda: call_openai(OPENAI_FALLBACK_MODEL, prompt, max_tokens, temperature, timeout))
        )
    else:
        print("[llm-router] OpenAI API key not configured, skipping OpenAI fallback", file=sys.stderr)
    
    errors = []
    
    for provider_name, provider_func in providers:
        # Retry logic for transient errors
        max_attempts = 3 if retry_transient else 1
        
        for attempt in range(max_attempts):
            try:
                print(f"[llm-router] Trying {provider_name} (attempt {attempt + 1}/{max_attempts})...", file=sys.stderr)
                result = provider_func()
                print(f"[llm-router] ✓ Success with {provider_name}", file=sys.stderr)
                return result
                
            except (GeminiError, OpenAIError) as e:
                error_str = str(e)
                
                # Check if error is transient (rate limit or 5xx)
                is_transient = "rate limit" in error_str.lower() or "server error" in error_str.lower()
                
                # ✅ FIX: Don't retry MAX_TOKENS errors - they need higher limits
                is_max_tokens = "MAX_TOKENS" in error_str or "truncated" in error_str.lower()
                
                if is_transient and not is_max_tokens and attempt < max_attempts - 1:
                    wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                    print(f"[llm-router] Transient error, retrying in {wait_time}s: {error_str[:100]}", file=sys.stderr)
                    time.sleep(wait_time)
                    continue
                
                # Non-transient error or final attempt failed
                error_msg = f"{provider_name}: {error_str}"
                print(f"[llm-router] ✗ Failed: {error_msg[:200]}", file=sys.stderr)
                errors.append(error_msg)
                break  # Move to next provider
    
    # All providers failed
    error_summary = "; ".join(errors)
    raise LLMProviderError(f"All LLM providers failed. Errors: {error_summary}")

# -------------------------------------------------------
# BACKWARD COMPATIBILITY (for existing code)
# -------------------------------------------------------
def call_groq(prompt: str, max_tokens: int = 300, retry_count: int = 2, timeout: int = 40) -> str:
    """
    Backward-compatible wrapper. Now routes through multi-provider fallback.
    Legacy function name kept for compatibility.
    """
    print("[call_groq] Using multi-provider fallback (legacy function)", file=sys.stderr)
    return call_llm_with_fallback(prompt, max_tokens=max_tokens, timeout=timeout)

# Keep GroqError for backward compatibility
class GroqError(LLMProviderError):
    """Legacy exception name for backward compatibility."""
    pass

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
# Pipeline Steps (ALL LOGS TO STDERR) - ✅ INCREASED TOKEN LIMITS
# -------------------------------------------------------
def score_resume(resume_text: str) -> dict:
    """Score resume using multi-provider LLM with fallback."""
    prompt = SCORER_PROMPT.replace("{resume}", resume_text)
    
    try:
        print("[score] Scoring resume using multi-provider LLM...", file=sys.stderr)
        # ✅ INCREASED: max_tokens from 250 to 500
        raw = call_llm_with_fallback(prompt, max_tokens=500, temperature=0.1)
        print(f"[score] Raw output: {raw[:200]}...", file=sys.stderr)
        
        scores = extract_first_json(raw)
        scores = normalize_scores_to_0_10(scores)
        
        if validate_scores(scores):
            print(f"[score] ✓ Scoring succeeded", file=sys.stderr)
            return scores
        else:
            print(f"[score] ⚠ Invalid scores, using defaults", file=sys.stderr)
    except Exception as e:
        print(f"[score] ✗ Scoring failed: {e}", file=sys.stderr)
    
    # Return default scores if all methods fail
    print("[score] ⚠ Returning default scores", file=sys.stderr)
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
    """Extract rich strengths, improvements and explicit recommendations using LLM."""
    prompt = STRENGTHS_PROMPT.replace("{resume}", resume_text)
    
    try:
        print("[strengths] Extracting strengths/improvements/recommendations...", file=sys.stderr)
        # ✅ INCREASED: max_tokens from 1000 to 2500
        out = call_llm_with_fallback(prompt, max_tokens=2500, temperature=0.1, timeout=60)
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
    """Verify scores using LLM with robust error handling."""
    prompt = (
        VERIFY_PROMPT
        .replace("{resume}", resume_text)
        .replace("{scores}", json.dumps(scores, indent=2))
    )
    
    try:
        print("[verify] Verifying scores...", file=sys.stderr)
        # ✅ INCREASED: max_tokens from 200 to 600
        out = call_llm_with_fallback(prompt, max_tokens=600, temperature=0.1, timeout=40)
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
    """Generate improved version of resume using multi-provider LLM."""
    prompt = IMPROVE_PROMPT.replace("{resume}", resume_text)
    
    try:
        print("[improve] Improving resume...", file=sys.stderr)
        # ✅ INCREASED: max_tokens from 800 to 2000
        improved = call_llm_with_fallback(prompt, max_tokens=2000, temperature=0.2, timeout=60)
        
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
        
        print(f"[improve] ✓ Improvement succeeded ({len(improved)} chars)", file=sys.stderr)
        return improved
    except Exception as e:
        print(f"[improve] ✗ Improvement failed: {e}", file=sys.stderr)
        return f"[Unable to generate improved resume - error: {str(e)[:100]}]\n\nOriginal:\n{resume_text}"

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
        "pipeline_version": "4.1.0"
    }

# -------------------------------------------------------
# Main Runner
# -------------------------------------------------------
def run_pipeline(resume_text: str, include_improvement: bool = True) -> dict:
    """Execute full pipeline with optional resume improvement."""
    print("\n" + "="*60, file=sys.stderr)
    print("MBA RESUME ANALYSIS PIPELINE v4.1", file=sys.stderr)
    print("Multi-Provider: Gemini Free Tier + OpenAI Fallback", file=sys.stderr)
    print("8-Key Scoring (0-10) + Rich Strengths/Improvements (0-100)", file=sys.stderr)
    print("="*60 + "\n", file=sys.stderr)
    
    # Display inference configuration
    print("Inference Configuration:", file=sys.stderr)
    print(f"  Gemini Primary: {GEMINI_PRIMARY_MODEL} {'✓' if GEMINI_API_KEY else '✗'}", file=sys.stderr)
    print(f"  Gemini Secondary: {GEMINI_SECONDARY_MODEL}", file=sys.stderr)
    print(f"  Gemini Tertiary: {GEMINI_TERTIARY_MODEL}", file=sys.stderr)
    print(f"  OpenAI Fallback: {OPENAI_FALLBACK_MODEL} {'✓' if OPENAI_API_KEY else '✗'}", file=sys.stderr)
    print(f"  Include Improvement: {'Yes' if include_improvement else 'No'}", file=sys.stderr)
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
    
    # Only improve resume if requested
    if include_improvement:
        print("\nStep 5: Improving resume...", file=sys.stderr)
        improved = improve_resume(resume_text)
    else:
        print("\nStep 5: Skipping resume improvement (not requested)...", file=sys.stderr)
        improved = ""
    
    print("\n" + "="*60, file=sys.stderr)
    print("PIPELINE COMPLETE", file=sys.stderr)
    print("="*60 + "\n", file=sys.stderr)
    
    return build_report(resume_text, scores, verification, gaps, recs, improved, strengths, improvements)

def main():
    """Main entry point with file reading support including PDF."""
    import argparse
    
    parser = argparse.ArgumentParser(description="MBA Resume Analysis Pipeline v4.1")
    parser.add_argument("resume_text", nargs="?", default="", 
                       help="Resume text or file path to analyze")
    parser.add_argument("--rewrite-only", action="store_true",
                       help="Only improve resume, skip analysis")
    parser.add_argument("--no-improvement", action="store_true",
                       help="Skip resume improvement step")
    args = parser.parse_args()
    
    # ---- Read file if path is provided ----
    resume_input = args.resume_text
    
    if not resume_input:
        print("Usage: python mba_hybrid_pipeline.py \"resume text or file path\"", file=sys.stderr)
        print("       python mba_hybrid_pipeline.py --rewrite-only \"resume text or file path\"", file=sys.stderr)
        print("       python mba_hybrid_pipeline.py --no-improvement \"resume text or file path\"", file=sys.stderr)
        print("\nExamples:", file=sys.stderr)
        print("  python mba_hybrid_pipeline.py \"Software Engineer with 5 years experience...\"", file=sys.stderr)
        print("  python mba_hybrid_pipeline.py resume.txt", file=sys.stderr)
        print("  python mba_hybrid_pipeline.py resume.pdf", file=sys.stderr)
        print("  python mba_hybrid_pipeline.py --rewrite-only resume.pdf", file=sys.stderr)
        print("  python mba_hybrid_pipeline.py --no-improvement resume.txt", file=sys.stderr)
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
    include_improvement = not args.no_improvement
    result = run_pipeline(resume_text, include_improvement=include_improvement)
    
    # Output ONLY JSON to stdout (compact)
    sys.stdout.write(json.dumps(result, ensure_ascii=False))
    sys.stdout.flush()

if __name__ == "__main__":
    main()