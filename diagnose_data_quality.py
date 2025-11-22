import json
from collections import Counter, defaultdict
from pathlib import Path

def diagnose_data_quality(file_path):
    """Comprehensive data quality diagnosis"""
    
    print("🔍 DIAGNOSING DATA QUALITY...\n")
    print("="*60)
    
    issues = defaultdict(list)
    stats = {
        'total': 0,
        'valid': 0,
        'invalid': 0,
        'tier_distribution': Counter(),
        'missing_fields': Counter(),
        'empty_fields': Counter(),
        'invalid_tiers': [],
        'duplicate_candidates': Counter(),
    }
    
    valid_tiers = {'tier1', 'tier2', 'tier3_regular', 'tier3_standout'}
    
    print("📊 Reading data...")
    with open(file_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            stats['total'] += 1
            
            try:
                data = json.loads(line.strip())
                
                # Check structure
                if 'instruction' not in data:
                    issues['missing_instruction'].append(line_num)
                    stats['missing_fields']['instruction'] += 1
                
                if 'input' not in data:
                    issues['missing_input'].append(line_num)
                    stats['missing_fields']['input'] += 1
                    continue
                
                if 'output' not in data:
                    issues['missing_output'].append(line_num)
                    stats['missing_fields']['output'] += 1
                    continue
                
                # Check input quality
                input_text = data.get('input', '')
                if not input_text or len(input_text.strip()) < 50:
                    issues['empty_or_short_input'].append(line_num)
                    stats['empty_fields']['input'] += 1
                
                # Extract candidate ID for duplicate check
                if 'CANDIDATE:' in input_text:
                    cand_id = input_text.split('CANDIDATE:')[1].split('\n')[0].strip()
                    stats['duplicate_candidates'][cand_id] += 1
                
                # Check output quality
                output = data.get('output')
                if isinstance(output, str):
                    try:
                        output = json.loads(output)
                    except:
                        issues['invalid_json_output'].append(line_num)
                        stats['invalid'] += 1
                        continue
                
                if not isinstance(output, dict):
                    issues['output_not_dict'].append(line_num)
                    stats['invalid'] += 1
                    continue
                
                # Check tier
                tier = output.get('tier')
                if not tier:
                    issues['missing_tier'].append(line_num)
                    stats['missing_fields']['tier'] += 1
                    stats['invalid'] += 1
                    continue
                
                if tier not in valid_tiers:
                    issues['invalid_tier_value'].append((line_num, tier))
                    stats['invalid_tiers'].append(tier)
                    stats['invalid'] += 1
                    continue
                
                stats['tier_distribution'][tier] += 1
                stats['valid'] += 1
                
            except json.JSONDecodeError:
                issues['json_parse_error'].append(line_num)
                stats['invalid'] += 1
            except Exception as e:
                issues['unknown_error'].append((line_num, str(e)))
                stats['invalid'] += 1
    
    # Print Results
    print("\n" + "="*60)
    print("📈 OVERALL STATISTICS")
    print("="*60)
    print(f"Total Examples: {stats['total']}")
    print(f"✅ Valid: {stats['valid']} ({stats['valid']/stats['total']*100:.1f}%)")
    print(f"❌ Invalid: {stats['invalid']} ({stats['invalid']/stats['total']*100:.1f}%)")
    
    print("\n" + "="*60)
    print("🎯 CLASS DISTRIBUTION")
    print("="*60)
    if stats['tier_distribution']:
        total_valid = sum(stats['tier_distribution'].values())
        for tier in sorted(stats['tier_distribution'].keys()):
            count = stats['tier_distribution'][tier]
            pct = count / total_valid * 100
            bar = "█" * int(pct / 2)
            print(f"{tier:20s}: {count:4d} ({pct:5.1f}%) {bar}")
        
        # Check balance
        counts = list(stats['tier_distribution'].values())
        if counts:
            imbalance_ratio = max(counts) / min(counts)
            print(f"\n⚖️  Class Imbalance Ratio: {imbalance_ratio:.2f}x")
            if imbalance_ratio > 3:
                print("   ⚠️  WARNING: Severe class imbalance!")
            elif imbalance_ratio > 2:
                print("   ⚠️  WARNING: Moderate class imbalance")
            else:
                print("   ✅ Class distribution is reasonable")
    else:
        print("❌ NO VALID TIER LABELS FOUND!")
    
    # Check for duplicates
    duplicates = {k: v for k, v in stats['duplicate_candidates'].items() if v > 1}
    if duplicates:
        print(f"\n⚠️  Found {len(duplicates)} duplicate candidates!")
        print("   Top 5 duplicates:")
        for cand_id, count in sorted(duplicates.items(), key=lambda x: -x[1])[:5]:
            print(f"   - {cand_id}: {count} times")
    
    # Detailed Issues
    if issues:
        print("\n" + "="*60)
        print("🚨 ISSUES FOUND")
        print("="*60)
        
        for issue_type, occurrences in sorted(issues.items()):
            count = len(occurrences)
            print(f"\n{issue_type}: {count} occurrences")
            
            if count <= 5:
                for occ in occurrences:
                    if isinstance(occ, tuple):
                        print(f"  - Line {occ[0]}: {occ[1]}")
                    else:
                        print(f"  - Line {occ}")
            else:
                print(f"  - Lines: {occurrences[:5]}... (showing first 5)")
    
    print("\n" + "="*60)
    print("💡 RECOMMENDATIONS")
    print("="*60)
    
    if stats['valid'] == 0:
        print("❌ CRITICAL: No valid training examples!")
        print("   → Check data format and field names")
        print("   → Verify tier values are correct")
    elif stats['valid'] < 100:
        print("⚠️  WARNING: Very few valid examples")
        print("   → Need at least 100-200 examples per class")
    elif stats['invalid'] / stats['total'] > 0.1:
        print("⚠️  WARNING: High error rate")
        print("   → Clean up invalid entries")
    
    imbalance_ratio = max(stats['tier_distribution'].values()) / min(stats['tier_distribution'].values()) if stats['tier_distribution'] else 0
    if imbalance_ratio > 3:
        print("⚠️  WARNING: Severe class imbalance")
        print("   → Consider data augmentation or weighted loss")
    
    if duplicates:
        print("⚠️  WARNING: Duplicate candidates found")
        print("   → Remove duplicates to avoid data leakage")
    
    if not issues and stats['valid'] > 100:
        print("✅ Data quality looks good!")
        print("   → Ready for training")
    
    print("\n" + "="*60)
    
    return stats, issues

if __name__ == "__main__":
    import sys
    
    file_path = sys.argv[1] if len(sys.argv) > 1 else "data/mba/fine_tune/train_data.jsonl"
    
    print(f"\n🔍 Analyzing: {file_path}\n")
    
    if not Path(file_path).exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    stats, issues = diagnose_data_quality(file_path)
    
    # Return exit code based on quality
    if stats['valid'] == 0:
        sys.exit(2)  # Critical error
    elif stats['invalid'] / stats['total'] > 0.1:
        sys.exit(1)  # Warnings
    else:
        sys.exit(0)  # OK