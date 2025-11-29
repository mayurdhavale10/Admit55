#!/usr/bin/env python3
"""
mba_hybrid_pipeline.py v4.2
Multi-provider pipeline: Gemini (primary) + OpenAI (fallback)
FIXED: Added missing exception classes and improved error handling
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
# CUSTOM EXCEPTION CLASSES (ADDED)
# -------------------------------------------------------

class LLMProviderError(Exception):
    """Base exception for LLM provider errors."""
    pass


class GeminiError(LLMProviderError):
    """Exception for Gemini API errors."""
    pass


class OpenAIError(LLMProviderError):
    """Exception for OpenAI API errors."""
    pass


class GroqError(LLMProviderError):
    """Legacy exception name for backward compatibility."""
    pass


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
# GMAT/GRE FILTER HELPER
# -------------------------------------------------------

def has_strong_test_score(resume_text: str) -> bool:
    """
    Return True if the resume already shows a strong GMAT/GRE or 
    clearly completed top MBA / PGP, so test prep is irrelevant.
    """
    text = resume_text.lower()
    patterns = [
        r"gmat\s*[:\-]?\s*(7[0-9]{2}|8[0-9]{2}|9[0-9]{2})",  # GMAT 700+
        r"gre\s*[:\-]?\s*(32[5-9]|33[0-9]|34[0-9])",  # GRE ~325+
        r"730\s*/\s*800",  # common 730/800 style
        r"pgp\s*\(mba\)",  # PGP (MBA)
        r"post[- ]graduate programme in management",  # ISB-style text
        r"indian school of business",  # ISB
    ]
    
    for p in patterns:
        if re.search(p, text, flags=re.IGNORECASE):
            return True
    return False


# -------------------------------------------------------
# MULTI-PROVIDER CONFIGURATION
# -------------------------------------------------------

# Gemini Configuration (primary provider with fallback models)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# ✅ FREE-TIER DEFAULTS - Models that work without paid subscription
GEMINI_PRIMARY_MODEL = os.environ.get("GEMINI_PRIMARY_MODEL", "gemini-2.0-flash")
GEMINI_SECONDARY_MODEL = os.environ.get("GEMINI_SECONDARYFALLBACK_MODEL", "gemini-2.5-flash")
GEMINI_TERTIARY_MODEL = os.environ.get("GEMINI_THIRDFALLBACK_MODEL", "gemini-2.5-pro")
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
    1. Gemini Primary (gemini-2.0-flash)
    2. Gemini Secondary (gemini-2.5-flash)
    3. Gemini Tertiary (gemini-2.5-pro)
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


# -------------------------------------------------------
# PROMPTS (UPDATED WITH RICH STRENGTHS/IMPROVEMENTS)
# -------------------------------------------------------

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

CRITICAL REQUIREMENTS:
- If the resume already shows a strong GMAT/GRE score (e.g., GMAT ≥ 700 or GRE ≥ 325) or the candidate has already completed an MBA/PGP, DO NOT recommend GMAT/GRE preparation.
- Every strength and suggestion must reference at least one concrete detail from the resume (role, company, function, metric, project, or industry). Avoid generic advice that could apply to anyone.

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
# EXTRACT STRENGTHS AND IMPROVEMENTS FUNCTION
# -------------------------------------------------------

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
        
        # 🔐 NEW: If candidate already has a strong score / completed MBA,
        # remove GMAT/GRE prep recommendations as they are irrelevant.
        if has_strong_test_score(resume_text):
            print("[strengths] Strong test score detected - filtering GMAT/GRE recommendations", file=sys.stderr)
            
            def is_test_related(text: str) -> bool:
                return bool(re.search(
                    r"\b(gmat|gre|test score|standardized test|exam preparation)\b",
                    text,
                    re.IGNORECASE,
                ))
            
            improvements = [
                imp for imp in improvements
                if not is_test_related(
                    (imp.get("area") or "") + " " + 
                    (imp.get("suggestion") or imp.get("recommendation") or "")
                )
            ]
            
            recommendations = [
                rec for rec in recommendations
                if not is_test_related(
                    (rec.get("area") or "") + " " + 
                    (rec.get("action") or rec.get("recommendation") or "")
                )
            ]
            
            print(f"[strengths] After filtering: {len(improvements)} improvements, {len(recommendations)} recommendations", file=sys.stderr)
        
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


# -------------------------------------------------------
# MAIN EXECUTION (if needed)
# -------------------------------------------------------

if __name__ == "__main__":
    print("[mba_hybrid_pipeline] Module loaded successfully", file=sys.stderr)
    print("[mba_hybrid_pipeline] Use extract_strengths_and_improvements() to analyze resumes", file=sys.stderr)