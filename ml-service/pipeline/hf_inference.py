#!/usr/bin/env python3
"""
HuggingFace Inference API wrapper for MBA pipeline
Updated to handle LoRA adapters and provide better guidance
"""

import os
import sys
import json
import time
import requests
from typing import Optional, Dict, Any

# -------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------
HF_API_KEY = os.environ.get("HF_API_KEY")
HF_MODEL = os.environ.get("HF_MODEL", "Mayururur/admit55-llama32-3b-merged")
HF_BASE_URL = os.environ.get("HF_BASE_URL", "https://router.huggingface.co")

# Check if this is a LoRA adapter (common patterns)
IS_LORA_ADAPTER = any(x in HF_MODEL.lower() for x in ["lora", "adapter", "peft"])

# Inference Endpoint URL (if using dedicated endpoint)
HF_ENDPOINT_URL = os.environ.get("HF_ENDPOINT_URL")

# Standard Inference API URL
HF_API_URL = HF_ENDPOINT_URL or f"{HF_BASE_URL}/models/{HF_MODEL}"

HF_TIMEOUT = int(os.environ.get("HF_TIMEOUT", "90"))
HF_MAX_RETRIES = int(os.environ.get("HF_MAX_RETRIES", "5"))

# -------------------------------------------------------
# STARTUP CHECK
# -------------------------------------------------------
def check_lora_configuration():
    """Check if LoRA adapter is being used and provide guidance."""
    if IS_LORA_ADAPTER and not HF_ENDPOINT_URL:
        print("\n" + "=" * 70, file=sys.stderr)
        print("⚠️  WARNING: LoRA Adapter Detected", file=sys.stderr)
        print("=" * 70, file=sys.stderr)
        print(f"Model: {HF_MODEL}", file=sys.stderr)
        print("\nLoRA adapters cannot be used directly with standard Inference API.", file=sys.stderr)
        print("\nOptions:", file=sys.stderr)
        print("1. MERGE LORA → FULL MODEL (Recommended, Free)", file=sys.stderr)
        print("   - Use the merge_lora_adapter.py script provided", file=sys.stderr)
        print("   - Creates a full model that works with Inference API", file=sys.stderr)
        print("\n2. USE INFERENCE ENDPOINT (Requires paid plan)", file=sys.stderr)
        print("   - Create endpoint at: https://huggingface.co/inference-endpoints", file=sys.stderr)
        print("   - Set HF_ENDPOINT_URL to your endpoint URL", file=sys.stderr)
        print("\n3. USE BASE MODEL FOR TESTING (Not fine-tuned)", file=sys.stderr)
        print("   - export HF_MODEL=\"meta-llama/Llama-3.2-3B-Instruct\"", file=sys.stderr)
        print("=" * 70 + "\n", file=sys.stderr)


# Run check on import
if __name__ != "__main__":
    check_lora_configuration()


# -------------------------------------------------------
# CUSTOM EXCEPTION
# -------------------------------------------------------
class HuggingFaceInferenceError(Exception):
    """Custom exception for HuggingFace API errors."""
    pass


