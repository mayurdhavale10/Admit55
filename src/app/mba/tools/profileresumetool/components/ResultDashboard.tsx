"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import RadarGraph from "./RadarGraph";
import StrengthsCard from "./StrengthsCard";
import ImprovementCard from "./ImprovementCard";
import RecommendationCard from "./RecommendationCard";

// ✅ NEW (you created these files)
import HeaderSummary from "./HeaderSummary";
import AdComPanel from "./AdComPanel";
import ActionPlan from "./ActionPlan";

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

function computeAvgAndTotal(scores: Record<string, number>) {
  const vals = SCORE_KEYS.map((k) => normalizeScoreTo100(scores[k]));
  const total = vals.reduce((a, b) => a + b, 0);
  const avg = vals.length ? total / vals.length : 0;
  return { avg100: Math.round(avg), total100: total, avg10: avg / 10, total10: total / 10 };
}

// Helper to identify spike areas (top 3 scores)
function getTopScores(radarInput: Array<{ key: string; label: string; value: number }>) {
  return radarInput
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((item) => item.label);
}

export default function ResultDashboard({ data, onNewAnalysis }: ResultDashboardProps) {
  const scores: Record<string, number> = (data?.scores as Record<string, number>) || {};

  const { avg10, total10 } = computeAvgAndTotal(scores);

  // Build radar input (label + normalized 0-100 score)
  const radarInput = SCORE_KEYS.map((k) => ({
    key: k,
    label: LABEL_MAP[k] ?? k,
    value: normalizeScoreTo100(scores[k]),
  }));

  const topScores = getTopScores([...radarInput]);

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
        }))) as any[];

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
        }))) as any[];

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
      }))) as any[];

  // ✅ NEW: AdCom Panel + Action Plan from API (if present)
  const adcom = data?.adcom_panel || data?.adcom || data?.what_adcom_sees || null;
  const actionPlan = data?.action_plan || data?.plan || null;

  const whatExcites: string[] = Array.isArray(adcom?.what_excites) ? adcom.what_excites : [];
  const whatConcerns: string[] = Array.isArray(adcom?.what_concerns) ? adcom.what_concerns : [];
  const howToPreempt: string[] = Array.isArray(adcom?.how_to_preempt) ? adcom.how_to_preempt : [];

  const next4to6Weeks =
    Array.isArray(actionPlan?.next_4_6_weeks) ? actionPlan.next_4_6_weeks : [];
  const next3Months = Array.isArray(actionPlan?.next_3_months) ? actionPlan.next_3_months : [];

  // ✅ FIXED: Extract header_summary from Python pipeline (with test fallback)
  const headerSummary = data?.header_summary || {
    summary: "TEST: This is a hardcoded summary to verify the UI works. If you see this, your Python pipeline isn't returning header_summary data.",
    highlights: ["7 years experience", "Corporate Strategy", "No GMAT/GRE", "Leadership", "Test Data"],
    applicantArchetypeTitle: "TEST: Experienced Professional",
    applicantArchetypeSubtitle: "Career Switcher"
  };

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
        headers: { "Content-Type": "application/json" },
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
        body: JSON.stringify({ report: data, to: trimmed }),
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

  return (
    <>
      {/* ✅ Header Summary */}
      <div className="mt-4 md:mt-8 px-2 sm:px-0">
        <HeaderSummary
          candidateName={data?.candidate_name || data?.name}
          averageScore={avg10}
          totalScore={total10}
          summary={headerSummary?.summary}
          highlights={headerSummary?.highlights}
          applicantArchetypeTitle={headerSummary?.applicantArchetypeTitle}
          applicantArchetypeSubtitle={headerSummary?.applicantArchetypeSubtitle}
          verification={data?.verification}
          generatedAt={data?.generated_at}
          pipelineVersion={data?.pipeline_version}
          processingMeta={data?.processing_meta}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mt-4 md:mt-6 px-2 sm:px-0">
        {/* ROW 1: REDESIGNED - Larger Radar Graph + Sidebar */}
        <div className="lg:col-span-9 space-y-4 md:space-y-6">
          {/* ✅ NEW: Larger Radar Chart with Spike Insight */}
          <div className="rounded-xl md:rounded-2xl bg-white p-4 md:p-8 shadow-sm border">
            {/* Header with Logo */}
            <div className="flex items-start gap-3 md:gap-4 mb-3">
              <Image
                src="/logo/admit55_final_logo.webp"
                alt="Admit55"
                width={40}
                height={40}
                className="w-8 h-8 md:w-10 md:h-10 object-contain flex-shrink-0"
              />
              <div>
                <h2 className="text-lg md:text-2xl font-extrabold text-slate-900">Profile Strength Analysis</h2>
              </div>
            </div>

            {/* Spike Insight - MOVED UP */}
            <div className="mb-4 md:mb-6 rounded-lg md:rounded-xl border-l-4 border-emerald-500 bg-emerald-50/50 p-3 md:p-5">
              <div className="flex items-start gap-2 md:gap-3">
                <div className="text-xl md:text-2xl flex-shrink-0">📊</div>
                <div>
                  <div className="text-xs md:text-sm font-bold text-emerald-900 mb-1 md:mb-2">Your Profile Spikes</div>
                  <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                    Successful admits typically show spikes in <span className="font-semibold">Test Readiness</span>, <span className="font-semibold">Work Impact</span>, and <span className="font-semibold">Leadership</span>. 
                    Your strongest areas are: <span className="font-bold text-emerald-800">{topScores.join(", ")}</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Large Radar Chart */}
            <div className="rounded-lg md:rounded-xl bg-gradient-to-br from-white to-green-50 p-4 md:p-8">
              <RadarGraph
                scores={radarInput.reduce((acc: Record<string, number>, r) => {
                  acc[r.label] = r.value;
                  return acc;
                }, {})}
              />
            </div>

            {/* Score Breakdown Grid - MOVED BELOW */}
            <div className="mt-4 md:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {radarInput.map((r) => (
                <div
                  key={r.key}
                  className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-[10px] md:text-xs font-semibold text-slate-600 mb-1 md:mb-2 truncate">{r.label}</div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="text-xl md:text-2xl font-bold text-slate-900">{Math.round(r.value)}</div>
                    <div className="flex-1">
                      <div className="h-1.5 md:h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${r.value}%` }}
                          className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ${
                            r.value >= 80 ? "bg-emerald-500" : r.value >= 60 ? "bg-sky-500" : "bg-amber-500"
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

        {/* Sidebar (Quick summary + buttons) */}
        <aside className="lg:col-span-3 space-y-4 md:space-y-5">
          {/* Quick Summary - PROFESSIONAL REDESIGN */}
          <div className="rounded-xl md:rounded-2xl bg-white p-4 md:p-5 shadow-md border border-slate-200">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Image
                src="/logo/admit55_final_logo.webp"
                alt="Admit55"
                width={24}
                height={24}
                className="w-5 h-5 md:w-6 md:h-6 object-contain"
              />
              <h4 className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wide">Profile Summary</h4>
            </div>

            {/* Score Display */}
            <div className="mb-3 md:mb-4">
              <div className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Overall Score
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-black text-slate-900">
                  {Math.round(avg10 * 10)}
                </span>
                <span className="text-base md:text-lg font-semibold text-slate-500">/100</span>
              </div>
            </div>

            {onNewAnalysis && (
              <button
                onClick={onNewAnalysis}
                className="w-full text-xs md:text-sm rounded-lg bg-red-600 text-white py-2.5 md:py-3 font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
               🔄 New Analysis
              </button>
            )}
          </div>

          {/* Next Steps */}
          <div className="rounded-xl md:rounded-2xl bg-sky-900 text-white p-4 md:p-5 shadow-sm">
            <h4 className="font-semibold text-sm md:text-base mb-3">Next Steps</h4>

            <div className="space-y-2 md:space-y-3">
              <button
                onClick={downloadReport}
                className="w-full text-xs md:text-sm rounded-lg bg-white text-sky-900 py-2 md:py-2.5 font-medium"
              >
                ⤓ Download Report
              </button>

              <button
                onClick={openEmailModal}
                className="w-full text-xs md:text-sm rounded-lg bg-white/90 text-sky-900 py-2 md:py-2.5 font-medium hover:bg-white"
              >
                ✉ Email Me This
              </button>

              <button
                onClick={startOver}
                className="w-full text-xs md:text-sm rounded-lg bg-transparent border border-white/40 text-white py-2 md:py-2.5 hover:bg-sky-800/60"
              >
                ↺ Start Over
              </button>
            </div>
          </div>

          {/* Book a Session */}
          <div className="rounded-xl md:rounded-2xl bg-emerald-50 p-3 shadow-sm border">
            <h5 className="font-semibold text-xs md:text-sm text-slate-900">Book a Session</h5>
            <p className="text-[10px] md:text-[11px] text-slate-700 mt-1 leading-snug">
              Get personalised guidance from alumni <span className="text-slate-500">(integration pending)</span>.
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

          {/* Know More About Admit55 Card */}
          <div className="rounded-xl md:rounded-2xl bg-emerald-50 p-3 md:p-4 shadow-sm border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <Image
                src="/logo/admit55_final_logo.webp"
                alt="Admit55"
                width={24}
                height={24}
                className="w-5 h-5 md:w-6 md:h-6 object-contain"
              />
              <h5 className="font-semibold text-xs md:text-sm text-slate-900">Know more about Admit55</h5>
            </div>
            <p className="text-[10px] md:text-[11px] text-slate-700 mt-1 leading-snug mb-3">
              Discover how we help aspiring MBA candidates achieve their dreams with personalized guidance and expert support.
            </p>

            <div className="mt-2">
              <a
                href="/"
                className="inline-block w-full text-center rounded-md bg-emerald-600 hover:bg-emerald-700 transition-colors text-white px-3 py-2 text-xs font-medium"
              >
                Learn More →
              </a>
            </div>
          </div>
        </aside>

        {/* ROW 2: Strengths + Improvements */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-stretch">
          <StrengthsCard strengths={strengths} />
          <ImprovementCard improvements={improvements} />
        </div>

        {/* ✅ ROW 3: AdCom Panel (MOVED HERE - right after improvements) */}
        {(whatExcites.length || whatConcerns.length || howToPreempt.length) ? (
          <div className="lg:col-span-12">
            <AdComPanel whatExcites={whatExcites} whatConcerns={whatConcerns} howToPreempt={howToPreempt} />
          </div>
        ) : null}

        {/* ROW 4: Action Plan */}
        {(next4to6Weeks.length || next3Months.length) ? (
          <div className="lg:col-span-12">
            <ActionPlan next4to6Weeks={next4to6Weeks} next3Months={next3Months} />
          </div>
        ) : null}

        {/* ROW 5: Recommendations */}
        <div className="lg:col-span-12 space-y-4 md:space-y-6">
          {/* Recommendations */}
          <div className="rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-sm border">
            <h3 className="text-lg md:text-xl font-semibold mb-3 text-slate-900">Actionable Recommendations</h3>
            <div className="space-y-3 md:space-y-4">
              {recommendations.map((rec: any, idx: number) => (
                <RecommendationCard key={rec.id ?? idx} recommendations={[rec]} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl max-w-md w-full border border-sky-100">
            <div className="px-4 md:px-6 pt-4 md:pt-5 pb-3 md:pb-4 border-b border-sky-50 flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sky-700 text-base md:text-lg">✉</span>
              </div>
              <div>
                <h2 className="text-sm md:text-base font-semibold text-slate-900">Email your report</h2>
                <p className="text-[10px] md:text-xs text-slate-500">
                  We'll send a PDF copy of your MBA profile report to your inbox.
                </p>
              </div>
            </div>

            <div className="px-4 md:px-6 pt-3 md:pt-4 pb-2 space-y-3">
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

              <p className="text-[10px] md:text-[11px] text-slate-500">
                You can forward this report to mentors or save it for your MBA applications later.
              </p>
            </div>

            <div className="px-4 md:px-6 pb-3 md:pb-4 pt-2 md:pt-3 flex justify-end gap-2 md:gap-3 bg-slate-50/60 rounded-b-xl md:rounded-b-2xl">
              <button
                type="button"
                onClick={closeEmailModal}
                disabled={emailSending}
                className="px-3 md:px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={emailSending}
                className="px-3 md:px-4 py-2 text-xs font-medium rounded-lg bg-sky-900 text-white hover:bg-sky-800 disabled:opacity-60 flex items-center gap-2"
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