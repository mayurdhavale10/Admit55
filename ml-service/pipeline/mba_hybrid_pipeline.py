#!/usr/bin/env python3
"""
mba_hybrid_pipeline.py v5.0 (DeepSeek-only)
Pipeline: DeepSeek (chat) for ALL LLM steps
- PDF extraction
- 8-key scoring (0–10)
- Strengths, gaps, recommendations
- Optional resume rewrite
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
# DEEPSEEK CONFIGURATION
# -------------------------------------------------------
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
DEEPSEEK_PRIMARY_MODEL = os.environ.get("DEEPSEEK_PRIMARY_MODEL", "deepseek-chat")
DEEPSEEK_SECONDARY_MODEL = os.environ.get("DEEPSEEK_SECONDARY_MODEL", DEEPSEEK_PRIMARY_MODEL)
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

print("[CONFIG] DeepSeek configuration loaded:", file=sys.stderr)
print(f"  DeepSeek Primary:   {DEEPSEEK_PRIMARY_MODEL}", file=sys.stderr)
print(f"  DeepSeek Secondary: {DEEPSEEK_SECONDARY_MODEL}", file=sys.stderr)

# -------------------------------------------------------
# JSON Extraction Utility
# -------------------------------------------------------
def extract_first_json(text: str):
    """Extract and parse the first valid JSON object from text with robust error handling."""
    if not isinstance(text, str):
        text = str(text)

    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()

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

    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in text")

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
        end = text.rfind("}")
        if end == -1 or end <= start:
            raise ValueError("No complete JSON object found")

    json_str = text[start:end+1]

    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        json_str = json_str.replace("'", '"')
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)
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


class DeepSeekError(LLMProviderError):
    """DeepSeek API specific errors."""
    pass


class GroqError(LLMProviderError):
    """Legacy exception name for backward compatibility."""
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

        if n > 10:
            n = max(0, min(10, n / 10.0))
        else:
            n = max(0, min(10, n))

        out[k] = round(n, 2)
    return out

# -------------------------------------------------------
# RESUME ENTITY EXTRACTION
# -------------------------------------------------------
def extract_resume_entities(resume_text: str) -> dict:
    """
    Extract key entities from resume for validation.
    Returns dict with companies, numbers, roles, schools found.
    """
    text = resume_text.lower()

    entities = {
        'companies': set(),
        'numbers': set(),
        'percentages': set(),
        'schools': set(),
        'roles': set()
    }

    # Extract numbers and percentages
    entities['numbers'] = set(re.findall(r'\b\d+\b', text))
    entities['percentages'] = set(re.findall(r'\d+%', text))

    # Common company indicators
    company_patterns = [
        r'\b(google|microsoft|amazon|facebook|meta|apple|netflix|uber|airbnb)\b',
        r'\b(mckinsey|bcg|bain|deloitte|pwc|kpmg|ey)\b',
        r'\b(goldman|morgan|jp\s*morgan|citibank|hsbc)\b',
        r'\b(tcs|infosys|wipro|hcl|tech\s*mahindra)\b',
    ]
    for pattern in company_patterns:
        entities['companies'].update(re.findall(pattern, text))

    # Common B-schools
    school_patterns = [
        r'\b(iim|isb|xlri|spjimr|fms|mdi|iift)\b',
        r'\b(harvard|stanford|wharton|insead|mit|kellogg)\b',
    ]
    for pattern in school_patterns:
        entities['schools'].update(re.findall(pattern, text))

    # Common roles
    role_patterns = [
        r'\b(manager|director|analyst|engineer|consultant|lead|head|vp|ceo|cto|cfo)\b',
    ]
    for pattern in role_patterns:
        entities['roles'].update(re.findall(pattern, text))

    print(
        f"[entities] Found: {len(entities['companies'])} companies, "
        f"{len(entities['numbers'])} numbers, {len(entities['schools'])} schools",
        file=sys.stderr
    )

    return entities

# -------------------------------------------------------
# SPECIFICITY VALIDATION
# -------------------------------------------------------
def is_specific(text: str, resume_entities: dict, min_specificity_score: int = 2) -> bool:
    """
    Check if text is specific (references actual resume content).
    Returns True if text mentions companies, numbers, roles, or schools from resume.
    """
    if not text:
        return False

    text_lower = text.lower()
    specificity_score = 0

    if any(num in text_lower for num in resume_entities.get('numbers', [])):
        specificity_score += 1
    if any(pct in text_lower for pct in resume_entities.get('percentages', [])):
        specificity_score += 1

    if any(company in text_lower for company in resume_entities.get('companies', [])):
        specificity_score += 2

    if any(school in text_lower for school in resume_entities.get('schools', [])):
        specificity_score += 2

    if any(role in text_lower for role in resume_entities.get('roles', [])):
        specificity_score += 1

    return specificity_score >= min_specificity_score


def validate_output_specificity(
    strengths: list,
    improvements: list,
    recommendations: list,
    resume_entities: dict
) -> dict:
    """
    Validate that strengths/improvements/recommendations are specific.
    Returns stats on how many items are generic.
    """
    stats = {
        'strengths_specific': 0,
        'strengths_generic': 0,
        'improvements_specific': 0,
        'improvements_generic': 0,
        'recommendations_specific': 0,
        'recommendations_generic': 0,
    }

    for s in strengths:
        text = f"{s.get('title', '')} {s.get('summary', '')}"
        if is_specific(text, resume_entities):
            stats['strengths_specific'] += 1
        else:
            stats['strengths_generic'] += 1

    for imp in improvements:
        text = f"{imp.get('area', '')} {imp.get('suggestion', '')}"
        if is_specific(text, resume_entities):
            stats['improvements_specific'] += 1
        else:
            stats['improvements_generic'] += 1

    for rec in recommendations:
        text = f"{rec.get('area', '')} {rec.get('action', '')} {rec.get('estimated_impact', '')}"
        if is_specific(text, resume_entities):
            stats['recommendations_specific'] += 1
        else:
            stats['recommendations_generic'] += 1

    print(f"[validation] Specificity stats: {stats}", file=sys.stderr)
    return stats

# -------------------------------------------------------
# GMAT/GRE / MBA DETECTION
# -------------------------------------------------------
def has_strong_test_score(resume_text: str) -> bool:
    """
    Return True if the resume already shows a strong GMAT/GRE
    OR clearly completed a serious MBA/PGP.
    """
    text = resume_text.lower()

    patterns = [
        r"gmat\s*[:\-]?\s*(7[0-9]{2}|8[0-9]{2}|9[0-9]{2})",
        r"gre\s*[:\-]?\s*(32[5-9]|33[0-9]|34[0-9])",
        r"\bmba\b",
        r"\bpgdm?\b",
        r"\bpgp\b",
        r"\biim\b",
        r"\bisb\b",
        r"\bindian\s+school\s+of\s+business\b",
        r"\bxlri\b",
        r"\bspjimr\b",
        r"\bfms\b.*\bdelhi\b",
        r"\bmdi\b.*\bgurgaon\b",
        r"\bharvard\s+business\s+school\b",
        r"\bstanford\s+gsb\b",
        r"\bwharton\b",
        r"\binsead\b",
        r"\blondon\s+business\s+school\b",
        r"\bmit\s+sloan\b",
        r"\bkellogg\b",
    ]

    for p in patterns:
        if re.search(p, text, flags=re.IGNORECASE):
            print(f"[has_strong_test_score] Matched pattern: {p}", file=sys.stderr)
            return True

    return False

# -------------------------------------------------------
# DEEPSEEK API FUNCTION
# -------------------------------------------------------
def call_deepseek(
    model: str,
    prompt: str,
    max_tokens: int = 300,
    temperature: float = 0.1,
    timeout: int = 40,
) -> str:
    """Call DeepSeek chat completion API."""
    if not DEEPSEEK_API_KEY:
        raise DeepSeekError("Missing DEEPSEEK_API_KEY")

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": int(max_tokens),
        "temperature": temperature,
    }

    try:
        print(f"[deepseek] Calling model={model}, max_tokens={max_tokens}", file=sys.stderr)
        r = requests.post(DEEPSEEK_API_URL, json=payload, headers=headers, timeout=timeout)
        status = r.status_code

        if status != 200:
            error_msg = f"HTTP {status}: {r.text[:500]}"
            if status == 429:
                raise DeepSeekError(f"Rate limit exceeded: {error_msg}")
            elif 500 <= status < 600:
                raise DeepSeekError(f"Server error: {error_msg}")
            else:
                raise DeepSeekError(error_msg)

        data = r.json()
        try:
            text = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as e:
            raise DeepSeekError(f"Unexpected DeepSeek response: {data}") from e

        text = (text or "").strip()
        if not text:
            raise DeepSeekError("Empty text from DeepSeek")

        print(f"[deepseek] ✓ Response length={len(text)} chars", file=sys.stderr)
        return text

    except requests.exceptions.Timeout:
        raise DeepSeekError(f"Request timed out after {timeout}s")
    except requests.exceptions.RequestException as e:
        raise DeepSeekError(f"Request failed: {e}")

# -------------------------------------------------------
# LLM ROUTER (DEEPSEEK ONLY)
# -------------------------------------------------------
def call_llm_with_fallback(
    prompt: str,
    max_tokens: int = 300,
    temperature: float = 0.1,
    timeout: int = 40,
    retry_transient: bool = True,
) -> str:
    """
    Simple router: always uses DeepSeek, with retry on transient errors.
    """
    errors = []
    max_attempts = 3 if retry_transient else 1

    for attempt in range(max_attempts):
        try:
            print(f"[llm-router] Trying DeepSeek (attempt {attempt + 1}/{max_attempts})...", file=sys.stderr)
            result = call_deepseek(DEEPSEEK_PRIMARY_MODEL, prompt, max_tokens, temperature, timeout)
            print("[llm-router] ✓ Success with DeepSeek", file=sys.stderr)
            return result
        except DeepSeekError as e:
            error_str = str(e)
            is_transient = "rate limit" in error_str.lower() or "server error" in error_str.lower()

            if is_transient and attempt < max_attempts - 1:
                wait_time = 2 ** attempt
                print(
                    f"[llm-router] Transient error, retrying in {wait_time}s: {error_str[:120]}",
                    file=sys.stderr,
                )
                time.sleep(wait_time)
                continue

            error_msg = f"DeepSeek: {error_str}"
            print(f"[llm-router] ✗ Failed: {error_msg[:200]}", file=sys.stderr)
            errors.append(error_msg)
            break

    raise LLMProviderError(f"All LLM attempts failed. Errors: {'; '.join(errors)}")


def call_groq(prompt: str, max_tokens: int = 300, retry_count: int = 2, timeout: int = 40) -> str:
    """Backward-compatible wrapper. Now routes through DeepSeek."""
    print("[call_groq] Using DeepSeek (legacy wrapper)", file=sys.stderr)
    return call_llm_with_fallback(prompt, max_tokens=max_tokens, timeout=timeout)

# -------------------------------------------------------
# PROMPTS
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
   - summary: ONE sentence with SPECIFIC FACTS/NUMBERS from resume (mention company names, metrics, or projects)

2. Top 3-5 IMPROVEMENTS/GAPS with:
   - area: Short label (e.g., "Standardized Test Score")
   - score: 0-100 current rating
   - suggestion: ONE actionable sentence with SPECIFIC reference to their background

3. 3-6 PRIORITIZED RECOMMENDATIONS with:
   - id: Unique identifier (e.g., "rec_1")
   - type: One of [skill, test, extracurricular, career, resume, networking, other]
   - area: Short label
   - priority: One of [high, medium, low]
   - action: Clear, actionable step(s) TAILORED to their profile
   - estimated_impact: One sentence explaining the benefit
   - score: 0-100 (optional, represents current state if applicable)

CRITICAL REQUIREMENTS - READ CAREFULLY:
1. EVERY strength must mention at least ONE of: company name, specific metric/number, project name, or role title from the resume
2. EVERY improvement must reference their actual background (e.g., "Given your SaaS experience at Google..." not "Improve leadership skills")
3. EVERY recommendation must be TAILORED to their industry/role (e.g., "Leverage your fintech background to..." not "Take online courses")
4. If resume shows GMAT ≥ 700, GRE ≥ 325, or MBA/PGDM from IIM/ISB/top school → DO NOT recommend GMAT/GRE prep
5. ZERO GENERIC ADVICE. Every sentence must prove you read THIS specific resume.

BAD EXAMPLE (generic):
- "Strong leadership skills demonstrated"
- "Consider improving your test scores"
- "Build leadership experience"

GOOD EXAMPLE (specific):
- "Led 15-person engineering team at Google to ship product used by 2M+ users"
- "Given your fintech background at Goldman Sachs, target roles requiring regulatory expertise"
- "Leverage your 40% revenue growth achievement at Amazon in your essays"

Resume:
{resume}

Return ONLY valid JSON. No markdown, no preamble. Every field must reference specific resume content."""

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
# Pipeline Steps
# -------------------------------------------------------
def score_resume(resume_text: str) -> dict:
    """Score resume using DeepSeek."""
    prompt = SCORER_PROMPT.replace("{resume}", resume_text)

    try:
        print("[score] Scoring resume using DeepSeek...", file=sys.stderr)
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

    print("[score] ⚠ Returning default scores", file=sys.stderr)
    return {
        "academics": 5.0,
        "test_readiness": 5.0,
        "leadership": 5.0,
        "extracurriculars": 5.0,
        "international": 5.0,
        "work_impact": 5.0,
        "impact": 5.0,
        "industry": 5.0,
    }


