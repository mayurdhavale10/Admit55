from peft import PeftModel
from transformers import AutoTokenizer, AutoModelForCausalLM
import json
import re

# Load model
base_model = "Qwen/Qwen2.5-0.5B-Instruct"
adapter_path = "data/mba/fine_tune/artifacts/lora/qwen2_5_1.5b_v1"

print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(base_model)
model = AutoModelForCausalLM.from_pretrained(base_model, device_map="auto")
model = PeftModel.from_pretrained(model, adapter_path)
print("Model loaded!\n")

# Load validation data
val_path = "data/mba/datasets/latest/val.clean.jsonl"
val_data = []
with open(val_path, 'r', encoding='utf-8') as f:
    for line in f:
        val_data.append(json.loads(line))

print(f"Loaded {len(val_data)} validation examples")

# Evaluate on first 50 examples (faster)
num_samples = 50
correct_fields = 0
total_fields = 0
valid_json_count = 0

print(f"\nEvaluating on {num_samples} samples...\n")

for i, example in enumerate(val_data[:num_samples]):
    # Get input and expected output
    # Adjust these field names based on your actual data structure
    input_text = example.get('input', example.get('text', ''))
    gold_output = example.get('output', example.get('label', {}))
    
    if isinstance(gold_output, str):
        try:
            gold_output = json.loads(gold_output)
        except:
            gold_output = {}
    
    # Generate prediction
    prompt = f"{input_text}\n\nExtract structured information as JSON:"
    inputs = tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True).to("cuda")
    outputs = model.generate(**inputs, max_new_tokens=200, temperature=0.1, do_sample=False)
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Try to extract JSON from output
    try:
        # Look for JSON in the output
        json_match = re.search(r'\{[^}]*\}', result)
        if json_match:
            pred_output = json.loads(json_match.group())
            valid_json_count += 1
        else:
            pred_output = {}
    except:
        pred_output = {}
    
    # Calculate field-level accuracy
    for key in gold_output.keys():
        total_fields += 1
        gold_value = str(gold_output.get(key, '')).strip().lower()
        pred_value = str(pred_output.get(key, '')).strip().lower()
        
        if gold_value == pred_value:
            correct_fields += 1
    
    # Progress
    if (i + 1) % 10 == 0:
        print(f"Processed {i + 1}/{num_samples} examples...")

# Calculate metrics
field_accuracy = correct_fields / total_fields if total_fields > 0 else 0
json_validity_rate = valid_json_count / num_samples

print("\n" + "="*80)
print("EVALUATION RESULTS")
print("="*80)
print(f"Valid JSON Rate: {json_validity_rate*100:.1f}% ({valid_json_count}/{num_samples})")
print(f"Field-level Accuracy (F1 proxy): {field_accuracy*100:.1f}% ({correct_fields}/{total_fields})")
print("="*80)

# Show example
print("\nSample Output:")
print("-"*80)
example = val_data[0]
input_text = example.get('input', example.get('text', ''))[:200]
print(f"Input: {input_text}...")
prompt = f"{input_text}\n\nExtract structured information as JSON:"
inputs = tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True).to("cuda")
outputs = model.generate(**inputs, max_new_tokens=200, temperature=0.1, do_sample=False)
result = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(f"\nOutput:\n{result}")
print("-"*80)