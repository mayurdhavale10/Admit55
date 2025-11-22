from transformers import AutoTokenizer, AutoModelForCausalLM

model_id = "meta-llama/Llama-3.1-8B-Instruct"

print("Downloading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(model_id, use_fast=True)
print("Tokenizer OK")

print("Downloading model...")
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    device_map="auto",
    load_in_4bit=True,
    torch_dtype="auto",
)
print("Model OK")
