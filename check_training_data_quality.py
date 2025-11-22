"""
Training Data Quality Checker
==============================

Run this BEFORE training to check:
1. How many examples you have
2. What format the data is in
3. Class distribution (balanced or imbalanced?)
4. Whether data matches what the model expects

Usage:
    python check_training_data_quality.py
"""

import json
import sys
from pathlib import Path
from collections import Counter
import re

def check_data_quality(train_path: str, val_path: str = None):
    """Check training data quality before training"""
    
    print("\n" + "=" * 80)
    print("🔍 TRAINING DATA QUALITY CHECK")
    print("=" * 80)
    
    # Check if files exist
    train_file = Path(train_path)
    if not train_file.exists():
        print(f"\n❌ Training file not found: {train_path}")
        print("Please provide correct path")
        return False
    
    print(f"\n✅ Found training file: {train_path}")
    file_size_mb = train_file.stat().st_size / (1024 * 1024)
    print(f"   Size: {file_size_mb:.2f} MB")
    
    # Load and analyze data
    print("\n📊 Loading and analyzing data...")
    
    train_data = []
    line_errors = []
    
    with open(train_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            try:
                item = json.loads(line.strip())
                train_data.append(item)
            except json.JSONDecodeError as e:
                line_errors.append((line_num, str(e)))
    
    print(f"✅ Loaded {len(train_data)} training examples")
    
    if line_errors:
        print(f"\n⚠️ Found {len(line_errors)} invalid lines:")
        for line_num, error in line_errors[:5]:
            print(f"   Line {line_num}: {error}")
        if len(line_errors) > 5:
            print(f"   ... and {len(line_errors) - 5} more")
    
    if not train_data:
        print("\n❌ No valid training data found!")
        return False
    
    # Check data format
    print("\n" + "=" * 80)
    print("🔍 DATA FORMAT CHECK")
    print("=" * 80)
    
    first_item = train_data[0]
    print("\n📝 First example structure:")
    print(f"   Keys: {list(first_item.keys())}")
    
    # Check for required fields
    required_formats = [
        ('prompt', 'completion'),  # Format 1: prompt-completion pairs
        ('text', None),             # Format 2: raw text
        ('input', 'output'),        # Format 3: input-output pairs
    ]
    
    detected_format = None
    for fmt in required_formats:
        if fmt[0] in first_item:
            if fmt[1] is None or fmt[1] in first_item:
                detected_format = fmt
                break
    
    if detected_format:
        print(f"\n✅ Detected format: {detected_format[0]}" + 
              (f" + {detected_format[1]}" if detected_format[1] else ""))
    else:
        print(f"\n❌ Unknown format! Keys found: {list(first_item.keys())}")
        print("Expected formats:")
        print("  1. {'prompt': '...', 'completion': '...'}")
        print("  2. {'text': '...'}")
        print("  3. {'input': '...', 'output': '...'}")
        return False
    
    # Show sample
    print("\n📄 Sample data:")
    if 'prompt' in first_item:
        print(f"\n   Prompt (first 200 chars):")
        print(f"   {first_item['prompt'][:200]}...")
        
        if 'completion' in first_item:
            print(f"\n   Completion:")
            print(f"   {first_item['completion']}")
            
            # Try to extract tier from completion
            try:
                completion = json.loads(first_item['completion'])
                if 'tier' in completion:
                    print(f"\n   ✅ Tier label found: {completion['tier']}")
            except:
                print(f"\n   ⚠️ Completion is not JSON format")
    
    # Check class distribution
    print("\n" + "=" * 80)
    print("📊 CLASS DISTRIBUTION")
    print("=" * 80)
    
    tiers = []
    for item in train_data:
        try:
            if 'completion' in item:
                completion_text = item['completion']
                
                # Try to parse as JSON
                try:
                    completion = json.loads(completion_text)
                    if 'tier' in completion:
                        tiers.append(completion['tier'])
                    continue
                except:
                    pass
                
                # Try to extract tier from text
                tier_match = re.search(r'"tier"\s*:\s*"([^"]+)"', completion_text)
                if tier_match:
                    tiers.append(tier_match.group(1))
                else:
                    # Look for tier keywords
                    if 'tier1_elite' in completion_text.lower():
                        tiers.append('tier1_elite')
                    elif 'tier2_mid' in completion_text.lower():
                        tiers.append('tier2_mid')
                    elif 'tier3_regular' in completion_text.lower():
                        tiers.append('tier3_regular')
                    elif 'nontraditional' in completion_text.lower():
                        tiers.append('nontraditional')
                    else:
                        tiers.append('unknown')
        except Exception as e:
            tiers.append('parse_error')
    
    tier_counts = Counter(tiers)
    total = len(tiers)
    
    print(f"\nTotal examples with tier labels: {total}")
    print("\nDistribution:")
    
    for tier, count in tier_counts.most_common():
        percentage = 100 * count / total
        bar = "█" * int(percentage / 2)
        print(f"  {tier:20s} {count:5d} ({percentage:5.1f}%) {bar}")
    
    # Check for imbalance
    print("\n" + "=" * 80)
    print("⚖️ BALANCE CHECK")
    print("=" * 80)
    
    if tier_counts:
        max_count = max(tier_counts.values())
        min_count = min(tier_counts.values())
        imbalance_ratio = max_count / min_count if min_count > 0 else float('inf')
        
        if imbalance_ratio > 10:
            print(f"\n❌ SEVERE IMBALANCE detected! (ratio: {imbalance_ratio:.1f}:1)")
            print("   This will cause model to predict only the majority class!")
            print("\n   Solutions:")
            print("   1. Collect more data for minority classes")
            print("   2. Use class weights during training")
            print("   3. Oversample minority classes")
        elif imbalance_ratio > 3:
            print(f"\n⚠️ MODERATE IMBALANCE detected (ratio: {imbalance_ratio:.1f}:1)")
            print("   Model may be biased toward majority class")
            print("   Consider rebalancing if possible")
        else:
            print(f"\n✅ GOOD BALANCE (ratio: {imbalance_ratio:.1f}:1)")
            print("   Data distribution looks reasonable")
    
    # Check validation data
    if val_path:
        print("\n" + "=" * 80)
        print("🔍 VALIDATION DATA CHECK")
        print("=" * 80)
        
        val_file = Path(val_path)
        if val_file.exists():
            val_data = []
            with open(val_path, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        val_data.append(json.loads(line.strip()))
                    except:
                        pass
            
            print(f"\n✅ Found {len(val_data)} validation examples")
            
            val_size_pct = 100 * len(val_data) / (len(train_data) + len(val_data))
            print(f"   Validation split: {val_size_pct:.1f}%")
            
            if val_size_pct < 5:
                print("   ⚠️ Very small validation set (< 5%)")
            elif val_size_pct > 30:
                print("   ⚠️ Large validation set (> 30%)")
            else:
                print("   ✅ Good validation split (5-30%)")
        else:
            print(f"\n⚠️ Validation file not found: {val_path}")
    
    # Summary
    print("\n" + "=" * 80)
    print("📋 SUMMARY")
    print("=" * 80)
    
    issues = []
    warnings = []
    
    if line_errors:
        warnings.append(f"Found {len(line_errors)} invalid JSON lines")
    
    if not detected_format:
        issues.append("Unknown data format")
    
    if tier_counts:
        max_count = max(tier_counts.values())
        min_count = min(tier_counts.values())
        imbalance_ratio = max_count / min_count if min_count > 0 else float('inf')
        
        if imbalance_ratio > 10:
            issues.append(f"Severe class imbalance ({imbalance_ratio:.1f}:1)")
        elif imbalance_ratio > 3:
            warnings.append(f"Moderate class imbalance ({imbalance_ratio:.1f}:1)")
    
    if 'unknown' in tier_counts and tier_counts['unknown'] > len(train_data) * 0.1:
        warnings.append(f"{tier_counts['unknown']} examples with 'unknown' tier")
    
    print(f"\n✅ Training examples: {len(train_data)}")
    if val_path and Path(val_path).exists():
        print(f"✅ Validation examples: {len(val_data)}")
    
    if issues:
        print(f"\n❌ CRITICAL ISSUES ({len(issues)}):")
        for issue in issues:
            print(f"   • {issue}")
        print("\n⚠️ Fix these before training!")
        return False
    
    if warnings:
        print(f"\n⚠️ WARNINGS ({len(warnings)}):")
        for warning in warnings:
            print(f"   • {warning}")
        print("\n⚡ You can train, but results may not be optimal")
    
    if not issues and not warnings:
        print("\n✅ ALL CHECKS PASSED!")
        print("   Data looks good for training!")
    
    # Training recommendations
    print("\n" + "=" * 80)
    print("💡 TRAINING RECOMMENDATIONS")
    print("=" * 80)
    
    print(f"\nBased on {len(train_data)} training examples:")
    
    if len(train_data) < 100:
        print("  • Use 15-20 epochs (small dataset)")
        print("  • Learning rate: 3e-4")
        print("  • Batch size: 2-4")
    elif len(train_data) < 500:
        print("  • Use 10-15 epochs")
        print("  • Learning rate: 3e-4")
        print("  • Batch size: 4-8")
    else:
        print("  • Use 5-10 epochs (large dataset)")
        print("  • Learning rate: 2e-4")
        print("  • Batch size: 8-16")
    
    print(f"\nEstimated training time:")
    steps_per_epoch = len(train_data) // 4  # Assuming batch size 4
    total_steps = steps_per_epoch * 10  # Assuming 10 epochs
    print(f"  • ~{total_steps} training steps")
    print(f"  • ~{total_steps * 6 / 60:.0f} minutes on GPU (estimate)")
    print(f"  • ~{total_steps * 60 / 60:.0f} minutes on CPU (estimate)")
    
    print("\n" + "=" * 80)
    print("🚀 READY TO TRAIN!")
    print("=" * 80)
    print("\nNext step:")
    print("  python train_model_fixed.py")
    print("\n" + "=" * 80 + "\n")
    
    return True


if __name__ == "__main__":
    # Default paths
    train_path = "data/mba/datasets/latest/train.jsonl"
    val_path = "data/mba/datasets/latest/val.jsonl"
    
    # Allow custom paths from command line
    if len(sys.argv) > 1:
        train_path = sys.argv[1]
    if len(sys.argv) > 2:
        val_path = sys.argv[2]
    
    check_data_quality(train_path, val_path)