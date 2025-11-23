import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import os

# Path to your score CSV
csv_path = "data/mba/metadata/feature_scores.csv"

# Load data
df = pd.read_csv(csv_path)
print(f"✅ Loaded {len(df):,} samples")

# Basic stats
print("\n📊 Overall Score Summary")
print(df['feature_score'].describe())

# Mean/std by tier
print("\n📈 Mean ± Std by Tier:")
print(df.groupby('tier')['feature_score'].agg(['mean', 'std', 'count']).round(2))

# Plot histogram
plt.figure(figsize=(10,5))
sns.histplot(df['feature_score'], bins=30, kde=True)
plt.title("Distribution of Feature Scores (All Tiers)")
plt.xlabel("Feature Score (0–100)")
plt.ylabel("Count")
plt.show()

# Plot tier-wise boxplot
plt.figure(figsize=(10,5))
sns.boxplot(x='tier', y='feature_score', data=df, order=sorted(df['tier'].unique()))
plt.title("Score Distribution by Tier")
plt.xticks(rotation=45)
plt.show()

# Optional: check imbalance
tier_counts = df['tier'].value_counts()
plt.figure(figsize=(6,4))
tier_counts.plot(kind='bar', color='skyblue')
plt.title("Sample Count by Tier")
plt.ylabel("Count")
plt.show()
