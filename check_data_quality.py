import json
import re
from collections import Counter

# Load your training data
train_path = "data/mba/datasets/latest/train.clean.jsonl"
val_path = "data/mba/datasets/latest/val.clean.jsonl"

def analyze_data(file_path, num_samples=100):
    print(f"\n{'='*80}")
    print(f"Analyzing: {file_path}")
    print(f"{'='*80}\n")
    
    issues = {
        'weird_chars': 0,
        'empty_inputs': 0,
        'empty_outputs': 0,
        'invalid_json': 0,
        'very_long': 0,
        'very_short': 0,
        'encoding_issues': 0
    }
    
    samples = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            if i >= num_samples:
                break
            
            try:
                data = json.loads(line)
                samples.append(data)
                
                # Check input field
                input_text = data.get('input', data.get('text', ''))
                output_text = data.get('output', data.get('label', ''))
                
                # Empty checks
                if not input_text or len(input_text.strip()) == 0:
                    issues['empty_inputs'] += 1
                
                if not output_text:
                    issues['empty_outputs'] += 1
                
                # Length checks
                if len(input_text) > 5000:
                    issues['very_long'] += 1
                elif len(input_text) < 50:
                    issues['very_short'] += 1
                
                # Weird character check (non-ASCII, special chars)
                weird_char_count = len(re.findall(r'[^\x00-\x7F]+', input_text))
                if weird_char_count > 20:
                    issues['weird_chars'] += 1
                
                # Encoding issues (�, mojibake)
                if '�' in input_text or '�' in str(output_text):
                    issues['encoding_issues'] += 1
                
                # Check if output is valid JSON
                if isinstance(output_text, str):
                    try:
                        json.loads(output_text)
                    except:
                        issues['invalid_json'] += 1
                
            except Exception as e:
                print(f"Error parsing line {i}: {e}")
    
    # Print results
    print(f"Samples analyzed: {len(samples)}")
    print(f"\nIssues found:")
    for issue, count in issues.items():
        percentage = (count / len(samples) * 100) if samples else 0
        print(f"  {issue}: {count} ({percentage:.1f}%)")
    
    # Show first 3 examples
    print(f"\n{'='*80}")
    print("SAMPLE DATA (first 3 examples):")
    print(f"{'='*80}\n")
    
    for i, sample in enumerate(samples[:3]):
        print(f"Example {i+1}:")
        print("-"*80)
        
        input_text = sample.get('input', sample.get('text', ''))
        output_text = sample.get('output', sample.get('label', ''))
        
        print(f"INPUT (first 300 chars):")
        print(input_text[:300])
        print(f"\nOUTPUT:")
        print(output_text if len(str(output_text)) < 500 else str(output_text)[:500] + "...")
        print("-"*80 + "\n")
    
    return issues, samples

# Analyze both datasets
train_issues, train_samples = analyze_data(train_path, num_samples=100)
val_issues, val_samples = analyze_data(val_path, num_samples=50)

# Overall summary
print(f"\n{'='*80}")
print("OVERALL ASSESSMENT")
print(f"{'='*80}")

total_issues = sum(train_issues.values())
if total_issues > 50:
    print("⚠️  HIGH number of data quality issues detected!")
    print("   Your data likely needs cleaning before training.")
elif total_issues > 20:
    print("⚠️  MODERATE data quality issues detected.")
    print("   Consider cleaning data for better results.")
else:
    print("✅ Data quality looks acceptable.")
    print("   Model performance issues may be due to model size, not data.")

print(f"{'='*80}\n")