# -------------------------------------------------------
# MAIN INFERENCE FUNCTION
# -------------------------------------------------------
def call_hf_inference(
    prompt: str,
    max_new_tokens: int = 250,
    temperature: float = 0.1,
    retry_count: Optional[int] = None,
    wait_for_model: bool = True
) -> str:
    """
    Call HuggingFace Inference API with comprehensive error handling.
    
    Args:
        prompt: Input prompt for the model
        max_new_tokens: Maximum tokens to generate (default: 250)
        temperature: Sampling temperature (0.0 = deterministic, default: 0.1)
        retry_count: Number of retries on failure (default: HF_MAX_RETRIES)
        wait_for_model: Wait if model is loading (default: True)
    
    Returns:
        Generated text from the model
    
    Raises:
        HuggingFaceInferenceError: If API call fails after all retries
    """
    if not HF_API_KEY:
        raise HuggingFaceInferenceError(
            "HF_API_KEY environment variable not set. "
            "Get your API key from https://huggingface.co/settings/tokens"
        )
    
    if not prompt or not isinstance(prompt, str):
        raise HuggingFaceInferenceError("Prompt must be a non-empty string")
    
    if retry_count is None:
        retry_count = HF_MAX_RETRIES
    
    # Prepare request
    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": max_new_tokens,
            "temperature": max(0.0, min(2.0, temperature)),  # Clamp between 0-2
            "return_full_text": False,
            "do_sample": temperature > 0.0,
            "top_p": 0.95 if temperature > 0 else None,
        },
        "options": {
            "wait_for_model": wait_for_model,
            "use_cache": False  # Get fresh results
        }
    }
    
    # Remove None values from parameters
    payload["parameters"] = {k: v for k, v in payload["parameters"].items() if v is not None}
    
    last_error = None
    model_loading_wait_time = 0
    
    print(f"[HF] Calling model: {HF_MODEL}", file=sys.stderr)
    if HF_ENDPOINT_URL:
        print(f"[HF] Using endpoint: {HF_ENDPOINT_URL}", file=sys.stderr)
    print(f"[HF] Max tokens: {max_new_tokens}, Temperature: {temperature}", file=sys.stderr)
    
    for attempt in range(retry_count):
        try:
            print(f"[HF] Attempt {attempt + 1}/{retry_count}...", file=sys.stderr)
            
            response = requests.post(
                HF_API_URL,
                headers=headers,
                json=payload,
                timeout=HF_TIMEOUT
            )
            
            # Handle model loading (503)
            if response.status_code == 503:
                try:
                    error_data = response.json()
                    
                    # Check if this is a LoRA adapter issue
                    error_msg = error_data.get("error", "").lower()
                    if "adapter" in error_msg or "lora" in error_msg or "peft" in error_msg:
                        raise HuggingFaceInferenceError(
                            f"LoRA adapter cannot be used with standard Inference API.\n"
                            f"Error: {error_data.get('error', 'Unknown error')}\n\n"
                            f"Solutions:\n"
                            f"1. Merge LoRA to full model (use merge_lora_adapter.py)\n"
                            f"2. Create Inference Endpoint: https://huggingface.co/inference-endpoints\n"
                            f"3. Use base model for testing: meta-llama/Llama-3.2-3B-Instruct"
                        )
                    
                    if "error" in error_data and "estimated_time" in error_data:
                        estimated_time = float(error_data.get("estimated_time", 20))
                        
                        # Only wait if within reasonable limits
                        if wait_for_model and model_loading_wait_time < 120:
                            wait_time = min(estimated_time + 5, 30)  # Cap at 30s per wait
                            model_loading_wait_time += wait_time
                            
                            print(
                                f"[HF] Model loading... Estimated: {estimated_time:.1f}s, "
                                f"Waiting: {wait_time:.1f}s (Total waited: {model_loading_wait_time:.1f}s)",
                                file=sys.stderr
                            )
                            time.sleep(wait_time)
                            continue
                        else:
                            raise HuggingFaceInferenceError(
                                f"Model is loading. Please try again in {estimated_time:.0f}s. "
                                f"Or visit: https://huggingface.co/{HF_MODEL}"
                            )
                except json.JSONDecodeError:
                    pass
                
                last_error = f"Model unavailable (503): {response.text[:200]}"
                if attempt < retry_count - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    continue
                raise HuggingFaceInferenceError(last_error)
            
            # Handle rate limiting (429)
            if response.status_code == 429:
                last_error = "Rate limit exceeded. Please try again later or upgrade your HF plan."
                if attempt < retry_count - 1:
                    wait_time = 2 ** (attempt + 2)  # Longer backoff for rate limits
                    print(f"[HF] Rate limited, waiting {wait_time}s...", file=sys.stderr)
                    time.sleep(wait_time)
                    continue
                raise HuggingFaceInferenceError(last_error)
            
            # Handle authentication errors (401, 403)
            if response.status_code in [401, 403]:
                raise HuggingFaceInferenceError(
                    f"Authentication failed (HTTP {response.status_code}). "
                    f"Check your HF_API_KEY is valid and has access to model: {HF_MODEL}"
                )
            
            # Handle not found (404)
            if response.status_code == 404:
                raise HuggingFaceInferenceError(
                    f"Model not found: {HF_MODEL}. "
                    f"Check the model exists at https://huggingface.co/{HF_MODEL}"
                )
            
            # Handle bad request (400) - often indicates LoRA issues
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    error_msg = error_data.get("error", response.text)
                    
                    if IS_LORA_ADAPTER:
                        raise HuggingFaceInferenceError(
                            f"Bad request (400) - likely due to LoRA adapter.\n"
                            f"Error: {error_msg}\n\n"
                            f"LoRA adapters need to be merged with base model first.\n"
                            f"Use merge_lora_adapter.py to create a full model."
                        )
                    else:
                        raise HuggingFaceInferenceError(f"Bad request (400): {error_msg}")
                except json.JSONDecodeError:
                    raise HuggingFaceInferenceError(f"Bad request (400): {response.text[:500]}")
            
            # Handle other errors
            if response.status_code != 200:
                error_text = response.text[:500]
                last_error = f"HTTP {response.status_code}: {error_text}"
                
                if attempt < retry_count - 1:
                    print(f"[HF] Error: {last_error}, retrying...", file=sys.stderr)
                    time.sleep(2 ** attempt)
                    continue
                raise HuggingFaceInferenceError(last_error)
            
            # Parse successful response
            result = response.json()
            generated_text = extract_generated_text(result)
            
            if not generated_text:
                raise HuggingFaceInferenceError(f"Empty response from model. Raw: {result}")
            
            print(f"[HF] [OK] Generated {len(generated_text)} characters", file=sys.stderr)
            return generated_text
            
        except requests.exceptions.Timeout:
            last_error = f"Request timed out after {HF_TIMEOUT}s"
            print(f"[HF] {last_error}", file=sys.stderr)
            if attempt < retry_count - 1:
                time.sleep(2)
                continue
                
        except requests.exceptions.ConnectionError as e:
            last_error = f"Connection failed: {e}"
            print(f"[HF] {last_error}", file=sys.stderr)
            if attempt < retry_count - 1:
                time.sleep(2 ** attempt)
                continue
                
        except requests.exceptions.RequestException as e:
            last_error = f"Request failed: {e}"
            print(f"[HF] {last_error}", file=sys.stderr)
            if attempt < retry_count - 1:
                time.sleep(2)
                continue
        
        except HuggingFaceInferenceError:
            # Re-raise our custom errors immediately
            raise
            
        except Exception as e:
            last_error = f"Unexpected error: {e}"
            print(f"[HF] {last_error}", file=sys.stderr)
            if attempt < retry_count - 1:
                time.sleep(2)
                continue
    
    # All retries exhausted
    raise HuggingFaceInferenceError(
        f"Failed after {retry_count} attempts. Last error: {last_error}"
    )


