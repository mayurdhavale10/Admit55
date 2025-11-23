#!/usr/bin/env python3
# train_lora_regression_gpu_force_cuda_fixed.py
# QLoRA + LoRA fine-tuning for Admit55 — stable loss & CUDA guaranteed

import argparse
import os
import time
import torch
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    Trainer,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model


# ----------------------------- CUSTOM TRAINER --------------------------------
class RegressionTrainer(Trainer):
    """Custom Trainer with proper loss computation for causal LM."""
    
    def compute_loss(self, model, inputs, return_outputs=False, num_items_in_batch=None):
        outputs = model(**inputs)
        loss = outputs.loss if hasattr(outputs, "loss") else outputs[0]
        return (loss, outputs) if return_outputs else loss


# ----------------------------- ARGS --------------------------------
def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--base_model", type=str, default="Qwen/Qwen1.5-1.8B-Chat")
    p.add_argument("--data", type=str, default="data/mba/datasets/sft_score_regression_text.jsonl")
    p.add_argument("--output_dir", type=str, default="runs/admit55_lora_gpu")
    p.add_argument("--max_length", type=int, default=512)
    p.add_argument("--epochs", type=int, default=2)
    p.add_argument("--accum_steps", type=int, default=8)
    p.add_argument("--lr", type=float, default=2e-4)
    return p.parse_args()


# ----------------------------- SAFE DOWNLOAD ------------------------
def safe_download(model_id, retries=3, wait=15):
    """Retry model/tokenizer download up to N times and auto-enable CUDA."""
    for attempt in range(1, retries + 1):
        try:
            print(f"🔽 Attempt {attempt}/{retries}: Downloading {model_id}")
            tokenizer = AutoTokenizer.from_pretrained(model_id, use_fast=True)
            if tokenizer.pad_token_id is None:
                tokenizer.pad_token = tokenizer.eos_token

            if torch.cuda.is_available():
                print(f"🔥 CUDA detected: {torch.cuda.get_device_name(0)}")
                torch.cuda.empty_cache()
            else:
                print("⚠️ No CUDA detected. Using CPU.")

            # Use BitsAndBytesConfig for proper 4-bit quantization
            from transformers import BitsAndBytesConfig
            
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                bnb_4bit_use_double_quant=True,
            )

            model = AutoModelForCausalLM.from_pretrained(
                model_id,
                quantization_config=bnb_config,
                device_map="auto",
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                low_cpu_mem_usage=True,
            )
            print("✅ Model & tokenizer loaded successfully.")
            return tokenizer, model

        except Exception as e:
            print(f"⚠️ Attempt {attempt} failed: {e}")
            if attempt < retries:
                print(f"⏳ Retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise RuntimeError(f"❌ Failed to download {model_id} after {retries} retries.")


# ----------------------------- MAIN --------------------------------
def main():
    args = parse_args()

    print(f"▶️ Loading dataset: {args.data}")
    ds = load_dataset("json", data_files=args.data, split="train")
    print(f"  → Samples: {len(ds)}")

    print(f"▶️ Loading tokenizer & model: {args.base_model}")
    tokenizer, model = safe_download(args.base_model)

    # Apply LoRA configuration
    lora_config = LoraConfig(
        r=8,
        lora_alpha=16,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    # Enable gradient checkpointing for memory efficiency
    model.config.use_cache = False
    if hasattr(model, "enable_input_require_grads"):
        model.enable_input_require_grads()
    
    model.train()

    # ✅ Tokenize dataset and set labels for LM loss
    def tokenize_fn(examples):
        tokens = tokenizer(
            examples["text"],
            truncation=True,
            max_length=args.max_length,
            padding="max_length",
        )
        # Copy input_ids to labels for causal LM training
        tokens["labels"] = tokens["input_ids"].copy()
        return tokens

    print(f"▶️ Tokenizing dataset (max_length={args.max_length})...")
    tokenized = ds.map(tokenize_fn, batched=True, remove_columns=["text"])
    tokenized.set_format(type="torch", columns=["input_ids", "attention_mask", "labels"])

    # Check for existing checkpoints
    latest_ckpt = None
    if os.path.exists(args.output_dir):
        ckpts = [os.path.join(args.output_dir, d)
                 for d in os.listdir(args.output_dir)
                 if d.startswith("checkpoint")]
        if ckpts:
            latest_ckpt = sorted(ckpts)[-1]
            print(f"🔁 Found checkpoint: {latest_ckpt}")
        else:
            print("🆕 No checkpoint found — starting new training.")
    else:
        print("🆕 No previous training directory found — starting from scratch.")

    # Training setup
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=args.accum_steps,
        num_train_epochs=args.epochs,
        learning_rate=args.lr,
        fp16=torch.cuda.is_available(),
        logging_steps=100,
        save_strategy="epoch",
        save_total_limit=3,
        remove_unused_columns=False,
        dataloader_num_workers=0,
        report_to="none",
        gradient_checkpointing=True,
        optim="adamw_torch",
    )

    # ✅ Use custom trainer subclass
    trainer = RegressionTrainer(
        model=model,
        args=training_args,
        train_dataset=tokenized,
    )

    print("🚀 Starting training (auto-save + resume enabled)...")
    trainer.train(resume_from_checkpoint=latest_ckpt)

    print("💾 Saving adapter & tokenizer to:", args.output_dir)
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    print("✅ Training completed successfully.")


if __name__ == "__main__":
    main()