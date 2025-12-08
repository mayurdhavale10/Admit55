#!/usr/bin/env python3
"""
mba_groq_detailed_pipeline.py v5.2.0
Enhanced Groq pipeline with multi-call architecture for detailed, specific outputs
"""

import os
import sys
import time
import json
import re
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
import requests

load_dotenv()

# PDF Support
try:
    import PyPDF2
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

# Configuration
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

print(f"[CONFIG] Using Groq model: {GROQ_MODEL}", file=sys.stderr)


# ============================================================
# ENTITY EXTRACTION (for specificity validation)
# ============================================================
def extract_resume_entities(resume_text: str) -> Dict[str, set]:
    """Extract key entities from resume for validation."""
    text = resume_text.lower()
    
    entities = {
        'companies': set(),
        'numbers': set(),
        'percentages': set(),
        'currencies': set(),
        'schools': set(),
        'roles': set()
    }
    
    # Extract numbers and metrics
    entities['numbers'] = set(re.findall(r'\b\d+\b', text))
    entities['percentages'] = set(re.findall(r'\d+%', text))
    entities['currencies'] = set(re.findall(r'(?:rs\.?|inr|usd|\$|₹)\s*\d+', text))
    
    # Extract company names (common patterns)
    company_keywords = ['pvt', 'ltd', 'inc', 'corp', 'llc', 'technologies', 'solutions', 'services']
    words = text.split()
    for i, word in enumerate(words):
        if any(kw in word for kw in company_keywords) and i > 0:
            entities['companies'].add(words[i-1])
    
    # Common roles
    role_patterns = [
        r'\b(manager|director|analyst|engineer|consultant|lead|head|vp|ceo|cto|cfo|coordinator|associate)\b',
        r'\b(senior|junior|staff|principal|chief)\b'
    ]
    for pattern in role_patterns:
        entities['roles'].update(re.findall(pattern, text))
    
    print(f"[entities] Found: {len(entities['companies'])} companies, "
          f"{len(entities['numbers'])} numbers, {len(entities['roles'])} roles", 
          file=sys.stderr)
    
    return entities


def is_specific(text: str, resume_entities: Dict[str, set], min_score: int = 2) -> bool:
    """Check if text references actual resume content."""
    if not text:
        return False
    
    text_lower = text.lower()
    score = 0
    
    # Check for numbers/percentages/currencies
    if any(num in text_lower for num in resume_entities.get('numbers', [])):
        score += 2
    if any(pct in text_lower for pct in resume_entities.get('percentages', [])):
        score += 2
    if any(curr in text_lower for curr in resume_entities.get('currencies', [])):
        score += 2
    
    # Check for companies/roles
    if any(company in text_lower for company in resume_entities.get('companies', [])):
        score += 3
    if any(role in text_lower for role in resume_entities.get('roles', [])):
        score += 1
    
    return score >= min_score


# ============================================================
# GROQ API CALLS
# ============================================================
class GroqError(Exception):
    pass


def call_groq(
    prompt: str, 
    max_tokens: int = 4096, 
    temperature: float = 0.2,
    response_format: Optional[str] = None,
    timeout: int = 60
) -> str:
    """Call Groq API with error handling."""
    if not GROQ_API_KEY:
        raise GroqError("Missing GROQ_API_KEY")
    
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": int(max_tokens),
        "temperature": float(temperature),
    }
    
    if response_format == "json":
        payload["response_format"] = {"type": "json_object"}
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    
    try:
        print(f"[groq] Calling (max_tokens={max_tokens}, temp={temperature})", file=sys.stderr)
        r = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=timeout)
        
        if r.status_code != 200:
            raise GroqError(f"HTTP {r.status_code}: {r.text[:500]}")
        
        data = r.json()
        content = data["choices"][0]["message"]["content"]
        
        if not content:
            raise GroqError("Empty response from Groq")
        
        print(f"[groq] ✓ Response: {len(content)} chars", file=sys.stderr)
        return content.strip()
        
    except requests.exceptions.Timeout:
        raise GroqError(f"Timeout after {timeout}s")
    except Exception as e:
        raise GroqError(f"Request failed: {e}")


# ============================================================
# PROMPTS (Specialized for each call)
# ============================================================

