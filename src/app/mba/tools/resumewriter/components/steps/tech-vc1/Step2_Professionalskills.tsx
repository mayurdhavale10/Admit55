// src/app/mba/tools/resumewriter/components/steps/tech-vc1/Step2_Professionalskills.tsx
"use client";

import React, { useMemo, useState } from "react";
import TechVC1Preview from "../../resume-templates/tech-vc1/TechVC1Preview";
import { rewriteTechBullets } from "../../../ai/rewriteTechBullets";

type TechVC1ExperienceItem = {
  id?: string;
  dateRange?: string;
  role: string;
  company?: string;
  location?: string;
  bullets?: string[];
};

type Props = {
  draft: any;
  setDraft: (next: any) => void;
  onNext?: () => void;
  onPrev?: () => void;
};

function cleanStr(v: unknown) {
  return (v ?? "").toString().trim();
}
function safeArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function ensureResumeRoot(draft: any) {
  return { ...(draft ?? {}), resume: { ...(draft?.resume ?? {}) } };
}

function BriefcaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 8h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 12h16" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
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

export default function Step2_Professionalskills({ draft, setDraft, onNext, onPrev }: Props) {
  const experience: TechVC1ExperienceItem[] = useMemo(() => {
    const r = draft?.resume ?? {};
    const raw =
      r.techVC1Experience ??
      r.vc1Experience ??
      r.techExperience ??
      r.experience ??
      r.experiences ??
      [];
    return safeArray(raw).map((e: any, i: number) => ({
      id: e?.id ?? `exp-${i}`,
      dateRange: cleanStr(e?.dateRange ?? e?.dates ?? ""),
      role: cleanStr(e?.role ?? e?.title ?? e?.position ?? "Role"),
      company: cleanStr(e?.company ?? ""),
      location: cleanStr(e?.location ?? ""),
      bullets: safeArray<string>(e?.bullets ?? e?.points ?? []).map((b) => (b ?? "").toString()),
    }));
  }, [draft?.resume?.techVC1Experience]);

  function setExperience(next: TechVC1ExperienceItem[]) {
    const nextDraft = ensureResumeRoot(draft);
    nextDraft.resume.techVC1Experience = next;
    setDraft(nextDraft);
  }

  function updateItem(i: number, patch: Partial<TechVC1ExperienceItem>) {
    const next = [...experience];
    next[i] = { ...next[i], ...patch };
    setExperience(next);
  }

  function updateBullet(expIdx: number, bulletIdx: number, newText: string) {
    const exp = experience[expIdx];
    const newBullets = [...(exp.bullets || [])];
    newBullets[bulletIdx] = newText;
    updateItem(expIdx, { bullets: newBullets });
  }

  function addBullet(expIdx: number) {
    const exp = experience[expIdx];
    const newBullets = [...(exp.bullets || []), ""];
    updateItem(expIdx, { bullets: newBullets });
  }

  function removeBullet(expIdx: number, bulletIdx: number) {
    const exp = experience[expIdx];
    const newBullets = (exp.bullets || []).filter((_, i) => i !== bulletIdx);
    updateItem(expIdx, { bullets: newBullets });
  }

  function addItem() {
    setExperience([
      ...experience,
      { id: `exp-new-${Date.now()}`, dateRange: "YYYY-MM - Current", role: "Role", company: "", location: "", bullets: [""] },
    ]);
  }

  function removeItem(i: number) {
    setExperience(experience.filter((_, idx) => idx !== i));
  }

  function moveItem(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= experience.length) return;
    const next = [...experience];
    [next[i], next[j]] = [next[j], next[i]];
    setExperience(next);
  }

  const previewData = useMemo(() => {
    const r = draft?.resume ?? {};
    const h = r.techVC1Header ?? {};
    const s = r.techVC1Summary ?? {};
    const summaryText = cleanStr(s?.text) || cleanStr(r.summary) || cleanStr(r.techSummary?.text) || "";

    const header = {
      name: cleanStr(h?.name) || cleanStr(h?.fullName) || "Your Name",
      title: cleanStr(h?.title) || "Software Engineer",
      addressLabel: "Address",
      address: cleanStr(h?.address) || "Dehradun, India 248001",
      phoneLabel: "Phone",
      phone: cleanStr(h?.phone),
      emailLabel: "E-mail",
      email: cleanStr(h?.email),
      linkedinLabel: "LinkedIn",
      linkedin: cleanStr(h?.linkedin) || cleanStr(h?.links?.linkedin),
      githubLabel: "GitHub",
      github: cleanStr(h?.github) || cleanStr(h?.links?.github),
      wwwLabel: "WWW",
      portfolio: cleanStr(h?.portfolio) || cleanStr(h?.links?.portfolio),
      wwwHint: "Bold Profile",
    };

    return { header, summary: summaryText, experience };
  }, [draft, experience]);

  const [busyBullet, setBusyBullet] = useState<string | null>(null);
  const [busyExp, setBusyExp] = useState<number | null>(null);

  async function handleRewriteSingleBullet(expIdx: number, bulletIdx: number) {
    const exp = experience[expIdx];
    const bullet = exp.bullets?.[bulletIdx] || "";
    
    setBusyBullet(`${expIdx}-${bulletIdx}`);

    try {
      const result = await rewriteTechBullets({
        raw: bullet,
        role: exp.role,
        company: exp.company,
        location: exp.location,
        mode: "bullets",
      });

      if (result.ok && result.bullets && result.bullets.length > 0) {
        updateBullet(expIdx, bulletIdx, result.bullets[0]);
      }
    } catch (e) {
      console.error("Rewrite failed", e);
    } finally {
      setBusyBullet(null);
    }
  }

  async function handleRewriteAllBullets(expIdx: number) {
    const exp = experience[expIdx];
    const allBulletsText = (exp.bullets || []).join("\n");
    
    setBusyExp(expIdx);

    try {
      const result = await rewriteTechBullets({
        raw: allBulletsText,
        role: exp.role,
        company: exp.company,
        location: exp.location,
        mode: "bullets",
      });

      if (result.ok && result.bullets && result.bullets.length > 0) {
        updateItem(expIdx, { bullets: result.bullets });
      }
    } catch (e) {
      console.error("Rewrite failed", e);
    } finally {
      setBusyExp(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_520px]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <IconTile><BriefcaseIcon /></IconTile>
          <div className="text-[#2f3b52] text-[20px] font-bold">Professional Journey</div>
        </div>

        <p className="mt-2 text-slate-600 text-[13px] leading-relaxed">
          Add bullet points for each role. Click <b>Rewrite with AI</b> on individual bullets or rewrite all at once.
        </p>

        <div className="mt-5 space-y-5">
          {experience.map((it, expIdx) => {
            const bullets = it.bullets || [];

            return (
              <div key={it.id ?? expIdx} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                  <div className="grid grid-cols-[120px_1fr] gap-6 items-start">
                    <div className="text-slate-600 text-[12px] leading-snug">{cleanStr(it.dateRange) || "YYYY-MM - Current"}</div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-[16px] leading-tight">{cleanStr(it.role) || "Role"}</div>
                      <div className="mt-1 text-slate-600 text-[12.5px]">
                        {cleanStr(it.company)}{cleanStr(it.company) && cleanStr(it.location) ? ", " : ""}{cleanStr(it.location)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => moveItem(expIdx, -1)} disabled={expIdx === 0}
                      className="px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 disabled:opacity-50">↑ Move up</button>
                    <button type="button" onClick={() => moveItem(expIdx, 1)} disabled={expIdx === experience.length - 1}
                      className="px-3 py-1.5 text-[12px] rounded-lg border border-slate-200 disabled:opacity-50">↓ Move down</button>
                    <button type="button" onClick={() => removeItem(expIdx)}
                      className="px-3 py-1.5 text-[12px] rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50">Remove</button>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <label className="block">
                      <div className="text-[12px] font-semibold text-slate-800">Date range</div>
                      <input type="text" value={it.dateRange ?? ""} onChange={(e) => updateItem(expIdx, { dateRange: e.target.value })}
                        placeholder="2023-06 - Current" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-slate-200" />
                    </label>

                    <label className="block">
                      <div className="text-[12px] font-semibold text-slate-800">Role</div>
                      <input type="text" value={it.role ?? ""} onChange={(e) => updateItem(expIdx, { role: e.target.value })}
                        placeholder="Technical Lead" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-slate-200" />
                    </label>

                    <label className="block">
                      <div className="text-[12px] font-semibold text-slate-800">Company</div>
                      <input type="text" value={it.company ?? ""} onChange={(e) => updateItem(expIdx, { company: e.target.value })}
                        placeholder="WrkSpot" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-slate-200" />
                    </label>

                    <label className="block">
                      <div className="text-[12px] font-semibold text-slate-800">Location</div>
                      <input type="text" value={it.location ?? ""} onChange={(e) => updateItem(expIdx, { location: e.target.value })}
                        placeholder="Dehradun, India (Remote)" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-slate-200" />
                    </label>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[12px] font-semibold text-slate-800">Bullet Points</div>
                      <button type="button" onClick={() => handleRewriteAllBullets(expIdx)} disabled={busyExp === expIdx}
                        className={["px-3 py-1.5 text-[11px] font-semibold rounded-lg",
                          busyExp === expIdx ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-[#2f3b52] text-white hover:opacity-95"].join(" ")}>
                        {busyExp === expIdx ? "Rewriting All..." : "🤖 Rewrite All with AI"}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {bullets.map((bullet, bulletIdx) => (
                        <div key={`${expIdx}-${bulletIdx}`} className="flex gap-2">
                          <div className="flex-1 rounded-xl border border-slate-200 p-3">
                            <textarea value={bullet} onChange={(e) => updateBullet(expIdx, bulletIdx, e.target.value)}
                              placeholder="Designed and implemented cloud platform using AWS..."
                              rows={2}
                              className="w-full text-[13px] outline-none resize-none" />
                            
                            <div className="mt-2 flex items-center gap-2">
                              <button type="button" onClick={() => handleRewriteSingleBullet(expIdx, bulletIdx)}
                                disabled={busyBullet === `${expIdx}-${bulletIdx}`}
                                className={["px-2 py-1 text-[11px] font-medium rounded-lg",
                                  busyBullet === `${expIdx}-${bulletIdx}` ? "bg-slate-100 text-slate-500" : "bg-slate-100 text-slate-700 hover:bg-slate-200"].join(" ")}>
                                {busyBullet === `${expIdx}-${bulletIdx}` ? "⏳" : "🤖 Rewrite"}
                              </button>
                              <button type="button" onClick={() => removeBullet(expIdx, bulletIdx)}
                                className="px-2 py-1 text-[11px] font-medium rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100">
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button type="button" onClick={() => addBullet(expIdx)}
                        className="w-full rounded-xl border border-dashed border-slate-300 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
                        + Add Bullet Point
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button type="button" onClick={addItem}
            className="w-full rounded-2xl border border-dashed border-slate-300 py-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
            + Add Experience
          </button>

          {(onPrev || onNext) && (
            <div className="mt-4 flex items-center justify-between">
              <button type="button" onClick={onPrev}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">Back</button>
              <button type="button" onClick={onNext}
                className="rounded-xl bg-[#2f3b52] px-5 py-2 text-[13px] font-semibold text-white hover:opacity-95">Next</button>
            </div>
          )}
        </div>
      </div>

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