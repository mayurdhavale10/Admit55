# ml-service/pipeline/core/extraction/entities.py

import re
from typing import Dict, Set


def extract_resume_entities(resume_text: str) -> Dict[str, Set[str]]:
    text = (resume_text or "").lower()
    entities: Dict[str, Set[str]] = {
        "companies": set(),
        "numbers": set(),
        "percentages": set(),
        "currencies": set(),
        "roles": set(),
    }

    entities["numbers"] = set(re.findall(r"\b\d+\b", text))
    entities["percentages"] = set(re.findall(r"\d+%", text))
    entities["currencies"] = set(re.findall(r"(?:rs\.?|inr|usd|\$|₹|eur|€)\s*\d+(?:[.,]\d+)?", text))

    company_keywords = ["pvt", "ltd", "inc", "corp", "llc", "technologies", "solutions", "services", "labs", "systems"]
    words = re.findall(r"[a-z0-9&\-.]+", text)
    for i, w in enumerate(words):
        if any(kw in w for kw in company_keywords) and i > 0:
            entities["companies"].add(words[i - 1])

    role_patterns = [
        r"\b(manager|director|analyst|engineer|consultant|lead|head|vp|ceo|cto|cfo|coordinator|associate|intern)\b",
    ]
    for pattern in role_patterns:
        entities["roles"].update(re.findall(pattern, text))

    return entities


def is_specific(text: str, resume_entities: Dict[str, Set[str]], min_score: int = 2) -> bool:
    if not text:
        return False
    t = text.lower()
    score = 0

    if any(num in t for num in resume_entities.get("numbers", set())):
        score += 2
    if any(pct in t for pct in resume_entities.get("percentages", set())):
        score += 2
    if any(curr in t for curr in resume_entities.get("currencies", set())):
        score += 2
    if any(company in t for company in resume_entities.get("companies", set())):
        score += 3
    if any(role in t for role in resume_entities.get("roles", set())):
        score += 1

    return score >= min_score
