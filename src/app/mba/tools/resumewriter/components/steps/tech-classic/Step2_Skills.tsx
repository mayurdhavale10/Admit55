"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { StepComponentProps } from "../registry";
import TechClassicPreview from "../../resume-templates/tech-classic/TechClassicPreview";

/* ---------------- types ---------------- */

type SkillCategory = {
  id: string;
  name: string;
  items: string[];
};

/* ---------------- constants ---------------- */

const DEFAULT_CATEGORIES: SkillCategory[] = [
  { id: crypto.randomUUID(), name: "Languages & Frameworks", items: [] },
  { id: crypto.randomUUID(), name: "Cloud & DevOps", items: [] },
  { id: crypto.randomUUID(), name: "Databases", items: [] },
  { id: crypto.randomUUID(), name: "Messaging", items: [] },
  { id: crypto.randomUUID(), name: "Frontend", items: [] },
];

/* ---------------- utils ---------------- */

function cleanStr(v: unknown) {
  return (v ?? "").toString().trim();
}

function uniqNonEmpty(arr: string[]) {
  const seen = new Set<string>();
  return arr.filter((raw) => {
    const s = cleanStr(raw);
    if (!s) return false;
    const k = s.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function parseSkills(input: string): string[] {
  return uniqNonEmpty(
    input.split(/\n|,|•|-|\u2022/g).map((t) => cleanStr(t))
  );
}

function categoriesToRows(categories: SkillCategory[]) {
  return categories
    .map((c) => ({
      label: cleanStr(c.name),
      value: uniqNonEmpty(c.items).join(", "),
    }))
    .filter((r) => r.label || r.value);
}

/* ---------------- component ---------------- */

export default function Step2_Skills_TechClassic({
  draft,
  setDraft,
  onNext,
  onPrev,
}: StepComponentProps) {
  const resume = (draft as any)?.resume ?? {};
  const header = resume.techHeader ?? {};
  const summary = resume.techSummary ?? {};

  /* ---------- init categories ---------- */

  const initialCategories = useMemo<SkillCategory[]>(() => {
    const rows = resume.techSkills?.rows;
    if (Array.isArray(rows) && rows.length) {
      return rows.map((r: any) => ({
        id: crypto.randomUUID(),
        name: cleanStr(r.label),
        items: parseSkills(r.value ?? ""),
      }));
    }
    // ✅ fallback to defaults
    return DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      id: crypto.randomUUID(), // fresh IDs
    }));
  }, []);

  const [categories, setCategories] =
    useState<SkillCategory[]>(initialCategories);

  const lastInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------- persist ---------- */

  const persist = (next: SkillCategory[]) => {
    setCategories(next);
    setDraft({
      ...(draft as any),
      resume: {
        ...resume,
        techSkills: {
          heading: resume.techSkills?.heading || "Skills",
          subHeading: resume.techSkills?.subHeading || "Name of Article",
          rows: categoriesToRows(next),
        },
      },
    });
  };

  /* ---------- handlers ---------- */

  const addCategory = () => {
    persist([
      ...categories,
      { id: crypto.randomUUID(), name: "", items: [] },
    ]);
  };

  const updateName = (id: string, name: string) => {
    persist(categories.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const updateItems = (id: string, text: string) => {
    persist(
      categories.map((c) =>
        c.id === id ? { ...c, items: parseSkills(text) } : c
      )
    );
  };

  const removeCategory = (id: string) => {
    persist(categories.filter((c) => c.id !== id));
  };

  useEffect(() => {
    lastInputRef.current?.focus();
  }, [categories.length]);

  /* ---------- preview ---------- */

  const previewData = useMemo(() => ({
    header: {
      name: header.fullName || "Your Name",
      title: header.title || "Your Title",
      phone: header.phone,
      email: header.email,
      linkedin: header.links?.linkedin,
      github: header.links?.github,
      portfolio: header.links?.portfolio,
      location: header.location,
    },
    summary: cleanStr(summary.text),
    skills: {
      heading: resume.techSkills?.heading || "Skills",
      subHeading: resume.techSkills?.subHeading || "Name of Article",
      rows: categoriesToRows(categories),
    },
    experiences: resume.techExperience ?? [],
    education: resume.techEducation ?? [],
    achievements: resume.techAchievements ?? [],
  }), [categories, resume, header, summary]);

  const canContinue = categories.some(
    (c) => cleanStr(c.name) || c.items.length
  );

  /* ---------- render ---------- */

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">

        {/* LEFT */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Step 2 — Skills</h2>
            <button
              onClick={addCategory}
              className="rounded-xl bg-[#002b5b] px-4 py-2 text-white"
            >
              + Add category
            </button>
          </div>

          {categories.map((cat, idx) => (
            <div key={cat.id} className="rounded-xl border p-4 space-y-3">
              <input
                ref={idx === categories.length - 1 ? lastInputRef : null}
                value={cat.name}
                onChange={(e) => updateName(cat.id, e.target.value)}
                placeholder="Category name"
                className="w-full rounded-lg border px-3 py-2"
              />

              <textarea
                rows={3}
                value={cat.items.join(", ")}
                onChange={(e) => updateItems(cat.id, e.target.value)}
                placeholder="Java, Spring Boot, REST..."
                className="w-full rounded-lg border px-3 py-2"
              />

              <button
                onClick={() => removeCategory(cat.id)}
                className="text-sm text-red-600"
              >
                Remove category
              </button>
            </div>
          ))}

          <div className="flex justify-between">
            <button onClick={onPrev}>Back</button>
            <button
              onClick={onNext}
              disabled={!canContinue}
              className="rounded-xl bg-[#002b5b] px-6 py-2 text-white disabled:bg-slate-400"
            >
              Continue
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="rounded-xl border p-2">
          <TechClassicPreview data={previewData as any} />
        </div>
      </div>
    </div>
  );
}
