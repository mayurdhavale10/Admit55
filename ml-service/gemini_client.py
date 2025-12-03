#!/usr/bin/env python3
"""
Gemini client for MBA pipeline
Uses Google Generative Language REST API
"""

import os
import sys
import time
import json
import requests

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
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
    model: str = None,  # allow caller to override model
) -> str:
    """
    Basic Gemini text completion helper.
    Takes a plain text prompt and returns the model's text response.
    Retries on transient HTTP errors.
    
    Args:
        prompt: The text prompt to send
        temperature: Sampling temperature (0.0-1.0)
        max_output_tokens: Max tokens to generate
        retry_count: Number of retry attempts on failure
        timeout: Request timeout in seconds
        model: Model to use (overrides GEMINI_MODEL env var if provided)
    """
    if not GEMINI_API_KEY:
        raise GeminiError("GEMINI_API_KEY is not set")

    if not prompt or not isinstance(prompt, str):
        raise GeminiError("Prompt must be a non-empty string")

    # Use provided model or fall back to default
    gemini_model = model or DEFAULT_GEMINI_MODEL
    
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

    last_error = None

    for attempt in range(1, retry_count + 1):
        try:
            print(
                f"[Gemini] Calling {gemini_model}, attempt {attempt}/{retry_count}",
                file=sys.stderr,
            )
            resp = requests.post(url, json=payload, timeout=timeout)

            if resp.status_code == 429:
                # Rate limit
                last_error = f"Rate limited: {resp.text[:200]}"
                wait = 2 ** attempt
                print(f"[Gemini] 429 rate limit, waiting {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue

            if resp.status_code >= 500:
                # Server error
                last_error = f"Server error {resp.status_code}: {resp.text[:200]}"
                wait = 2 ** attempt
                print(
                    f"[Gemini] {last_error}, retrying in {wait}s...",
                    file=sys.stderr,
                )
                time.sleep(wait)
                continue

            # Other non-OK statuses
            if resp.status_code != 200:
                error_text = resp.text[:500]
                print(f"[Gemini] HTTP {resp.status_code}: {error_text}", file=sys.stderr)
                raise GeminiError(f"HTTP {resp.status_code}: {error_text}")

            data = resp.json()

            # --------- Robust parsing for B-school pipeline ---------
            candidates = data.get("candidates", [])
            if not candidates:
                error_msg = f"Gemini returned no candidates: {data}"
                print(f"[Gemini] {error_msg}", file=sys.stderr)
                raise GeminiError(error_msg)

            first = candidates[0]
            content = first.get("content") or {}
            parts = content.get("parts") or []
            finish_reason = first.get("finishReason")

            # If there are no parts AND we hit MAX_TOKENS, return a minimal JSON stub
            # so the downstream bschool_match_pipeline can fall back to its hardcoded list.
            if not parts:
                if finish_reason == "MAX_TOKENS":
                    print(
                        "[Gemini] MAX_TOKENS with empty parts; returning minimal JSON stub for fallback",
                        file=sys.stderr,
                    )
                    fallback_json = {
                        "summary": {
                            "profile_snapshot": "",
                            "target_strategy": "",
                            "key_factors": [],
                        },
                        "matches": [],
                        "tiers": {},
                    }
                    text = json.dumps(fallback_json)
                    return text

                error_msg = f"Unexpected Gemini response structure: {data}"
                print(f"[Gemini] {error_msg}", file=sys.stderr)
                raise GeminiError(error_msg)

            # Collect text from parts
            texts = []
            for p in parts:
                if isinstance(p, dict) and isinstance(p.get("text"), str):
                    texts.append(p["text"])

            # Edge case: parts exist but no text fields
            if not texts:
                if finish_reason == "MAX_TOKENS":
                    print(
                        "[Gemini] MAX_TOKENS with non-text parts; returning minimal JSON stub for fallback",
                        file=sys.stderr,
                    )
                    fallback_json = {
                        "summary": {
                            "profile_snapshot": "",
                            "target_strategy": "",
                            "key_factors": [],
                        },
                        "matches": [],
                        "tiers": {},
                    }
                    text = json.dumps(fallback_json)
                    return text

                error_msg = f"Gemini response had parts but no text: {data}"
                print(f"[Gemini] {error_msg}", file=sys.stderr)
                raise GeminiError(error_msg)

            text = "\n".join(texts).strip()
            print(f"[Gemini] [OK] Generated {len(text)} chars", file=sys.stderr)
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
            # Our own logical/API error – don't auto-retry unless it's network-level
            raise
        except Exception as e:
            last_error = f"Unexpected error: {e}"
            print(f"[Gemini] {last_error}", file=sys.stderr)
            if attempt < retry_count:
                wait = 2 ** attempt
                print(f"[Gemini] Retrying in {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue

    raise GeminiError(last_error or "Gemini call failed after all retries")