SCORING_PROMPT = """You are an MBA admissions expert. Analyze this resume and score it on 8 dimensions (0-10 scale).

Resume:
{resume}

Return ONLY valid JSON with this exact structure:
{{
  "academics": <0-10>,
  "test_readiness": <0-10>,
  "leadership": <0-10>,
  "extracurriculars": <0-10>,
  "international": <0-10>,
  "work_impact": <0-10>,
  "impact": <0-10>,
  "industry": <0-10>
}}

Scoring guidelines:
- academics: GPA, coursework, academic honors
- test_readiness: Quantitative skills, analytical capability
- leadership: Team management, initiative ownership
- extracurriculars: Non-work activities, volunteering
- international: Global experience, languages
- work_impact: Career progression, promotions
- impact: Measurable business outcomes
- industry: Domain expertise, sector experience

Return ONLY the JSON, no explanation."""


STRENGTHS_PROMPT = """You are an MBA admissions expert analyzing a resume.

CRITICAL REQUIREMENT: You MUST reference SPECIFIC details from the resume in EVERY point:
- Company names (e.g., "at Google", "while at Goldman Sachs")
- Exact metrics (e.g., "increased revenue by 40%", "managed $2M budget")
- Project names, team sizes, specific technologies
- Role titles, time periods, locations

Resume:
{resume}

Extract 4-6 TOP STRENGTHS. For each strength:
1. title: Specific 5-8 word headline (e.g., "Exceptional Revenue Growth at Amazon Web Services")
2. summary: 2-3 sentences with SPECIFIC facts/numbers/companies from resume
3. score: 0-100 rating

BAD EXAMPLE (too generic):
- "Strong leadership skills demonstrated through various initiatives"

GOOD EXAMPLE (specific):
- "Led 15-person engineering team at Google to ship YouTube feature used by 2M+ users, resulting in 40% increase in user engagement and promotion to Senior Manager within 18 months"

Return JSON:
{{
  "strengths": [
    {{"title": "...", "summary": "...", "score": 85}}
  ]
}}

If you cannot find specific details, YOU MUST say so rather than being generic."""


IMPROVEMENTS_PROMPT = """You are an MBA admissions expert analyzing gaps in this candidate's profile.

Resume:
{resume}

Current Scores:
{scores}

Identify 4-6 IMPROVEMENT AREAS. For each:
1. area: Short label (e.g., "International Experience")
2. suggestion: 2-3 sentences with SPECIFIC, ACTIONABLE advice TAILORED to their background
   - Reference their actual industry/role/company
   - Provide concrete next steps
3. score: 0-100 current rating

CRITICAL: Every suggestion must be SPECIFIC to their profile.

BAD EXAMPLE:
- "Improve leadership skills by taking on more responsibilities"

GOOD EXAMPLE:
- "Given your 5 years in fintech at JPMorgan, seek rotational assignment in Asia-Pacific markets to gain international exposure. Target Hong Kong or Singapore offices where your derivatives expertise would be valuable."

Return JSON:
{{
  "improvements": [
    {{"area": "...", "suggestion": "...", "score": 60}}
  ]
}}"""


RECOMMENDATIONS_PROMPT = """You are an MBA admissions strategist creating an action plan for this candidate.

Resume:
{resume}

Scores:
{scores}

Strengths:
{strengths}

Improvements:
{improvements}

Create 5-8 PRIORITIZED RECOMMENDATIONS. Each must:
1. Be HIGHLY SPECIFIC to their background (reference companies, industries, roles)
2. Include concrete action steps
3. Explain WHY it matters for MBA admissions
4. Be categorized by priority (high/medium/low)

Format:
{{
  "recommendations": [
    {{
      "id": "rec_1",
      "type": "skill|test|extracurricular|career|resume|networking|other",
      "area": "Short label",
      "priority": "high|medium|low",
      "action": "2-3 sentences with SPECIFIC steps tailored to their profile",
      "estimated_impact": "1-2 sentences explaining the MBA admissions benefit",
      "score": 70
    }}
  ]
}}

BAD EXAMPLE:
- "Improve your resume by adding more metrics"

GOOD EXAMPLE:
- "Leverage your 40% revenue growth achievement at Amazon in your essays. Frame it as: 'How did you identify the growth opportunity? What obstacles did you overcome? How did you influence cross-functional teams?' This demonstrates strategic thinking AND leadership—key MBA traits."

IMPORTANT: If resume shows GMAT ≥700 or GRE ≥325 or MBA from IIM/ISB, do NOT recommend test prep."""