def validate_scores(scores: dict) -> bool:
    """Validate that scores are in expected format and range with 8-key system."""
    required_keys = [
        "academics",
        "test_readiness",
        "leadership",
        "extracurriculars",
        "international",
        "work_impact",
        "impact",
        "industry",
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


def extract_strengths_and_improvements(resume_text: str, max_retries: int = 2) -> dict:
    """
    Extract strengths, improvements and recommendations using DeepSeek,
    with retry if output is too generic.
    """
    resume_entities = extract_resume_entities(resume_text)
    base_prompt = STRENGTHS_PROMPT.replace("{resume}", resume_text)

    for attempt in range(max_retries):
        try:
            print(f"[strengths] Extracting (attempt {attempt + 1}/{max_retries})...", file=sys.stderr)

            current_prompt = base_prompt
            if attempt > 0:
                current_prompt = base_prompt + (
                    "\n\nWARNING: Previous attempt was too generic. "
                    "You MUST include specific company names, metrics, and projects from the resume."
                )

            out = call_llm_with_fallback(current_prompt, max_tokens=2500, temperature=0.1, timeout=60)
            print(f"[strengths] Raw output: {out[:400]}...", file=sys.stderr)

            result = extract_first_json(out)

            strengths = result.get("strengths", [])
            improvements = result.get("improvements", [])
            recommendations = result.get("recommendations", [])

            # Filter GMAT/GRE recs if strong score/MBA
            if has_strong_test_score(resume_text):
                print("[strengths] Strong test/MBA detected – filtering GMAT/GRE items", file=sys.stderr)

                def is_test_related(text: str) -> bool:
                    return bool(
                        re.search(
                            r"\b(gmat|gre|test score|standardized test|exam preparation|test prep|retake)\b",
                            (text or ""),
                            re.IGNORECASE,
                        )
                    )

                improvements = [
                    imp
                    for imp in improvements
                    if not is_test_related(
                        f"{imp.get('area','')} {imp.get('suggestion','')} {imp.get('recommendation','')}"
                    )
                ]

                recommendations = [
                    rec
                    for rec in recommendations
                    if not is_test_related(
                        f"{rec.get('area','')} {rec.get('action','')} "
                        f"{rec.get('estimated_impact','')} {rec.get('title','')}"
                    )
                ]

                print(
                    f"[strengths] After filter: {len(improvements)} improvements, "
                    f"{len(recommendations)} recommendations",
                    file=sys.stderr,
                )

            # Normalize strengths
            for s in strengths:
                s["title"] = s.get("title", "Strength")
                s["summary"] = s.get("summary", "") or "Notable achievement identified."
                sc = s.get("score", 70)
                try:
                    sc = float(sc)
                except:
                    sc = 70.0
                s["score"] = int(max(0, min(100, round(sc))))

            # Normalize improvements
            for imp in improvements:
                imp["area"] = imp.get("area", "Area")
                imp["suggestion"] = imp.get(
                    "suggestion", imp.get("recommendation", "Consider strengthening this area")
                )
                sc = imp.get("score", 50)
                try:
                    sc = float(sc)
                except:
                    sc = 50.0
                imp["score"] = int(max(0, min(100, round(sc))))

            # Normalize recommendations
            normalized_recs = []
            for i, rec in enumerate(recommendations or []):
                nr = {
                    "id": rec.get("id") or f"rec_{i+1}",
                    "type": rec.get("type") or "other",
                    "area": rec.get("area") or rec.get("title") or "General",
                    "priority": rec.get("priority") or "medium",
                    "action": rec.get("action") or rec.get("recommendation") or "",
                    "estimated_impact": rec.get("estimated_impact") or "",
                    "score": None,
                }
                if "score" in rec:
                    try:
                        nr["score"] = int(max(0, min(100, round(float(rec["score"])))))
                    except:
                        nr["score"] = None
                normalized_recs.append(nr)

            # Specificity validation
            validation_stats = validate_output_specificity(
                strengths, improvements, normalized_recs, resume_entities
            )

            total_items = len(strengths) + len(improvements) + len(normalized_recs)
            generic_items = (
                validation_stats["strengths_generic"]
                + validation_stats["improvements_generic"]
                + validation_stats["recommendations_generic"]
            )

            if total_items > 0:
                generic_ratio = generic_items / total_items
                print(
                    f"[strengths] Generic ratio: {generic_ratio:.2%} ({generic_items}/{total_items})",
                    file=sys.stderr,
                )

                if generic_ratio > 0.5 and attempt < max_retries - 1:
                    print("[strengths] Output too generic, retrying...", file=sys.stderr)
                    continue

            print(
                f"[strengths] ✓ Extracted {len(strengths)} strengths, "
                f"{len(improvements)} improvements, {len(normalized_recs)} recommendations",
                file=sys.stderr,
            )
            return {
                "strengths": strengths,
                "improvements": improvements,
                "recommendations": normalized_recs,
            }

        except Exception as e:
            print(f"[strengths] ✗ Attempt {attempt + 1} failed: {e}", file=sys.stderr)
            if attempt == max_retries - 1:
                print("[strengths] ✗ All attempts failed", file=sys.stderr)
                return {"strengths": [], "improvements": [], "recommendations": []}

    return {"strengths": [], "improvements": [], "recommendations": []}


def verify_scores(resume_text: str, scores: dict) -> dict:
    """Verify scores using DeepSeek with robust error handling."""
    prompt = (
        VERIFY_PROMPT.replace("{resume}", resume_text).replace(
            "{scores}", json.dumps(scores, indent=2)
        )
    )

    try:
        print("[verify] Verifying scores...", file=sys.stderr)
        out = call_llm_with_fallback(prompt, max_tokens=600, temperature=0.1, timeout=40)
        print(f"[verify] Raw output: {out[:200]}...", file=sys.stderr)

        verification = extract_first_json(out)

        if "ok" not in verification:
            verification["ok"] = True
        if "explanation" not in verification:
            verification["explanation"] = "Scores verified"

        if isinstance(verification["ok"], str):
            verification["ok"] = verification["ok"].lower() in ["true", "yes", "1"]

        print(f"[verify] ✓ Verification complete: ok={verification['ok']}", file=sys.stderr)
        return verification
    except Exception as e:
        print(f"[verify] ✗ Failed: {e}", file=sys.stderr)
        return {
            "ok": True,
            "explanation": f"Verification completed with fallback (error: {str(e)[:100]})",
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
        "industry": "Emphasize domain expertise, industry-specific challenges solved, and relevant sector experience. Mention any specialized training or certifications.",
    }

    for key, suggestion in gap_suggestions.items():
        score = scores.get(key, 0)
        if score < threshold:
            gaps.append(
                {
                    "area": key.replace("_", " ").title(),
                    "score": score,
                    "suggestion": suggestion,
                }
            )

    if not gaps:
        gaps.append(
            {
                "area": "Overall Profile",
                "score": sum(scores.values()) / len(scores),
                "suggestion": "Strong profile overall. Consider adding C-suite exposure, P&L responsibility, or strategic initiatives to reach elite MBA programs.",
            }
        )

    return gaps


def recommend_actions(gaps: list) -> list:
    """Convert gaps into actionable recommendations with rich shape."""
    recs = []
    for i, g in enumerate(gaps):
        score = g.get("score", 0)
        score_100 = int(max(0, min(100, round(float(score) * 10))))

        recs.append(
            {
                "id": f"rec_fallback_{i+1}",
                "type": "improvement",
                "area": g.get("area", "Overall"),
                "priority": "high" if score < 4 else "medium",
                "action": g.get("suggestion", ""),
                "estimated_impact": "Moderate — strengthens profile and competitiveness",
                "score": score_100,
            }
        )
    return recs


def improve_resume(resume_text: str) -> str:
    """Generate improved version of resume using DeepSeek."""
    prompt = IMPROVE_PROMPT.replace("{resume}", resume_text)

    try:
        print("[improve] Improving resume...", file=sys.stderr)
        improved = call_llm_with_fallback(prompt, max_tokens=2000, temperature=0.2, timeout=60)

        improved = improved.strip()

        unwanted_prefixes = [
            "Here is the improved resume:",
            "Here's the improved resume:",
            "Improved Resume:",
            "**Improved Resume**",
        ]
        for prefix in unwanted_prefixes:
            if improved.startswith(prefix):
                improved = improved[len(prefix):].strip()

        improved = re.sub(r'^```.*?\n', '', improved)
        improved = re.sub(r'\n```$', '', improved)

        print(f"[improve] ✓ Improvement succeeded ({len(improved)} chars)", file=sys.stderr)
        return improved
    except Exception as e:
        print(f"[improve] ✗ Improvement failed: {e}", file=sys.stderr)
        return f"[Unable to generate improved resume - error: {str(e)[:100]}]\n\nOriginal:\n{resume_text}"


def build_report(
    resume_text: str,
    scores: dict,
    verification: dict,
    gaps: list,
    recs: list,
    improved: str,
    strengths: list,
    improvements: list,
) -> dict:
    """Build final report dictionary (backwards-compatible JSON shape)."""
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
        "pipeline_version": "5.0.0",
    }

