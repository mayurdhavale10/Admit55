import json, statistics as stats
from tqdm import tqdm

path = "data/mba/datasets/sft_score_regression.jsonl"

def clean_score(x):
    try:
        return float(x)
    except:
        return None

def main():
    n, invalid, too_short, scores, long_inputs = 0, 0, 0, [], 0

    with open(path, "r", encoding="utf-8") as f:
        for line in tqdm(f, desc="[checking dataset]"):
            try:
                obj = json.loads(line)
                n += 1
                inp = obj.get("input", "").strip()
                out = clean_score(obj.get("output"))

                if not inp or len(inp) < 200:
                    too_short += 1
                if out is None or out < 0 or out > 100:
                    invalid += 1
                else:
                    scores.append(out)
                if len(inp) > 15000:
                    long_inputs += 1

            except Exception:
                invalid += 1

    print("\n📊 Dataset Summary")
    print(f"Total samples: {n}")
    print(f"Invalid outputs: {invalid}")
    print(f"Too short resumes (<200 chars): {too_short}")
    print(f"Very long resumes (>15k chars): {long_inputs}")
    if scores:
        print(f"Score Mean: {round(stats.mean(scores), 2)}")
        print(f"Score StdDev: {round(stats.pstdev(scores), 2)}")
        print(f"Score Min–Max: {min(scores)} – {max(scores)}")
        print(f"Sample lines OK: {n - invalid - too_short}")

if __name__ == "__main__":
    main()