NARRATIVE_PROMPT = """You are an MBA admissions consultant writing a detailed profile assessment.

Resume:
{resume}

Analysis:
{analysis}

Write a comprehensive assessment in THREE sections using this EXACT format:

### Top Strengths
[4-6 bullet points, each 2-3 sentences, with SPECIFIC company names, metrics, and achievements]

### Improvement Areas  
[4-6 bullet points, each 2-3 sentences, with SPECIFIC actionable advice tailored to their background]

### Actionable Recommendations
[5-8 bullet points with [HIGH]/[MEDIUM]/[LOW] tags, each 2-3 sentences, with SPECIFIC steps and MBA relevance]

CRITICAL RULES:
1. EVERY bullet must reference specific details from resume (companies, numbers, roles)
2. Zero generic advice - everything must be tailored
3. Use the candidate's actual achievements to illustrate points
4. Make it read like you personally reviewed their resume in detail

Return ONLY the markdown text, no JSON."""


# ============================================================
# PIPELINE STEPS (Multi-call with validation)
# ============================================================

def score_resume(resume_text: str, entities: Dict) -> Dict[str, float]:
    """Step 1: Score the resume."""
    prompt = SCORING_PROMPT.format(resume=resume_text)
    
    try:
        raw = call_groq(prompt, max_tokens=500, temperature=0.1, response_format="json")
        scores = json.loads(raw)
        
        # Normalize to 0-10
        normalized = {}
        for k, v in scores.items():
            n = float(v)
            if n > 10:
                n = n / 10.0
            normalized[k] = round(max(0.0, min(10.0, n)), 2)
        
        print(f"[scoring] ✓ Scored: {normalized}", file=sys.stderr)
        return normalized
        
    except Exception as e:
        print(f"[scoring] ✗ Failed: {e}", file=sys.stderr)
        return {
            "academics": 5.0, "test_readiness": 5.0, "leadership": 5.0,
            "extracurriculars": 5.0, "international": 5.0, "work_impact": 5.0,
            "impact": 5.0, "industry": 5.0
        }


def extract_strengths(resume_text: str, entities: Dict, max_retries: int = 2) -> List[Dict]:
    """Step 2: Extract strengths with retry if too generic."""
    prompt = STRENGTHS_PROMPT.format(resume=resume_text)
    
    for attempt in range(max_retries):
        try:
            if attempt > 0:
                prompt += f"\n\nWARNING: Previous attempt was too generic. You MUST include specific company names, metrics, and details from the resume. Generic responses will be REJECTED."
            
            raw = call_groq(prompt, max_tokens=2000, temperature=0.2, response_format="json")
            data = json.loads(raw)
            strengths = data.get("strengths", [])
            
            # Validate specificity
            specific_count = sum(1 for s in strengths if is_specific(
                f"{s.get('title', '')} {s.get('summary', '')}", entities, min_score=3
            ))
            
            generic_ratio = 1 - (specific_count / len(strengths)) if strengths else 1
            print(f"[strengths] Attempt {attempt+1}: {specific_count}/{len(strengths)} specific (generic ratio: {generic_ratio:.0%})", file=sys.stderr)
            
            if generic_ratio > 0.5 and attempt < max_retries - 1:
                print(f"[strengths] Too generic, retrying...", file=sys.stderr)
                continue
            
            print(f"[strengths] ✓ Extracted {len(strengths)} strengths", file=sys.stderr)
            return strengths
            
        except Exception as e:
            print(f"[strengths] ✗ Attempt {attempt+1} failed: {e}", file=sys.stderr)
            if attempt == max_retries - 1:
                return []
    
    return []


def extract_improvements(resume_text: str, scores: Dict, entities: Dict) -> List[Dict]:
    """Step 3: Extract improvement areas."""
    prompt = IMPROVEMENTS_PROMPT.format(
        resume=resume_text,
        scores=json.dumps(scores, indent=2)
    )
    
    try:
        raw = call_groq(prompt, max_tokens=2000, temperature=0.2, response_format="json")
        data = json.loads(raw)
        improvements = data.get("improvements", [])
        
        print(f"[improvements] ✓ Extracted {len(improvements)} areas", file=sys.stderr)
        return improvements
        
    except Exception as e:
        print(f"[improvements] ✗ Failed: {e}", file=sys.stderr)
        return []


