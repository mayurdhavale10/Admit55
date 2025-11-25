"use client";

import { useCallback } from "react";
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

  // Improvements: prefer backend improvements -> gaps -> infer from radarInput
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

  const improvedResume = data?.improved_resume || data?.improvedResume || "";

  const downloadReport = useCallback(() => {
    try {
      const payload = {
        ...data,
        downloaded_at: new Date().toISOString(),
        scoring_system: "8-key",
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mba_profile_report.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
      alert("Could not generate report for download.");
    }
  }, [data]);

  const emailReport = useCallback(async () => {
    try {
      const res = await fetch("/api/mba/profileresumetool/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: data,
          to: prompt("Send report to (email):", "") || "",
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Report queued for email.");
    } catch (err) {
      console.error("Email failed", err);
      alert("Failed to send email.");
    }
  }, [data]);

  const startOver = useCallback(() => {
    window.location.href = "/mba/tools/profileresumetool";
  }, []);

  return (
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
              onClick={emailReport}
              className="w-full text-sm rounded-lg bg-white/90 text-sky-900 py-2.5 font-medium"
            >
              ✉ Email Me This
            </button>

            <button
              onClick={startOver}
              className="w-full text-sm rounded-lg bg-transparent border border-white/40 text-white py-2.5"
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
        <ImprovementCard improvements={improvements} />
      </div>

      {/* ROW 3: Recommendations + Improved Resume, full width */}
      <div className="lg:col-span-12 space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm border">
          <h3 className="text-xl font-semibold mb-3">Actionable Recommendations</h3>
          <div className="space-y-4">
            {recommendations.map((rec: any, idx: number) => (
              <RecommendationCard key={rec.id ?? idx} recommendations={[rec]} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white border p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-3">Improved Resume</h3>
          {improvedResume ? (
            <pre className="whitespace-pre-wrap text-gray-800 text-sm">{improvedResume}</pre>
          ) : (
            <div className="text-sm text-gray-500">No improved resume generated.</div>
          )}
        </div>
      </div>
    </div>
  );
}