# -------------------------------------------------------
# Main Runner
# -------------------------------------------------------
def run_pipeline(resume_text: str, include_improvement: bool = True) -> dict:
    """Execute full pipeline with optional resume improvement."""
    print("\n" + "=" * 60, file=sys.stderr)
    print("MBA RESUME ANALYSIS PIPELINE v5.0 (DeepSeek)", file=sys.stderr)
    print("LLM: DeepSeek Chat (deepseek-chat)", file=sys.stderr)
    print("8-Key Scoring (0-10) + Specificity Validation", file=sys.stderr)
    print("=" * 60 + "\n", file=sys.stderr)

    print("Inference Configuration:", file=sys.stderr)
    print(f"  DeepSeek Primary:   {DEEPSEEK_PRIMARY_MODEL} {'✓' if DEEPSEEK_API_KEY else '✗'}", file=sys.stderr)
    print(f"  DeepSeek Secondary: {DEEPSEEK_SECONDARY_MODEL}", file=sys.stderr)
    print(f"  Include Improvement: {'Yes' if include_improvement else 'No'}", file=sys.stderr)
    print("", file=sys.stderr)

    print("Step 1: Scoring resume (8 dimensions, 0-10 scale)...", file=sys.stderr)
    scores = score_resume(resume_text)

    print("\nStep 2: Extracting strengths, improvements, and recommendations...", file=sys.stderr)
    strength_data = extract_strengths_and_improvements(resume_text)
    strengths = strength_data.get("strengths", [])
    improvements = strength_data.get("improvements", [])
    recs = strength_data.get("recommendations", [])

    if not recs:
        print("\nStep 2b: No recommendations from model, generating from gaps...", file=sys.stderr)
        print("\nStep 3: Analyzing gaps...", file=sys.stderr)
        gaps = analyze_gaps(scores)
        recs = []

        for idx, g in enumerate(gaps[:5]):
            score = g.get("score", 0)
            score_100 = int(max(0, min(100, round(float(score) * 10))))

            recs.append(
                {
                    "id": f"rec_gap_{idx+1}",
                    "type": "improvement",
                    "area": g.get("area", "Overall Profile"),
                    "priority": "high" if score < 4 else "medium",
                    "action": g.get("suggestion", ""),
                    "estimated_impact": "Moderate — should improve your competitiveness",
                    "score": score_100,
                }
            )
    else:
        print("\nStep 3: Analyzing gaps (optional)...", file=sys.stderr)
        gaps = analyze_gaps(scores)

    print("\nStep 4: Verifying scores...", file=sys.stderr)
    verification = verify_scores(resume_text, scores)

    if include_improvement:
        print("\nStep 5: Improving resume...", file=sys.stderr)
        improved = improve_resume(resume_text)
    else:
        print("\nStep 5: Skipping resume improvement (not requested)...", file=sys.stderr)
        improved = ""

    print("\n" + "=" * 60, file=sys.stderr)
    print("PIPELINE COMPLETE", file=sys.stderr)
    print("=" * 60 + "\n", file=sys.stderr)

    return build_report(resume_text, scores, verification, gaps, recs, improved, strengths, improvements)


