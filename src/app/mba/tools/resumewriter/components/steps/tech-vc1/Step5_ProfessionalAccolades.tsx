// src/app/mba/tools/resumewriter/components/steps/tech-vc1/Step5_Achievements.tsx
"use client";

import React, { useMemo, useState } from "react";
import TechVC1Preview from "../../resume-templates/tech-vc1/TechVC1Preview";
import { rewriteTechBullets } from "../../../ai/rewriteTechBullets";

type AchievementItem = {
  id: string;
  text: string;     // supports **bold** markdown
  bold?: boolean;   // if true, we auto-wrap whole line in ** **
};

type AchievementsState = {
  heading: string;
  items: AchievementItem[];
};

type Props = {
  draft: any;
  setDraft: (next: any) => void;
  onNext?: () => void;
  onPrev?: () => void;
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Math.random().toString(16).slice(2)}`;

function asInput(v: unknown) {
  return (v ?? "").toString();
}
function cleanStr(v: unknown) {
  return (v ?? "").toString().trim();
}
function safeArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function ensureResumeRoot(draft: any) {
  return { ...(draft ?? {}), resume: { ...(draft?.resume ?? {}) } };
}

function clampOneLine(text: string) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function stripOuterBold(s: string) {
  const t = (s ?? "").trim();
  if (t.startsWith("**") && t.endsWith("**") && t.length >= 4) return t.slice(2, -2).trim();
  return t;
}
function applyOuterBold(s: string) {
  const t = stripOuterBold(s);
  if (!t) return "";
  return `**${t}**`;
}

function normalizeToBullets(input: string): string[] {
  const s = (input ?? "").replace(/\r/g, "").trim();
  if (!s) return [];

  const lines = s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const looksBulletish =
    lines.length >= 2 &&
    lines.filter((l) => /^(\*|-|•|\d+[\).\]])\s+/.test(l)).length >= Math.ceil(lines.length * 0.5);

  if (looksBulletish) {
    return lines
      .map((l) => l.replace(/^(\*|-|•|\d+[\).\]])\s+/, "").trim())
      .filter(Boolean);
  }

  const chunks = s.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const bullets: string[] = [];
  for (const p of chunks) {
    const sentences = p
      .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (sentences.length <= 1) bullets.push(p);
    else bullets.push(...sentences);
  }
  return bullets;
}

function AwardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 15a6 6 0 1 0-6-6 6 6 0 0 0 6 6Z" stroke="white" strokeWidth="1.8" />
      <path d="M9 14.5 7 22l5-2 5 2-2-7.5" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-11 w-11 shrink-0 rounded-md bg-[#2f3b52] flex items-center justify-center">
      {children}
    </div>
  );
}

export default function Step5_Achievements({ draft, setDraft, onNext, onPrev }: Props) {
  const resume = draft?.resume ?? {};
  const saved = resume?.techVC1Achievements ?? {};

  const initialState = useMemo<AchievementsState>(() => {
    const savedItems = safeArray<any>(saved?.items ?? saved);
    const items: AchievementItem[] =
      savedItems.length > 0
        ? savedItems.map((x: any) => ({
            id: asInput(x.id) || uid(),
            text: asInput(x.text ?? x.value ?? x),
            bold: typeof x?.bold === "boolean" ? x.bold : false,
          }))
        : [
            {
              id: uid(),
              text: "Promoted to **Business Lead** within 6 months; managed business requirements and built core product.",
              bold: false,
            },
            {
              id: uid(),
              text: "Won **Best Team of the Quarter** award (top among 15 teams).",
              bold: false,
            },
          ];

    return {
      heading: asInput(saved?.heading) || "Professional Accolades",
      items,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [state, setState] = useState<AchievementsState>(initialState);
  const [busy, setBusy] = useState(false);

  const persist = (next: AchievementsState) => {
    setState(next);
    const nextDraft = ensureResumeRoot(draft);

    // store as array of { bullets: string[] } to match your template's TechVC1AchievementItem
    nextDraft.resume.techVC1Achievements = next.items
      .map((it) => {
        const raw = cleanStr(it.text);
        const finalText = it.bold ? applyOuterBold(raw) : stripOuterBold(raw);
        return cleanStr(finalText) ? { bullets: [finalText] } : null;
      })
      .filter(Boolean);

    setDraft(nextDraft);
  };

  const addItem = () =>
    persist({
      ...state,
      items: [...state.items, { id: uid(), text: "", bold: false }],
    });

  const removeItem = (id: string) =>
    persist({ ...state, items: state.items.filter((x) => x.id !== id) });

  const updateHeading = (v: string) => persist({ ...state, heading: v });

  const updateItemText = (id: string, val: string) =>
    persist({
      ...state,
      items: state.items.map((x) => (x.id === id ? { ...x, text: val } : x)),
    });

  const toggleBold = (id: string) => {
    const next = {
      ...state,
      items: state.items.map((x) => {
        if (x.id !== id) return x;
        const nextBold = !x.bold;
        const raw = cleanStr(x.text);
        return { ...x, bold: nextBold, text: nextBold ? applyOuterBold(raw) : stripOuterBold(raw) };
      }),
    };
    persist(next);
  };

  async function rewriteAllWithAI() {
    const lines = state.items.map((it) => stripOuterBold(cleanStr(it.text))).filter(Boolean);
    if (!lines.length) return;

    setBusy(true);
    try {
      const result = await rewriteTechBullets({
        raw: lines.join("\n"),
        mode: "bullets",
        role: "",
        company: "",
        location: "",
      });

      const bullets = result?.ok && Array.isArray(result?.bullets) ? result.bullets : normalizeToBullets(lines.join("\n"));

      const rebuilt: AchievementItem[] = bullets.map((b, i) => {
        const prev = state.items[i];
        const keepBold = prev?.bold ?? false;
        const finalText = keepBold ? applyOuterBold(b) : b;
        return { id: prev?.id ?? uid(), text: finalText, bold: keepBold };
      });

      // if AI returned fewer, keep remaining items (unchanged)
      const tail = state.items.slice(rebuilt.length);
      persist({ ...state, items: [...rebuilt, ...tail] });
    } catch {
      // fallback: just normalize into bullets (no AI)
      const bullets = normalizeToBullets(lines.join("\n"));
      const rebuilt: AchievementItem[] = bullets.map((b, i) => {
        const prev = state.items[i];
        const keepBold = prev?.bold ?? false;
        return { id: prev?.id ?? uid(), text: keepBold ? applyOuterBold(b) : b, bold: keepBold };
      });
      const tail = state.items.slice(rebuilt.length);
      persist({ ...state, items: [...rebuilt, ...tail] });
    } finally {
      setBusy(false);
    }
  }

  // Preview bundle
  const header = resume?.techVC1Header ?? {};
  const summary = resume?.techVC1Summary ?? {};
  const skills = resume?.techVC1Skills ?? {};
  const experience = resume?.techVC1Experience ?? {};
  const education = resume?.techVC1Education ?? {};

  const previewData = useMemo(() => {
    return {
      header: {
        name: cleanStr(header.name ?? header.fullName) || "YOUR NAME",
        title: cleanStr(header.title) || undefined,
        phone: cleanStr(header.phone) || undefined,
        email: cleanStr(header.email) || undefined,
        address: cleanStr(header.address ?? header.location) || undefined,
        linkedin: cleanStr(header.linkedin) || undefined,
        github: cleanStr(header.github) || undefined,
        portfolio: cleanStr(header.portfolio) || undefined,
      },
      summary: cleanStr(summary.text) || "",
      skills,
      experience,
      education,
      achievements: state.items
        .map((it) => {
          const t = cleanStr(it.text);
          const finalText = it.bold ? applyOuterBold(t) : stripOuterBold(t);
          return cleanStr(finalText) ? { bullets: [finalText] } : null;
        })
        .filter(Boolean),
      page: 2,
    };
  }, [header, summary, skills, experience, education, state.items]);

  const canContinue = state.items.some((it) => cleanStr(stripOuterBold(it.text)));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
      {/* LEFT */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconTile>
              <AwardIcon />
            </IconTile>
            <div>
              <div className="text-[#2f3b52] text-[20px] font-bold">Professional Accolades</div>
              <div className="mt-1 text-slate-600 text-[13px]">
                One bullet per line. Use <b>**bold**</b> inside a line, or toggle whole-line bold.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={rewriteAllWithAI}
              disabled={busy}
              className={[
                "rounded-xl px-3 py-2 text-[13px] font-semibold",
                busy ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-[#2f3b52] text-white hover:opacity-95",
              ].join(" ")}
              title="Rewrite all bullets with Admit55 AI (keeps your bold toggles)"
            >
              {busy ? "Rewriting..." : "Rewrite with Admit55 AI"}
            </button>

            <button
              type="button"
              onClick={addItem}
              className="rounded-xl border border-slate-200 px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              + Add
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 p-4">
          <div className="text-[12px] font-semibold text-slate-800">Section heading</div>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Professional Accolades"
            value={state.heading ?? ""}
            onChange={(e) => updateHeading(asInput(e.target.value))}
          />
        </div>

        <div className="mt-5 space-y-3">
          {state.items.map((it, idx) => (
            <div key={it.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] font-semibold text-slate-800">Accolade #{idx + 1}</div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleBold(it.id)}
                    className={[
                      "rounded-lg border px-3 py-1.5 text-[12px] font-semibold",
                      it.bold
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                    title="Toggle whole-line bold"
                  >
                    Bold line
                  </button>

                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-[12px] font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Promoted to **Tech Lead** within 6 months; led X..."
                value={it.text ?? ""}
                onChange={(e) => updateItemText(it.id, asInput(e.target.value))}
              />

              <div className="mt-2 text-[12px] text-slate-500">
                Tip: use <b>**keyword**</b> to bold only parts. Whole-line bold uses the toggle.
              </div>
            </div>
          ))}
        </div>

        {(onPrev || onNext) && (
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={onPrev}
              className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!canContinue}
              className="rounded-xl bg-[#2f3b52] px-5 py-2 text-[13px] font-semibold text-white disabled:bg-slate-300 disabled:text-slate-600"
            >
              Continue
            </button>
          </div>
        )}
      </div>

      {/* RIGHT */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="text-sm font-semibold text-slate-900">Live Preview (Tech VC 1)</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-2">
          <TechVC1Preview data={previewData as any} />
        </div>
      </div>
    </div>
  );
}
