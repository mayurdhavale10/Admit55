#!/usr/bin/env python3
"""
Gemini client for MBA pipeline - FIXED VERSION
Uses Google Generative Language REST API

Changes:
1. Added detailed token usage logging
2. Better MAX_TOKENS detection and warnings
3. More descriptive error messages
"""

import os
import sys
import time
import json
import requests

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")  # Changed default
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"


class GeminiError(Exception):
    """Custom exception for Gemini API errors."""
    pass


def call_gemini(
    prompt: str,
    temperature: float = 0.2,
    max_output_tokens: int = 1024,
    retry_count: int = 2,
    timeout: int = 120,
    model: str = None,
) -> str:
    """
    Basic Gemini text completion helper.
    
    Args:
        prompt: The text prompt to send
        temperature: Sampling temperature (0.0-1.0)
        max_output_tokens: Max tokens to generate (increased default recommended)
        retry_count: Number of retry attempts on failure
        timeout: Request timeout in seconds
        model: Model to use (overrides GEMINI_MODEL env var if provided)
    
    Returns:
        Generated text string
    
    Raises:
        GeminiError: On API failures or invalid responses
    """
    if not GEMINI_API_KEY:
        raise GeminiError("GEMINI_API_KEY is not set")

    if not prompt or not isinstance(prompt, str):
        raise GeminiError("Prompt must be a non-empty string")

    # Use provided model or fall back to default
    gemini_model = model or DEFAULT_GEMINI_MODEL
    
    # ✅ ADDED: Warn if prompt is very large
    prompt_chars = len(prompt)
    estimated_tokens = prompt_chars // 4  # Rough estimate: 1 token ≈ 4 chars
    print(f"[Gemini] Prompt size: {prompt_chars:,} chars (~{estimated_tokens:,} tokens)", file=sys.stderr)
    
    if estimated_tokens > 25000:
        print(f"[Gemini] ⚠️ WARNING: Large prompt may leave little room for response!", file=sys.stderr)
        print(f"[Gemini] ⚠️ Consider reducing input size to < 20K chars", file=sys.stderr)
    
    url = f"{BASE_URL}/models/{gemini_model}:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": float(temperature),
            "maxOutputTokens": int(max_output_tokens),
        },
    }
    
    # ✅ ADDED: Log generation config
    print(f"[Gemini] Model: {gemini_model}", file=sys.stderr)
    print(f"[Gemini] Temperature: {temperature}", file=sys.stderr)
    print(f"[Gemini] Max output tokens: {max_output_tokens:,}", file=sys.stderr)

    last_error = None

    for attempt in range(1, retry_count + 1):
        try:
            print(f"[Gemini] Calling API, attempt {attempt}/{retry_count}", file=sys.stderr)
            start_time = time.time()
            
            resp = requests.post(url, json=payload, timeout=timeout)
            
            elapsed = time.time() - start_time
            print(f"[Gemini] API response in {elapsed:.2f}s", file=sys.stderr)

            if resp.status_code == 429:
                last_error = f"Rate limited: {resp.text[:200]}"
                wait = 2 ** attempt
                print(f"[Gemini] 429 rate limit, waiting {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue

            if resp.status_code >= 500:
                last_error = f"Server error {resp.status_code}: {resp.text[:200]}"
                wait = 2 ** attempt
                print(f"[Gemini] {last_error}, retrying in {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue

            if resp.status_code != 200:
                error_text = resp.text[:500]
                print(f"[Gemini] HTTP {resp.status_code}: {error_text}", file=sys.stderr)
                raise GeminiError(f"HTTP {resp.status_code}: {error_text}")

            data = resp.json()
            
            # ✅ ADDED: Log usage metadata if available
            usage_metadata = data.get("usageMetadata", {})
            if usage_metadata:
                prompt_tokens = usage_metadata.get("promptTokenCount", 0)
                output_tokens = usage_metadata.get("candidatesTokenCount", 0)
                total_tokens = usage_metadata.get("totalTokenCount", 0)
                print(f"[Gemini] Token usage: {prompt_tokens:,} input + {output_tokens:,} output = {total_tokens:,} total", file=sys.stderr)

            # Parse response
            candidates = data.get("candidates", [])
            if not candidates:
                error_msg = f"Gemini returned no candidates. Response: {json.dumps(data, indent=2)[:500]}"
                print(f"[Gemini] {error_msg}", file=sys.stderr)
                raise GeminiError(error_msg)

            first = candidates[0]
            content = first.get("content") or {}
            parts = content.get("parts") or []
            finish_reason = first.get("finishReason")
            
            # ✅ IMPROVED: Better finish reason logging
            print(f"[Gemini] Finish reason: {finish_reason}", file=sys.stderr)

            # Handle MAX_TOKENS case
            if not parts:
                if finish_reason == "MAX_TOKENS":
                    print("[Gemini] ❌ MAX_TOKENS hit with no output!", file=sys.stderr)
                    print("[Gemini] 🔧 SOLUTION: Reduce input size or increase max_output_tokens", file=sys.stderr)
                    print("[Gemini] Returning minimal JSON stub for fallback", file=sys.stderr)
                    
                    fallback_json = {
                        "summary": {
                            "profile_snapshot": "Model hit token limit - input too large",
                            "target_strategy": "Reduce profile size and retry",
                            "key_factors": [],
                        },
                        "matches": [],
                        "tiers": {},
                    }
                    return json.dumps(fallback_json)

                error_msg = f"Unexpected response structure: {json.dumps(data, indent=2)[:500]}"
                print(f"[Gemini] {error_msg}", file=sys.stderr)
                raise GeminiError(error_msg)

            # Collect text from parts
            texts = []
            for p in parts:
                if isinstance(p, dict) and isinstance(p.get("text"), str):
                    texts.append(p["text"])

            if not texts:
                if finish_reason == "MAX_TOKENS":
                    print("[Gemini] ❌ MAX_TOKENS hit with non-text parts!", file=sys.stderr)
                    print("[Gemini] 🔧 SOLUTION: Reduce input size significantly", file=sys.stderr)
                    
                    fallback_json = {
                        "summary": {
                            "profile_snapshot": "Token limit exceeded",
                            "target_strategy": "Reduce input and retry",
                            "key_factors": [],
                        },
                        "matches": [],
                        "tiers": {},
                    }
                    return json.dumps(fallback_json)

                error_msg = f"Response had parts but no text: {json.dumps(data, indent=2)[:500]}"
                print(f"[Gemini] {error_msg}", file=sys.stderr)
                raise GeminiError(error_msg)

            text = "\n".join(texts).strip()
            output_chars = len(text)
            
            print(f"[Gemini] ✓ Generated {output_chars:,} chars", file=sys.stderr)
            
            # ✅ ADDED: Warn if output is suspiciously short
            if output_chars < 500 and finish_reason == "MAX_TOKENS":
                print(f"[Gemini] ⚠️ Output very short ({output_chars} chars) despite MAX_TOKENS", file=sys.stderr)
                print(f"[Gemini] ⚠️ Input likely too large - reduce to < 20K chars", file=sys.stderr)
            
            # ✅ ADDED: Preview output for debugging
            preview = text[:200].replace("\n", " ")
            print(f"[Gemini] Output preview: {preview}...", file=sys.stderr)
            
            return text

        except (requests.Timeout, requests.ConnectionError) as e:
            last_error = f"Network error: {e}"
            print(f"[Gemini] {last_error}", file=sys.stderr)
            if attempt < retry_count:
                wait = 2 ** attempt
                print(f"[Gemini] Retrying in {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue
        except GeminiError as e:
            raise
        except Exception as e:
            last_error = f"Unexpected error: {type(e).__name__}: {e}"
            print(f"[Gemini] {last_error}", file=sys.stderr)
            if attempt < retry_count:
                wait = 2 ** attempt
                print(f"[Gemini] Retrying in {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue

    raise GeminiError(last_error or "Gemini call failed after all retries")