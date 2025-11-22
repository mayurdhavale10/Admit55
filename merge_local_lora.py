#!/usr/bin/env python3
"""
Merge Local LoRA Adapter with Base Model (GPU Version)
Uses your existing trained LoRA from llama32_3b_lora_out/lora_adapters
"""

from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch
import os

# ===== CONFIGURATION =====
BASE_MODEL = "meta-llama/Llama-3.2-3B-Instruct"
LOCAL_LORA_PATH = r"C:\Users\dhava\Downloads\Admit55\admit55\llama32_3b_lora_out\lora_adapters"
LOCAL_TOKENIZER_PATH = r"C:\Users\dhava\Downloads\Admit55\admit55\llama32_3b_lora_out\tokenizer"
OUTPUT_HF_NAME = "Mayururur/admit55-llama32-3b-merged"

print("=" * 70)
print("LOCAL LORA MERGE SCRIPT (GPU)")
print("=" * 70)
print(f"\nBase Model: {BASE_MODEL}")
print(f"Local LoRA: {LOCAL_LORA_PATH}")
print(f"Output HF: {OUTPUT_HF_NAME}")
print("\n" + "=" * 70)

# Check CUDA availability
if torch.cuda.is_available():
    print(f"\n✓ GPU Available: {torch.cuda.get_device_name(0)}")
    print(f"  VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    device = "cuda"
else:
    print("\n⚠ No GPU found, using CPU (will be slower)")
    device = "cpu"

# Check local files exist
if not os.path.exists(LOCAL_LORA_PATH):
    print(f"\n✗ ERROR: LoRA path not found: {LOCAL_LORA_PATH}")
    print("Make sure the path is correct!")
    exit(1)

adapter_file = os.path.join(LOCAL_LORA_PATH, "adapter_model.safetensors")
if not os.path.exists(adapter_file):
    print(f"\n✗ ERROR: adapter_model.safetensors not found in {LOCAL_LORA_PATH}")
    exit(1)

print(f"\n✓ Found local LoRA files")
print(f"  - adapter_model.safetensors ({os.path.getsize(adapter_file) / 1024 / 1024:.1f} MB)")

try:
    # Step 1: Load base model to GPU
    print("\n[1/6] Loading base Llama 3.2 3B model to GPU...")
    print("(This may take 1-2 minutes)")
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        device_map={"": 0} if device == "cuda" else None,  # Load entire model to GPU 0
        low_cpu_mem_usage=True
    )
    print(f"✓ Base model loaded to {device}")
    
    # Step 2: Load tokenizer
    print("\n[2/6] Loading tokenizer...")
    if os.path.exists(LOCAL_TOKENIZER_PATH):
        print(f"  Using local tokenizer from: {LOCAL_TOKENIZER_PATH}")
        tokenizer = AutoTokenizer.from_pretrained(LOCAL_TOKENIZER_PATH)
    else:
        print(f"  Using tokenizer from base model: {BASE_MODEL}")
        tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    print("✓ Tokenizer loaded")
    
    # Step 3: Load local LoRA adapter
    print(f"\n[3/6] Loading your trained LoRA adapter from local files...")
    model = PeftModel.from_pretrained(base_model, LOCAL_LORA_PATH)
    print("✓ LoRA adapter loaded and applied to base model")
    
    # Step 4: Merge
    print("\n[4/6] Merging LoRA weights into base model...")
    print("(This combines your fine-tuned weights with the base model)")
    merged_model = model.merge_and_unload()
    print("✓ Models merged successfully!")
    
    # Step 5: Save locally first (optional but recommended)
    print("\n[5/6] Saving merged model locally...")
    local_save_path = r"C:\Users\dhava\Downloads\Admit55\admit55\merged_model"
    
    # Move model to CPU before saving to avoid CUDA issues
    print("  Moving model to CPU for saving...")
    merged_model = merged_model.to("cpu")
    
    merged_model.save_pretrained(local_save_path)
    tokenizer.save_pretrained(local_save_path)
    print(f"✓ Saved to: {local_save_path}")
    
    # Step 6: Upload to HuggingFace (AUTO-DEPLOY!)
    print(f"\n[6/6] Auto-deploying to HuggingFace as: {OUTPUT_HF_NAME}")
    print("(This uploads the merged model to HuggingFace Hub)")
    print("(Upload may take 5-10 minutes depending on your internet speed)")
    
    merged_model.push_to_hub(OUTPUT_HF_NAME, private=False)
    tokenizer.push_to_hub(OUTPUT_HF_NAME, private=False)
    
    print(f"\n✓ Successfully uploaded to HuggingFace Hub!")
    print(f"  URL: https://huggingface.co/{OUTPUT_HF_NAME}")
    
    print("\n" + "=" * 70)
    print("✓✓✓ SUCCESS! ✓✓✓")
    print("=" * 70)
    print("\nYour fine-tuned model is now deployed and ready to use!")
    print("\nNext steps:")
    print("1. Update your .env file:")
    print(f"   HF_MODEL={OUTPUT_HF_NAME}")
    print("\n2. Restart your application:")
    print("   npm run dev")
    print("\n3. Your MBA scoring pipeline will now use your fine-tuned model!")
    print("\n4. The model is live at: https://huggingface.co/" + OUTPUT_HF_NAME)
    print("=" * 70)
    
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    print("\n" + "=" * 70)
    print("Troubleshooting:")
    print("=" * 70)
    
    if "login" in str(e).lower() or "token" in str(e).lower():
        print("1. Make sure you're logged in:")
        print("   huggingface-cli login")
        print("   (Get token from: https://huggingface.co/settings/tokens)")
    
    if "llama" in str(e).lower() or "meta-llama" in str(e).lower():
        print("\n2. Request access to Llama 3.2:")
        print("   Visit: https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct")
        print("   Click 'Request Access' and wait for approval (usually instant)")
    
    if "memory" in str(e).lower() or "out of memory" in str(e).lower():
        print("\n3. GPU Memory issue:")
        print("   - Close other applications using GPU")
        print("   - Or use the CPU version (slower but works)")
    
    if "cuda" in str(e).lower() and "available" in str(e).lower():
        print("\n3. CUDA not available:")
        print("   - Make sure PyTorch with CUDA is installed")
        print("   - Check: python -c \"import torch; print(torch.cuda.is_available())\"")
    
    print("\n4. Make sure packages are installed:")
    print("   pip install transformers peft torch accelerate")
    
    import traceback
    print("\nFull error details:")
    print(traceback.format_exc())