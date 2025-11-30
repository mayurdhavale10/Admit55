"use client";

import { useCallback, useRef, useState } from "react";
import RadarGraph from "./RadarGraph";
import StrengthsCard from "./StrengthsCard";
import ImprovementCard from "./ImprovementCard";
import RecommendationCard from "./RecommendationCard";

interface ResultDashboardProps {
  data: any;
  onNewAnalysis?: () => void;
}

const SCORE_KEYS = [
  "academics",
  "test_readiness",
  "leadership",
  "extracurriculars",
  "international",
  "work_impact",
  "impact",
  "industry",
] as const;

const LABEL_MAP: Record<string, string> = {
  academics: "Academics",
  test_readiness: "Test Readiness",
  leadership: "Leadership",
  extracurriculars: "Extracurriculars",
  international: "International",
  work_impact: "Work Impact",
  impact: "Impact",
  industry: "Industry Exposure",
};

function normalizeScoreTo100(v: any): number {
  if (v == null || Number.isNaN(Number(v))) return 0;
  const n = Number(v);
  if (n <= 10) return Math.round(Math.max(0, Math.min(10, n)) * 10);
  return Math.round(Math.max(0, Math.min(100, n)));
}

export default function ResultDashboard({ data, onNewAnalysis }: ResultDashboardProps) {
  const scores: Record<string, number> = (data?.scores as Record<string, number>) || {};

  // Build radar input (label + normalized 0-100 score)
  const radarInput = SCORE_KEYS.map((k) => ({
    key: k,
    label: LABEL_MAP[k] ?? k,
    value: normalizeScoreTo100(scores[k]),
  }));

  // Strengths
  const backendStrengths = Array.isArray(data?.strengths) ? data.strengths : null;
  const strengths = (backendStrengths
    ? backendStrengths.map((s: any, i: number) => ({
        title: s?.title || `Strength ${i + 1}`,
        summary: typeof s?.summary === "string" ? s.summary : s?.summary_text || "",
        score: typeof s?.score === "number" ? Math.round(s.score) : null,
      }))
    : radarInput
        .filter((s) => s.value >= 70)
        .map((s) => ({
          title: s.label,
          summary: `Strong in ${s.label}.`,
          score: Math.round(s.value),
        }))
  ) as any[];

  // Improvements
  const backendImprovements = Array.isArray(data?.improvements) ? data.improvements : null;
  const gapsFromAPI = Array.isArray(data?.gaps) ? data.gaps : [];

  const improvements = (backendImprovements && backendImprovements.length > 0
    ? backendImprovements.map((g: any, i: number) => ({
        area: g?.area || `Area ${i + 1}`,
        score:
          typeof g?.score === "number"
            ? g.score > 10
              ? Math.round(Math.max(0, Math.min(100, g.score)))
              : Math.round(g.score * 10)
            : null,
        suggestion: g?.suggestion || g?.recommendation || "Consider strengthening this area.",
      }))
    : gapsFromAPI.length > 0
    ? gapsFromAPI.map((g: any, i: number) => ({
        area: g?.area || `Gap ${i + 1}`,
        score:
          typeof g?.score === "number"
            ? g.score > 10
              ? Math.round(Math.max(0, Math.min(100, g.score)))
              : Math.round(g.score * 10)
            : null,
        suggestion: g?.suggestion || "Consider improving this area.",
      }))
    : radarInput
        .filter((s) => s.value < 70)
        .map((s) => ({
          area: s.label,
          score: Math.round(s.value),
          suggestion: `Consider improving ${s.label.toLowerCase()} (current ${Math.round(
            s.value
          )}/100).`,
        }))
  ) as any[];

  // Recommendations
  const backendRecs = Array.isArray(data?.recommendations) ? data.recommendations : null;
  const recommendations = (backendRecs && backendRecs.length > 0
    ? backendRecs.map((r: any, i: number) => ({
        id: r?.id || `rec_${i + 1}`,
        type: r?.type || r?.category || "other",
        area: r?.area || r?.title || "General",
        priority: r?.priority || "medium",
        action: r?.action || r?.recommendation || r?.suggestion || "",
        estimated_impact: r?.estimated_impact || r?.impact || "",
        current_score:
          typeof r?.score === "number"
            ? r.score > 10
              ? Math.round(Math.max(0, Math.min(100, r.score)))
              : Math.round(r.score * 10)
            : null,
      }))
    : (improvements || []).slice(0, 6).map((imp: any, i: number) => ({
        id: `rec_fallback_${i + 1}`,
        type: "improvement",
        area: imp.area,
        priority: imp.score !== null && imp.score < 40 ? "high" : "medium",
        action: imp.suggestion || `Work on ${imp.area}`,
        estimated_impact: "Should meaningfully improve competitiveness",
        current_score: typeof imp.score === "number" ? imp.score : null,
      }))
  ) as any[];

  // ON-DEMAND improved resume
  const [improvedResume, setImprovedResume] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const improvedRef = useRef<HTMLDivElement | null>(null);

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Download report (PDF)
  // ---------------------------------------------------------------------------
  const downloadReport = useCallback(async () => {
    try {
      const res = await fetch("/api/mba/profileresumetool/report-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report: {
            ...data,
            downloaded_at: new Date().toISOString(),
            scoring_system: "8-key",
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("PDF API error:", res.status, text);
        alert("Failed to generate PDF report.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mba_profile_report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
      alert("Could not generate report for download.");
    }
  }, [data]);

  // ---------------------------------------------------------------------------
  // Email modal logic
  // ---------------------------------------------------------------------------
  const openEmailModal = useCallback(() => {
    const prefill =
      (typeof data?.user_email === "string" && data.user_email) ||
      (typeof data?.email === "string" && data.email) ||
      "";

    setEmailAddress(prefill);
    setEmailError(null);
    setIsEmailModalOpen(true);
  }, [data]);

  const closeEmailModal = useCallback(() => {
    if (emailSending) return;
    setIsEmailModalOpen(false);
  }, [emailSending]);

  const handleSendEmail = useCallback(async () => {
    if (emailSending) return;

    const trimmed = emailAddress.trim();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setEmailError(null);
    setEmailSending(true);

    try {
      const res = await fetch("/api/mba/profileresumetool/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: data,
          to: trimmed,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `HTTP ${res.status}`);
      }

      alert(`Report has been emailed to ${trimmed}.`);
      setIsEmailModalOpen(false);
    } catch (err) {
      console.error("Email failed", err);
      setEmailError("Failed to send email. Please try again in a moment.");
    } finally {
      setEmailSending(false);
    }
  }, [data, emailAddress, emailSending]);

  const startOver = useCallback(() => {
    window.location.href = "/mba/tools/profileresumetool";
  }, []);

  // ---------------------------------------------------------------------------
  // Generate improved resume handler
  // ---------------------------------------------------------------------------
  const handleGenerateImprovedResume = useCallback(async () => {
    if (improving) return;

    const candidates = [
      data?.original_resume,
      data?.raw_resume_text,
      data?.resume_text,
      data?.cleaned_text,
      data?.extracted_text,
    ];

    let sourceText = "";
    for (const t of candidates) {
      if (typeof t === "string" && t.trim().length > 0) {
        sourceText = t;
        break;
      }
    }

    if (!sourceText) {
      alert(
        "Could not find resume text in analysis response. Please make sure you analyzed a resume first."
      );
      return;
    }

    setImproving(true);
    try {
      const res = await fetch("/api/mba/profileresumetool/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: sourceText }),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch (parseErr) {
        console.error("[Rewrite] Failed to parse JSON response:", parseErr);
        alert("Server returned invalid response. Check console for details.");
        return;
      }

      if (!res.ok) {
        const message = json?.error || json?.detail || `HTTP ${res.status}: ${res.statusText}`;
        console.error("[Rewrite] API returned error:", {
          status: res.status,
          message,
          fullResponse: json,
        });
        alert(
          `Failed to improve resume: ${message}\n\nCheck the browser console for more details.`
        );
        return;
      }

      const improved =
        json?.improved_resume || json?.improvedResume || json?.data?.improved_resume || "";

      if (!improved || typeof improved !== "string") {
        console.warn("[Rewrite] No improved_resume field in response:", json);
        alert(
          "Server responded successfully but didn't return an improved resume. Check console for details."
        );
        return;
      }

      setImprovedResume(improved);

      setTimeout(() => {
        improvedRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err: any) {
      console.error("[Rewrite] Unexpected error:", err);
      alert(
        `Network error: ${err?.message || "Unknown error"}\n\nMake sure the server is running and accessible.`
      );
    } finally {
      setImproving(false);
    }
  }, [data, improving]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* ROW 1: Left main + right sidebar */}
        <div className="lg:col-span-9 space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Profile Strength Analysis</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Visual summary of your MBA readiness across key dimensions.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl bg-gradient-to-br from-white to-green-50 p-6">
                <RadarGraph
                  scores={radarInput.reduce(
                    (acc: Record<string, number>, r) => {
                      acc[r.label] = r.value;
                      return acc;
                    },
                    {}
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {radarInput.map((r) => (
                  <div
                    key={r.key}
                    className="bg-white rounded-xl p-4 border shadow-sm flex flex-col justify-between"
                  >
                    <div className="text-xs text-gray-500">{r.label}</div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-lg font-semibold">{Math.round(r.value)}</div>
                      <div className="w-2/3">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${r.value}%` }}
                            className={`h-2 rounded-full ${
                              r.value >= 70 ? "bg-emerald-500" : "bg-sky-500"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar (Quick summary + buttons) */}
        <aside className="lg:col-span-3 space-y-5">
          {/* Quick Summary */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border text-sm">
            <div className="font-semibold mb-2">Quick Summary</div>

            <div className="text-gray-600 text-sm space-y-1">
              <div>
                <strong>Average score:</strong>{" "}
                {(() => {
                  const vals = SCORE_KEYS.map((k) => normalizeScoreTo100(scores[k]));
                  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
                  return `${avg}/100`;
                })()}
              </div>
            </div>

            {onNewAnalysis && (
              <button
                onClick={onNewAnalysis}
                className="w-full mt-4 text-sm rounded-lg bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 transition-colors"
              >
                🔄 New Analysis
              </button>
            )}
          </div>

          {/* Next Steps */}
          <div className="rounded-2xl bg-sky-900 text-white p-5 shadow-sm">
            <h4 className="font-semibold text-base mb-3">Next Steps</h4>

            <div className="space-y-3">
              <button
                onClick={downloadReport}
                className="w-full text-sm rounded-lg bg-white text-sky-900 py-2.5 font-medium"
              >
                ⤓ Download Report
              </button>

              <button
                onClick={openEmailModal}
                className="w-full text-sm rounded-lg bg-white/90 text-sky-900 py-2.5 font-medium hover:bg-white"
              >
                ✉ Email Me This
              </button>

              <button
                onClick={startOver}
                className="w-full text-sm rounded-lg bg-transparent border border-white/40 text-white py-2.5 hover:bg-sky-800/60"
              >
                ↺ Start Over
              </button>
            </div>
          </div>

          {/* Book a Session - compact */}
          <div className="rounded-2xl bg-emerald-50 p-3 shadow-sm border">
            <h5 className="font-semibold text-sm">Book a Session</h5>
            <p className="text-[11px] text-gray-600 mt-1 leading-snug">
              Get personalised guidance from alumni{" "}
              <span className="text-gray-500">(integration pending)</span>.
            </p>

            <div className="mt-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Booking flow will be added later.");
                }}
                className="inline-block w-full text-center rounded-md bg-emerald-600 hover:bg-emerald-700 transition-colors text-white px-3 py-2 text-xs font-medium"
              >
                Schedule Now
              </a>
            </div>
          </div>
        </aside>

        {/* ROW 2: Strengths + Improvements spanning FULL width (12 cols) */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <StrengthsCard strengths={strengths} />

          <div className="flex flex-col gap-3">
            <ImprovementCard improvements={improvements} />

            <button
              type="button"
              onClick={handleGenerateImprovedResume}
              disabled={improving}
              className={`inline-flex items-center justify-center rounded-lg border text-xs md:text-sm font-medium px-4 py-2.5
              ${
                improving
                  ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                  : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
              }`}
            >
              {improving ? (
                <>
                  <span className="inline-block w-3 h-3 mr-2 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                  Generating Improved Resume…
                </>
              ) : (
                <>✨ Get Improved Resume (based on these gaps)</>
              )}
            </button>
          </div>
        </div>

        {/* ROW 3: Recommendations + Improved Resume, full width */}
        <div className="lg:col-span-12 space-y-6">
          {/* Recommendations */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border">
            <h3 className="text-xl font-semibold mb-3">Actionable Recommendations</h3>
            <div className="space-y-4">
              {recommendations.map((rec: any, idx: number) => (
                <RecommendationCard key={rec.id ?? idx} recommendations={[rec]} />
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleGenerateImprovedResume}
                disabled={improving}
                className={`inline-flex items-center rounded-lg text-xs md:text-sm font-medium px-4 py-2.5
                ${
                  improving
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100"
                }`}
              >
                {improving ? (
                  <>
                    <span className="inline-block w-3 h-3 mr-2 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>✨ Improve Resume from Recommendations</>
                )}
              </button>
            </div>
          </div>

          {/* Improved Resume */}
          <div ref={improvedRef} className="rounded-2xl bg-white border p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Improved Resume</h3>
            {!improvedResume && !improving && (
              <p className="text-sm text-gray-600">
                No improved resume generated yet. Use{" "}
                <span className="font-semibold">"Get Improved Resume"</span> from the Improvement
                Areas card or from the Recommendations section to generate a refined draft.
              </p>
            )}

            {improving && (
              <p className="mt-2 text-sm text-sky-700 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                Improving your resume with advanced prompts…
              </p>
            )}

            {improvedResume && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-slate-50 px-5 py-4 max-h-[480px] overflow-y-auto shadow-inner">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono text-gray-800">
                  {improvedResume}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 border border-sky-100">
            <div className="px-6 pt-5 pb-4 border-b border-sky-50 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center">
                <span className="text-sky-700 text-lg">✉</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Email your report</h2>
                <p className="text-xs text-slate-500">
                  We’ll send a PDF copy of your MBA profile report to your inbox.
                </p>
              </div>
            </div>

            <div className="px-6 pt-4 pb-2 space-y-3">
              <label className="block text-xs font-medium text-slate-700">
                Email address
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </label>

              {emailError && <p className="text-xs text-red-600">{emailError}</p>}

              <p className="text-[11px] text-slate-500">
                You can forward this report to mentors or save it for your MBA applications later.
              </p>
            </div>

            <div className="px-6 pb-4 pt-3 flex justify-end gap-3 bg-slate-50/60 rounded-b-2xl">
              <button
                type="button"
                onClick={closeEmailModal}
                disabled={emailSending}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={emailSending}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-sky-900 text-white hover:bg-sky-800 disabled:opacity-60 flex items-center gap-2"
              >
                {emailSending && (
                  <span className="inline-block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                <span>{emailSending ? "Sending…" : "Send Report"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
