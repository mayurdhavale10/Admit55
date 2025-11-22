# test_lora_0.5b.py
from peft import PeftModel
from transformers import AutoTokenizer, AutoModelForCausalLM

# Correct base model (0.5B - confirmed from config)
base_model = "Qwen/Qwen2.5-0.5B-Instruct"
adapter_path = "data/mba/fine_tune/artifacts/lora/qwen2_5_1.5b_v1"

print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(base_model)
model = AutoModelForCausalLM.from_pretrained(base_model, device_map="auto")
model = PeftModel.from_pretrained(model, adapter_path)
print("Model loaded! ✅\n")

# Test resume
test_resume = """Resume:
Software Engineer at Google working on distributed systems for 5 years.
Built scalable microservices using Python and Kubernetes.
MS in Computer Science from Stanford University.
"""

prompt = f"{test_resume}\n\nExtract structured information as JSON:"

inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
outputs = model.generate(
    **inputs, 
    max_new_tokens=200,
    temperature=0.1,
    top_p=0.9,
    do_sample=True,
    repetition_penalty=1.2
)

result = tokenizer.decode(outputs[0], skip_special_tokens=True)
print("="*80)
print("OUTPUT:")
print("="*80)
print(result)
print("="*80)