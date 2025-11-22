import os
import json

# Paths
src_dir = r"C:\Users\dhava\Downloads\Admit55\admit55\data\mba\labels_normalized\partner_uploads\processed"
dst_dir = r"C:\Users\dhava\Downloads\Admit55\admit55\data\mba\resumes_raw\partner_uploads\processed"

os.makedirs(dst_dir, exist_ok=True)

def format_role(role):
    title = role.get("title", "")
    company = role.get("company", "")
    location = role.get("location", "")
    start = role.get("start", "")
    end = role.get("end", "")
    header = f"{title} – {company} | {start} – {end} | {location}".strip(" |")
    bullets = role.get("bullets", [])
    formatted_bullets = "\n".join([f"• {b['text']}" for b in bullets if 'text' in b])
    return f"{header}\n{formatted_bullets}\n"

def format_education(edu_list):
    lines = []
    for e in edu_list:
        line = f"• {e.get('school', '')} — {e.get('degree', '')} ({e.get('discipline', '')})"
        lines.append(line)
    return "\n".join(lines)

for i in range(10, 51):
    json_file = os.path.join(src_dir, f"{i:04d}.json")
    txt_file = os.path.join(dst_dir, f"{i:04d}.txt")

    if not os.path.exists(json_file):
        print(f"⚠️ Skipping {i:04d}.json — not found.")
        continue

    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Build resume text
    text_parts = []

    # Roles
    if "roles" in data:
        for r in data["roles"]:
            text_parts.append(format_role(r))

    # Education
    if "education" in data:
        text_parts.append("\nEducation")
        text_parts.append(format_education(data["education"]))

    # Extracurriculars
    if "extracurriculars" in data and data["extracurriculars"]:
        text_parts.append("\nExtracurriculars / Activities")
        for e in data["extracurriculars"]:
            text_parts.append(f"• {e.get('text', '')}")

    # Awards
    if "awards" in data and data["awards"]:
        text_parts.append("\nAwards")
        for a in data["awards"]:
            text_parts.append(f"• {a}")

    # Combine and write
    resume_text = "\n".join(text_parts).strip()
    with open(txt_file, "w", encoding="utf-8") as f:
        f.write(resume_text)

    print(f"✅ Converted: {i:04d}.json → {i:04d}.txt")

print("\n🎯 All resumes converted successfully to readable format.")