def extract_recommendations(
    resume_text: str, 
    scores: Dict, 
    strengths: List, 
    improvements: List,
    entities: Dict
) -> List[Dict]:
    """Step 4: Generate recommendations."""
    prompt = RECOMMENDATIONS_PROMPT.format(
        resume=resume_text,
        scores=json.dumps(scores, indent=2),
        strengths=json.dumps(strengths, indent=2),
        improvements=json.dumps(improvements, indent=2)
    )
    
    try:
        raw = call_groq(prompt, max_tokens=3000, temperature=0.3, response_format="json")
        data = json.loads(raw)
        recommendations = data.get("recommendations", [])
        
        print(f"[recommendations] ✓ Generated {len(recommendations)} items", file=sys.stderr)
        return recommendations
        
    except Exception as e:
        print(f"[recommendations] ✗ Failed: {e}", file=sys.stderr)
        return []


def generate_narrative(
    resume_text: str,
    scores: Dict,
    strengths: List,
    improvements: List,
    recommendations: List
) -> str:
    """Step 5: Generate detailed narrative assessment."""
    analysis = {
        "scores": scores,
        "strengths": strengths,
        "improvements": improvements,
        "recommendations": recommendations
    }
    
    prompt = NARRATIVE_PROMPT.format(
        resume=resume_text,
        analysis=json.dumps(analysis, indent=2, ensure_ascii=False)
    )
    
    try:
        narrative = call_groq(prompt, max_tokens=3000, temperature=0.4)
        print(f"[narrative] ✓ Generated {len(narrative)} chars", file=sys.stderr)
        return narrative
        
    except Exception as e:
        print(f"[narrative] ✗ Failed: {e}", file=sys.stderr)
        return "Narrative generation failed."


# ============================================================
# MAIN PIPELINE
# ============================================================

def run_pipeline(resume_text: str, include_improvement: bool = False) -> Dict[str, Any]:
    """Execute enhanced multi-call pipeline."""
    print("\n" + "="*60, file=sys.stderr)
    print("MBA ANALYSIS PIPELINE v5.2.0 (Enhanced Groq Multi-Call)", file=sys.stderr)
    print("="*60 + "\n", file=sys.stderr)
    
    # Step 0: Extract entities for validation
    print("Step 0: Extracting resume entities...", file=sys.stderr)
    entities = extract_resume_entities(resume_text)
    
    # Step 1: Score
    print("\nStep 1: Scoring resume...", file=sys.stderr)
    scores = score_resume(resume_text, entities)
    
    # Step 2: Strengths (with retry)
    print("\nStep 2: Extracting strengths...", file=sys.stderr)
    strengths = extract_strengths(resume_text, entities)
    
    # Step 3: Improvements
    print("\nStep 3: Identifying improvements...", file=sys.stderr)
    improvements = extract_improvements(resume_text, scores, entities)
    
    # Step 4: Recommendations
    print("\nStep 4: Generating recommendations...", file=sys.stderr)
    recommendations = extract_recommendations(resume_text, scores, strengths, improvements, entities)
    
    # Step 5: Narrative
    print("\nStep 5: Creating detailed narrative...", file=sys.stderr)
    narrative = generate_narrative(resume_text, scores, strengths, improvements, recommendations)
    
    print("\n" + "="*60, file=sys.stderr)
    print("PIPELINE COMPLETE", file=sys.stderr)
    print("="*60 + "\n", file=sys.stderr)
    
    return {
        "original_resume": resume_text,
        "scores": scores,
        "strengths": strengths,
        "improvements": improvements,
        "recommendations": recommendations,
        "narrative": narrative,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "pipeline_version": "5.2.0-groq-enhanced"
    }


# ============================================================
# CLI
# ============================================================

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Enhanced Groq MBA Pipeline v5.2.0")
    parser.add_argument("resume_text", nargs="?", default="", help="Resume text or file path")
    args = parser.parse_args()
    
    if not args.resume_text:
        print("Usage: python script.py <resume_text_or_file>", file=sys.stderr)
        sys.exit(1)
    
    if os.path.isfile(args.resume_text):
        with open(args.resume_text, 'r', encoding='utf-8') as f:
            resume_text = f.read()
    else:
        resume_text = args.resume_text
    
    result = run_pipeline(resume_text)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()