# -------------------------------------------------------
# RESPONSE PARSER
# -------------------------------------------------------
def extract_generated_text(result: Any) -> str:
    """
    Extract generated text from various HuggingFace response formats.
    
    HF API can return different formats:
    - [{"generated_text": "..."}]
    - {"generated_text": "..."}
    - "direct string"
    - [{"text": "..."}]  (some models)
    """
    if isinstance(result, list) and len(result) > 0:
        item = result[0]
        
        if isinstance(item, dict):
            # Try different keys
            for key in ["generated_text", "text", "output"]:
                if key in item:
                    return str(item[key]).strip()
        elif isinstance(item, str):
            return item.strip()
    
    elif isinstance(result, dict):
        # Try different keys
        for key in ["generated_text", "text", "output"]:
            if key in result:
                return str(result[key]).strip()
    
    elif isinstance(result, str):
        return result.strip()
    
    # If we can't parse, return empty string
    return ""


# -------------------------------------------------------
# CONNECTION TEST
# -------------------------------------------------------
def test_hf_connection() -> bool:
    """
    Test if HuggingFace API is accessible and model responds.
    
    Returns:
        True if connection successful, False otherwise
    """
    try:
        print("[HF] Testing connection...", file=sys.stderr)
        result = call_hf_inference(
            "Score this on 0-10: Strong technical background",
            max_new_tokens=20,
            temperature=0.0,
            retry_count=2,
            wait_for_model=True
        )
        
        print(f"[HF] ✓ Connection test passed", file=sys.stderr)
        print(f"[HF] Test response: {result[:100]}...", file=sys.stderr)
        return True
        
    except HuggingFaceInferenceError as e:
        print(f"[HF] ✗ Connection test failed: {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"[HF] ✗ Unexpected error during test: {e}", file=sys.stderr)
        return False


# -------------------------------------------------------
# MODEL INFO
# -------------------------------------------------------
def get_model_info() -> Dict[str, Any]:
    """
    Get information about the configured HuggingFace model.
    
    Returns:
        Dictionary with model configuration
    """
    return {
        "model_id": HF_MODEL,
        "api_url": HF_API_URL,
        "is_lora_adapter": IS_LORA_ADAPTER,
        "using_endpoint": bool(HF_ENDPOINT_URL),
        "endpoint_url": HF_ENDPOINT_URL,
        "timeout": HF_TIMEOUT,
        "max_retries": HF_MAX_RETRIES,
        "api_key_set": bool(HF_API_KEY),
        "model_url": f"https://huggingface.co/{HF_MODEL}"
    }


# -------------------------------------------------------
# MAIN (for testing)
# -------------------------------------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("HuggingFace Inference Test")
    print("=" * 60)
    
    # Print config
    info = get_model_info()
    print("\nConfiguration:")
    for key, value in info.items():
        print(f"  {key}: {value}")
    
    # Check LoRA configuration
    if IS_LORA_ADAPTER:
        check_lora_configuration()
    
    # Test connection
    print("\nTesting connection...")
    if test_hf_connection():
        print("\n✓ HuggingFace API is working correctly!")
        
        # Try a scoring prompt
        print("\nTesting scoring prompt...")
        test_prompt = """You are an MBA admissions scorer. Score this resume on academics (0-10):

Resume: BS Computer Science, GPA 3.8, Stanford University

Return ONLY JSON: {"academics": <score>}"""
        
        try:
            result = call_hf_inference(test_prompt, max_new_tokens=50, temperature=0.0)
            print(f"\nScoring result: {result}")
        except Exception as e:
            print(f"\n✗ Scoring test failed: {e}")
    else:
        print("\n✗ HuggingFace API connection failed!")
        print("\nTroubleshooting:")
        print("1. Check HF_API_KEY is set correctly")
        print("2. Verify model exists: https://huggingface.co/" + HF_MODEL)
        print("3. Check your HF account has access to the model")
        
        if IS_LORA_ADAPTER:
            print("\n⚠️  LoRA ADAPTER DETECTED:")
            print("4. Merge LoRA to full model (run merge_lora_adapter.py)")
            print("5. OR create Inference Endpoint")
            print("6. OR use base model for testing")