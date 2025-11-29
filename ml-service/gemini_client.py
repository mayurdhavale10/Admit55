#!/usr/bin/env python3
"""
Gemini client for MBA pipeline
Uses Google Generative Language REST API
"""

import os
import sys
import time
import requests

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-pro-preview")
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
) -> str:
    """
    Basic Gemini text completion helper.
    Takes a plain text prompt and returns the model's text response.
    Retries on transient HTTP errors.
    """
    if not GEMINI_API_KEY:
        raise GeminiError("GEMINI_API_KEY is not set")

    if not prompt or not isinstance(prompt, str):
        raise GeminiError("Prompt must be a non-empty string")

    url = f"{BASE_URL}/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

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
            print(f"[Gemini] Calling {GEMINI_MODEL}, attempt {attempt}/{retry_count}", file=sys.stderr)
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
                print(f"[Gemini] {last_error}, retrying in {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue

            # Other non-OK statuses
            if resp.status_code != 200:
                raise GeminiError(f"HTTP {resp.status_code}: {resp.text[:500]}")

            data = resp.json()

            # Expected path: candidates[0].content.parts[0].text
            try:
                text = data["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError) as e:
                raise GeminiError(f"Unexpected Gemini response structure: {data}") from e

            text = (text or "").strip()
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
            # Our own logical/API error, no point in retrying unless 5xx/429 above
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
