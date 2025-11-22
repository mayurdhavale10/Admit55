import os
import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM

LORA_DIR = "llama32_3b_lora_out"
BASE_MODEL = "meta-llama/Llama-3.2-3B-Instruct"

def find_lora_files():
    print("🔍 Searching for LoRA weight files...")

    for root, dirs, files in os.walk(LORA_DIR):
        for f in files:
            if "adapter" in f and f.endswith(".safetensors"):
                config = None
                # check for config
                for fc in files:
                    if fc == "adapter_config.json":
                        config = fc
                return os.path.join(root, f), os.path.join(root, config) if config else None
            
    return None, None


def main():
    print("=== Checking LoRA Weight Files ===")

    if not os.path.isdir(LORA_DIR):
        print(f"❌ ERROR: Folder not found: {LORA_DIR}")
        return

    model_path, config_path = find_lora_files()

    if not model_path:
        print("❌ No LoRA adapter model found.")
        return

    print(f"✅ LoRA model found at:\n{model_path}")
    print(f"✅ LoRA config found at:\n{config_path}")

    print("\n🚀 Loading model...")
    try:
        base = AutoModelForCausalLM.from_pretrained(BASE_MODEL, device_map="cpu")
        peft_model = PeftModel.from_pretrained(base, os.path.dirname(model_path))
        print("🎉 SUCCESS: LoRA loaded correctly!")
    except Exception as e:
        print("❌ Failed to load LoRA model:", str(e))


if __name__ == "__main__":
    main()
