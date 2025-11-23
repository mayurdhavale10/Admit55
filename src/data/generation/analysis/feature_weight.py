# src/data/generation/analysis/feature_weight.py
import json, math, os, glob, argparse
from pathlib import Path
import statistics as stats
import csv

# --------- Tunable weights (you can tweak later) ----------
W = {
    "academics": 0.28,
    "industry":  0.22,
    "career":    0.22,
    "impact":    0.14,
    "intl":      0.08,
    "tenure":    0.06,
}

ROLE_LEVEL_SCORE = {
    "intern": 0.1, "junior": 0.3, "associate": 0.45, "senior": 0.6,
    "lead": 0.7, "manager": 0.78, "director": 0.86, "vp": 0.92, "cxo": 1.0,
}

def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))

# ---------- Individual scoring functions ----------
def score_academics(a):
    if not a: return 0.0
    base = 0.0
    # UG tier (1 best → map to 1.0, 3 worst → ~0.6)
    tier = int(a.get("ug_tier", 3))
    base += ({1: 1.0, 2: 0.8, 3: 0.6, 4: 0.5}.get(tier, 0.6)) * 0.65
    # GMAT (200–800 → 0–1)
    ts = a.get("test_scores") or {}
    gmat = ts.get("gmat")
    if isinstance(gmat, (int, float)):
        g = clamp((gmat - 200) / 600.0)
        base += g * 0.35
    return clamp(base, 0, 1)

def score_industry(ind):
    if not ind: return 0.0
    # company_tier: 1 best → 1.0, 3 → 0.6
    t = int(ind.get("company_tier", ind.get("company_tier_num", 3)))
    tier_score = {1: 1.0, 2: 0.8, 3: 0.6}.get(t, 0.6)
    # sector premium (optional)
    sector = (ind.get("sector") or "").lower()
    premium = 0.0
    if any(k in sector for k in ["product", "technology", "consult"]):
        premium = 0.1
    return clamp(tier_score + premium, 0, 1)

def score_career(c):
    if not c: return 0.0
    yrs = float(c.get("total_years", 0))
    lvl = ROLE_LEVEL_SCORE.get(str(c.get("role_level", "associate")).lower(), 0.45)
    yrs_norm = clamp(yrs / 12.0)  # 12 yrs ~ full credit
    return clamp(0.55 * lvl + 0.45 * yrs_norm, 0, 1)

def score_impact(sig, extras):
    base = 0.0
    if sig:
        if sig.get("leadership"): base += 0.4
        if sig.get("impact"): base += 0.4
    if extras:
        if extras.get("awards"): base += 0.1
        if extras.get("social_work"): base += 0.1
    return clamp(base, 0, 1)

def score_international(sig, geo, ind):
    s = 0.0
    if sig and sig.get("international"): s += 0.6
    if geo and geo.get("secondary_countries"): s += 0.4
    if ind and ind.get("regions"):
        if len(ind["regions"]) >= 2: s += 0.1
    return clamp(s, 0, 1)

def score_tenure(meta_like=None):
    # Placeholder for now (later can compute job-switch consistency)
    return 0.5

# ---------- Aggregation ----------
def score_label(lbl):
    acad = score_academics(lbl.get("academics"))
    ind  = score_industry(lbl.get("industry"))
    car  = score_career(lbl.get("career"))
    imp  = score_impact(lbl.get("signals"), lbl.get("extras"))
    intl = score_international(lbl.get("signals"), lbl.get("geo"), lbl.get("industry"))
    ten  = score_tenure()

    # Weighted sum → 0..1
    raw = (
        W["academics"] * acad +
        W["industry"]  * ind +
        W["career"]    * car +
        W["impact"]    * imp +
        W["intl"]      * intl +
        W["tenure"]    * ten
    )
    # Map to 0..100
    return round(100.0 * clamp(raw, 0, 1), 2), {
        "academics": round(acad, 3),
        "industry":  round(ind, 3),
        "career":    round(car, 3),
        "impact":    round(imp, 3),
        "intl":      round(intl, 3),
        "tenure":    round(ten, 3),
    }

# ---------- Main runner ----------
def find_label_dirs(root):
    return sorted(glob.glob(os.path.join(root, "*")))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--labels-root", default="data/mba/labels_normalized/synthetic/processed",
                    help="Root containing tier folders with JSON labels")
    ap.add_argument("--out-csv", default="data/mba/metadata/feature_scores.csv")
    ap.add_argument("--augment-json", action="store_true",
                    help="Write feature_score back into each label JSON (meta.feature_score)")
    args = ap.parse_args()

    tier_dirs = find_label_dirs(args.labels_root)
    rows = []
    written = 0

    for tier_dir in tier_dirs:
        for fp in glob.glob(os.path.join(tier_dir, "*.json")):
            try:
                with open(fp, "r", encoding="utf-8") as f:
                    lbl = json.load(f)
                score, parts = score_label(lbl)
                cid = Path(fp).stem
                tier = lbl.get("tier", "")
                rows.append({
                    "candidate_id": cid,
                    "tier": tier,
                    "feature_score": score,
                    **{f"sub_{k}": v for k, v in parts.items()},
                })
                if args.augment_json:
                    lbl.setdefault("meta", {})
                    lbl["meta"]["feature_score"] = score
                    with open(fp, "w", encoding="utf-8") as f:
                        json.dump(lbl, f, ensure_ascii=False, indent=2)
                    written += 1
            except Exception as e:
                print(f"[warn] failed {fp}: {e}")

    # ---------- Write CSV ----------
    os.makedirs(os.path.dirname(args.out_csv), exist_ok=True)
    if rows:
        with open(args.out_csv, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=rows[0].keys())
            w.writeheader()
            for r in rows:
                w.writerow(r)

    # ---------- Quick QC ----------
    scores = [r["feature_score"] for r in rows]
    if scores:
        print(f"[feature_weight] scored={len(scores)}, mean={round(stats.mean(scores),2)}, "
              f"stdev={round(stats.pstdev(scores),2)}")
    else:
        print("[feature_weight] no scores computed (check JSON paths)")
    print(f"[feature_weight] augmented_json={written}")

if __name__ == "__main__":
    main()