def main():
    """Main entry point with file reading support including PDF."""
    import argparse

    parser = argparse.ArgumentParser(description="MBA Resume Analysis Pipeline v5.0 (DeepSeek)")
    parser.add_argument("resume_text", nargs="?", default="", help="Resume text or file path to analyze")
    parser.add_argument(
        "--rewrite-only",
        action="store_true",
        help="Only improve resume, skip analysis",
    )
    parser.add_argument(
        "--no-improvement",
        action="store_true",
        help="Skip resume improvement step",
    )
    args = parser.parse_args()

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

    if os.path.isfile(resume_input):
        print(f"[main] Reading resume from file: {resume_input}", file=sys.stderr)
        try:
            if resume_input.lower().endswith(".pdf"):
                resume_text = extract_text_from_pdf(resume_input)
                print(f"[main] ✓ Loaded {len(resume_text)} characters from PDF", file=sys.stderr)
            else:
                with open(resume_input, "r", encoding="utf-8") as f:
                    resume_text = f.read()
                print(f"[main] ✓ Loaded {len(resume_text)} characters from file", file=sys.stderr)
        except Exception as e:
            print(f"[main] ✗ Could not read file: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        resume_text = resume_input
        print(f"[main] Using direct text input ({len(resume_text)} characters)", file=sys.stderr)

    if args.rewrite_only:
        print("[rewrite] Starting resume improvement...", file=sys.stderr)
        improved = improve_resume(resume_text)
        sys.stdout.write(improved)
        sys.stdout.flush()
        return

    include_improvement = not args.no_improvement
    result = run_pipeline(resume_text, include_improvement=include_improvement)

    sys.stdout.write(json.dumps(result, ensure_ascii=False))
    sys.stdout.flush()


if __name__ == "__main__":
    main()
