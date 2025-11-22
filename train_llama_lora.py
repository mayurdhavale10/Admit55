# train_llama_lora_fixed_final.py
import json
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
import torch
import os

torch.cuda.empty_cache()

MODEL_ID = "meta-llama/Llama-3.1-8B-Instruct"
DATASET_PATH = "data/mba/datasets/sft_multitask.jsonl"

# --------------------
# DATASET
# --------------------
dataset = load_dataset("json", data_files=DATASET_PATH, split="train")

def format_example(example):
    return {
        "text": f"### Instruction:\n{example['instruction']}\n\n"
                f"### Input:\n{example['input']}\n\n"
                f"### Output:\n{example['output']}"
    }

dataset = dataset.map(format_example, remove_columns=dataset.column_names)

# --------------------
# TOKENIZER
# --------------------
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, use_fast=True)
tokenizer.pad_token = tokenizer.eos_token

MAX_LEN = 1024  # safe for 6GB GPUs

def tokenize_fn(batch):
    toks = tokenizer(
        batch["text"],
        truncation=True,
        max_length=MAX_LEN,
        padding="max_length",
    )
    toks["labels"] = toks["input_ids"].copy()
    return toks

dataset = dataset.map(tokenize_fn, batched=True, remove_columns=["text"])

# --------------------
# QUANTIZATION CONFIG (IMPORTANT)
# --------------------
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    llm_int8_enable_fp32_cpu_offload=True,  # FIX FOR YOUR GPU
)

# --------------------
# DEVICE MAP (CPU + GPU)
# --------------------
device_map = {
    "model.embed_tokens": 0,
    "model.layers": "cpu",     # keeps heavy blocks on CPU
    "model.norm": 0,
    "lm_head": 0,
    "": "cpu"
}

print("Loading model with 4-bit + CPU offload...")

model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map=device_map,
    low_cpu_mem_usage=True,
)

# prepare for LoRA
model = prepare_model_for_kbit_training(model)

# --------------------
# LORA CONFIG
# --------------------
lora_cfg = LoraConfig(
    r=8,
    lora_alpha=16,
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
)

model = get_peft_model(model, lora_cfg)
model.print_trainable_parameters()

# --------------------
# TRAINING ARGS
# --------------------
args = TrainingArguments(
    output_dir="llama3_lora_out",
    num_train_epochs=1,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    fp16=True,
    logging_steps=20,
    save_strategy="epoch",
    optim="paged_adamw_8bit",
    gradient_checkpointing=True,
    report_to="none",
)

collator = DataCollatorForSeq2Seq(tokenizer, model=model)

trainer = Trainer(
    model=model,
    args=args,
    train_dataset=dataset,
    data_collator=collator,
)

print("\n🚀 TRAINING STARTING (slow but stable on 6GB GPU)...\n")
trainer.train()

model.save_pretrained("lora-llama3-8b")
tokenizer.save_pretrained("lora-llama3-8b")

print("\n🎉 DONE — LoRA saved.\n")
