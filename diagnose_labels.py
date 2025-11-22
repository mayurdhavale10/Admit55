import json
import sys
from pathlib import Path

def main():
    # Check first 3 documents
    doc_ids = ["0001", "0002", "0049"]
    
    gold_dir = Path("data/mba/labels_normalized/partner_uploads/processed")
    pred_dir = Path("data/mba/preds")
    
    for doc_id in doc_ids:
        print("\n" + "="*70)
        print(f"=== Document: {doc_id} ===")
        print("="*70)
        
        gold_path = gold_dir / f"{doc_id}.json"
        pred_path = pred_dir / f"{doc_id}.json"
        
        # Load gold
        try:
            with open(gold_path, 'r', encoding='utf-8') as f:
                gold = json.load(f)
            print("\n[GOLD LABEL]")
            print(json.dumps(gold, indent=2, ensure_ascii=False))
        except Exception as e:
            print(f"[ERROR] Cannot load gold: {e}")
            continue
        
        # Load prediction
        try:
            with open(pred_path, 'r', encoding='utf-8') as f:
                pred = json.load(f)
            print("\n[PREDICTION]")
            print(json.dumps(pred, indent=2, ensure_ascii=False))
        except Exception as e:
            print(f"[ERROR] Cannot load prediction: {e}")
            continue
        
        # Compare keys
        print("\n[KEY COMPARISON]")
        gold_keys = set(gold.keys()) if isinstance(gold, dict) else set()
        pred_keys = set(pred.keys()) if isinstance(pred, dict) else set()
        
        print(f"Gold keys: {sorted(gold_keys)}")
        print(f"Pred keys: {sorted(pred_keys)}")
        print(f"Missing in pred: {gold_keys - pred_keys}")
        print(f"Extra in pred: {pred_keys - gold_keys}")
        
        # Check if nested
        if isinstance(gold, dict):
            for key, val in gold.items():
                if isinstance(val, dict):
                    print(f"\n[WARNING] Gold has nested structure under key '{key}':")
                    print(f"  Nested keys: {list(val.keys())}")

if __name__ == "__main__":
    main()