# train_llama_lora_accelerate.py

import os
import torch
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    DataCollatorForSeq2Seq,
    TrainingArguments,
    Trainer,
    BitsAndBytesConfig,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training


MODEL_ID = "meta-llama/Llama-3.2-3B-Instruct"
DATASET_PATH = "data/mba/datasets/sft_multitask.jsonl"
OUTPUT_DIR = "llama32_3b_lora_out"
MAX_LEN = 512          # shorter seq length to fit 4GB
EPOCHS = 2             # you can start with 1 if you want quicker runs
GRAD_ACCUM = 8         # effective batch size = 1 * 8 = 8
LR = 2e-4


def format_example(example):
    example["text"] = (
        f"### Instruction:\n{example['instruction']}\n\n"
        f"### Input:\n{example['input']}\n\n"
        f"### Output:\n{example['output']}"
    )
    return example


def tokenize_fn(batch, tokenizer):
    toks = tokenizer(
        batch["text"],
        truncation=True,
        max_length=MAX_LEN,
        padding=False,  # collator will pad dynamically
    )
    toks["labels"] = toks["input_ids"].copy()
    return toks


def main():
    torch.cuda.empty_cache()

    # ---------------------------
    # Dataset
    # ---------------------------
    print("Loading dataset...")
    dataset = load_dataset("json", data_files=DATASET_PATH, split="train")
    dataset = dataset.map(format_example, remove_columns=dataset.column_names)
    print("Dataset loaded.")

    # ---------------------------
    # Tokenizer
    # ---------------------------
    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    print("Tokenizing dataset...")
    tokenized = dataset.map(
        lambda batch: tokenize_fn(batch, tokenizer),
        batched=True,
        remove_columns=["text"],
    )
    print("Tokenization complete.")

    # ---------------------------
    # 4-bit quantization config
    # ---------------------------
    print("Setting up 4-bit quantization...")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
    )

    # ---------------------------
    # Model
    # ---------------------------
    print("Loading model with 4-bit quantization on GPU 0...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        quantization_config=bnb_config,
        device_map={"": 0},     # everything on cuda:0
        torch_dtype=torch.float16,
        low_cpu_mem_usage=True,
    )

    print("Preparing model for k-bit training...")
    model = prepare_model_for_kbit_training(model)

    # Avoid warning with gradient checkpointing
    if hasattr(model, "config"):
        model.config.use_cache = False

    # ---------------------------
    # LoRA config
    # ---------------------------
    print("Applying LoRA adapters...")
    lora_cfg = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
        ],
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_cfg)
    model.print_trainable_parameters()

    # ---------------------------
    # Training arguments
    # ---------------------------
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=GRAD_ACCUM,
        learning_rate=LR,
        logging_steps=20,
        save_strategy="epoch",
        save_total_limit=2,
        fp16=True,
        optim="paged_adamw_8bit",
        gradient_checkpointing=True,
        # if your transformers version complains, just remove this line:
        gradient_checkpointing_kwargs={"use_reentrant": False},
        remove_unused_columns=False,
        report_to="none",
    )

    # ---------------------------
    # Data collator & Trainer
    # ---------------------------
    collator = DataCollatorForSeq2Seq(
        tokenizer=tokenizer,
        model=model,
        padding=True,
        pad_to_multiple_of=8,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized,
        data_collator=collator,
    )

    print("\n🚀 Starting training on Llama 3.2 3B (4-bit + LoRA)...\n")
    trainer.train()

    # ---------------------------
    # Save LoRA adapters & tokenizer
    # ---------------------------
    print("\nSaving LoRA adapters and tokenizer...")
    adapters_dir = os.path.join(OUTPUT_DIR, "lora_adapters")
    model.save_pretrained(adapters_dir)
    tokenizer.save_pretrained(os.path.join(OUTPUT_DIR, "tokenizer"))

    print(f"\n🎉 Training complete — LoRA saved to '{adapters_dir}'\n")


if __name__ == "__main__":
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA is not available. This script requires a GPU.")
    import multiprocessing
    multiprocessing.freeze_support()
    main()
