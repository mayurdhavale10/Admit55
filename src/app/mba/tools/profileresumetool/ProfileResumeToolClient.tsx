// src/app/mba/tools/profileresumetool/ProfileResumeToolClient.tsx
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import ResumeUploader from "./components/ResumeUploader";
import QuickForm from "./components/QuickForm";
import LoadingState from "./components/LoadingState";
import ResultDashboard from "./components/ResultDashboard";
import DiscoveryQuestions from "./components/DiscoveryQuestions";

import { analyzeResumeFile, analyzeResumeText } from "./utils/api";

type SelectedOption = "quickform" | "consultant" | "upload" | null;

export default function ProfileResumeToolClient() {
  const router = useRouter();

  const [selectedOption, setSelectedOption] = useState<SelectedOption>(null);
  const [discoveryAnswers, setDiscoveryAnswers] = useState<Record<string, string> | null>(null);
  const [showDiscovery, setShowDiscovery] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs for scroll targets
  const quickFormRef = useRef<HTMLDivElement>(null);
  const discoveryRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  // ✅ keep your exact input sizing
  const INPUT_WRAP = "mt-6 space-y-6 max-w-4xl mx-auto";

  const scrollToSection = (ref: { current: HTMLDivElement | null }) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ✅ Button style: match the "blue tab" look from your 2nd code (NO glass / NO blur)
  const btnBase =
    "flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all";
  const btnBlueIdle =
    "bg-blue-800/50 text-white hover:bg-blue-800/70 border border-blue-600/30";
  const btnBlueActive = "bg-white text-blue-900 shadow-xl scale-105";

  // Consultant gets a subtle green tint but same “system”
  const btnGreenIdle =
    "bg-emerald-600/25 text-white hover:bg-emerald-600/35 border border-emerald-300/25";
  const btnGreenActive = "bg-white text-emerald-800 shadow-xl scale-105";

  const handleQuickFormClick = () => {
    setSelectedOption("quickform");
    setDiscoveryAnswers(null);
    setShowDiscovery(false);
    setError(null);
    setResult(null);
    setTimeout(() => scrollToSection(quickFormRef), 120);
  };

  const handleConsultantModeClick = () => {
    setSelectedOption("consultant");
    setDiscoveryAnswers(null);
    setShowDiscovery(true);
    setError(null);
    setResult(null);
    setTimeout(() => scrollToSection(discoveryRef), 120);
  };

  const handleUploadOnlyClick = () => {
    setSelectedOption("upload");
    setDiscoveryAnswers(null);
    setShowDiscovery(false);
    setError(null);
    setResult(null);
    setTimeout(() => scrollToSection(uploadRef), 120);
  };

  const handleDiscoveryComplete = (answers: Record<string, string>) => {
    setDiscoveryAnswers(answers);
    setShowDiscovery(false);
    setTimeout(() => scrollToSection(uploadRef), 120);
  };

  const handleDiscoverySkip = () => {
    setDiscoveryAnswers(null);
    setShowDiscovery(false);
    setTimeout(() => scrollToSection(uploadRef), 120);
  };

  // ✅ Central handler for auth/quota/upgrade responses
  const handleAuthOrQuota = async (err: any) => {
    const status = err?.status;

    // Not logged in / session expired
    if (status === 401) {
      await signIn("google", { callbackUrl: "/mba/tools/profileresumetool" });
      return true;
    }

    // Upgrade required / quota exceeded
    if (status === 402 || status === 403 || status === 429) {
      setError("Free limit reached. Please upgrade to continue.");
      router.push("/upgradetopro");
      return true;
    }

    return false;
  };

  /** Handle File Upload **/
  const handleFileUpload = async (file: File) => {
    if (loading) return;
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const res = await analyzeResumeFile(file, discoveryAnswers);
      setResult(res);
    } catch (err: any) {
      const handled = await handleAuthOrQuota(err);
      if (!handled) setError(err?.message || "Failed to process file.");
    } finally {
      setLoading(false);
    }
  };

  /** Handle Quick Form Submission **/
  const handleFormSubmit = async (formData: any) => {
    if (loading) return;
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const textData = `
Work Experience: ${formData.workExperience}
Industry & Role: ${formData.industryRole}
Education: ${formData.education}
Achievements: ${formData.achievements}
Leadership: ${formData.leadership}
Extracurriculars: ${formData.extracurriculars}
GMAT/GRE: ${formData.gmatScore}
      `.trim();

      const res = await analyzeResumeText(textData, discoveryAnswers);
      setResult(res);
    } catch (err: any) {
      const handled = await handleAuthOrQuota(err);
      if (!handled) setError(err?.message || "Failed to analyze profile.");
    } finally {
      setLoading(false);
    }
  };

  /** Handle New Analysis **/
  const handleNewAnalysis = () => {
    setResult(null);
    setError(null);
    setDiscoveryAnswers(null);
    setSelectedOption(null);
    setShowDiscovery(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* HERO */}
      <div className="bg-gradient-to-b from-slate-800 to-blue-900 px-4 pt-24 pb-28">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 bg-white/10 rounded-full border border-white/15">
              <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 22h8m-2-4a4 4 0 00-4 0m7-9a5 5 0 10-10 0c0 1.657.895 2.5 1.5 3.2.525.61.9 1.047.9 1.8V15h5.2v-.999c0-.753.375-1.19.9-1.8C15.105 11.5 16 10.657 16 9z"
                />
              </svg>
              <span className="text-white/90 text-xs md:text-sm font-medium">
                AI-Curated with Human Intelligence
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Review Your MBA Profile
            </h1>

            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px w-10 md:w-14 bg-gradient-to-r from-transparent to-blue-300/80" />
              <div className="flex items-center gap-3">
                <span className="text-xl md:text-3xl font-light text-blue-100/90">with</span>

                <Image
                  src="/logo/admit55_final_logo.webp"
                  alt="Admit55"
                  width={56}
                  height={56}
                  className="w-11 h-11 md:w-14 md:h-14"
                />

                <span className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                  Admit55
                </span>
              </div>
              <div className="h-px w-10 md:w-14 bg-gradient-to-l from-transparent to-blue-300/80" />
            </div>

            <p className="text-base md:text-lg text-blue-100/90 max-w-3xl mx-auto leading-relaxed font-light">
              Get an AI-powered analysis of your MBA readiness in minutes.
              <br />
              <span className="text-white font-semibold">Choose your path below.</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={handleQuickFormClick}
              className={[btnBase, selectedOption === "quickform" ? btnBlueActive : btnBlueIdle].join(" ")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Quick Form
            </button>

            <button
              onClick={handleConsultantModeClick}
              className={[btnBase, selectedOption === "consultant" ? btnGreenActive : btnGreenIdle].join(" ")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Consultant Mode
              <span className="ml-2 inline-flex text-[11px] px-2 py-1 rounded-full bg-amber-400 text-amber-900 font-extrabold shadow-sm">
                RECOMMENDED
              </span>
            </button>

            <button
              onClick={handleUploadOnlyClick}
              className={[btnBase, selectedOption === "upload" ? btnBlueActive : btnBlueIdle].join(" ")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Only
            </button>
          </div>

          <div className="mt-6 text-center text-blue-200/85 text-sm">
            {selectedOption === "quickform" && "Fill a short form for a quick, clean analysis."}
            {selectedOption === "consultant" &&
              "Answer strategic questions first, then upload your resume for a consultant-level plan."}
            {selectedOption === "upload" && "Upload your resume for the fastest general analysis."}
            {!selectedOption && "Select an option to begin."}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="py-10 px-4">
        <div className="max-w-7xl mx-auto">
          {selectedOption === "quickform" && !loading && !result && (
            <div ref={quickFormRef} className={INPUT_WRAP}>
              <QuickForm onAnalyze={handleFormSubmit} />
            </div>
          )}

          {selectedOption === "consultant" && showDiscovery && !loading && !result && (
            <div ref={discoveryRef} className={INPUT_WRAP}>
              <DiscoveryQuestions onComplete={handleDiscoveryComplete} onSkip={handleDiscoverySkip} />
            </div>
          )}

          {((selectedOption === "consultant" && !showDiscovery) || selectedOption === "upload") &&
            !loading &&
            !result && (
              <div ref={uploadRef} className={INPUT_WRAP}>
                {discoveryAnswers && (
                  <div className="rounded-2xl bg-emerald-50 p-6 border border-emerald-200">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-lg mb-1">✨ Consultant Mode Active</h4>
                        <p className="text-slate-700 leading-relaxed">
                          Your analysis will be personalized using your goals, timeline, and preferences.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <ResumeUploader onUpload={handleFileUpload} />
              </div>
            )}

          {error && (
            <div className="mt-6 max-w-4xl mx-auto">
              <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-800">
                ❌ {error}
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-10 max-w-4xl mx-auto">
              <LoadingState />
            </div>
          )}

          {result && !loading && (
            <div className="mt-10">
              <ResultDashboard data={result} onNewAnalysis={handleNewAnalysis} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
