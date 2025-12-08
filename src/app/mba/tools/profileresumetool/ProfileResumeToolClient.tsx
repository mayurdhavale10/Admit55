// src/app/mba/tools/profileresumetool/ProfileResumeToolClient.tsx
"use client";

import { useRef, useState } from "react";
import ResumeUploader from "./components/ResumeUploader";
import QuickForm from "./components/QuickForm";
import LoadingState from "./components/LoadingState";
import ResultDashboard from "./components/ResultDashboard";

import { analyzeResumeFile, analyzeResumeText } from "./utils/api";

type TabType = "form" | "upload";

export default function ProfileResumeToolClient() {
  const [activeTab, setActiveTab] = useState<TabType>("form");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs for scroll targets
  const quickFormRef = useRef<HTMLDivElement | null>(null);
  const uploadRef = useRef<HTMLDivElement | null>(null);

  const scrollToSection = (tab: TabType) => {
    const target = tab === "form" ? quickFormRef.current : uploadRef.current;

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    // wait till browser has had a chance to render, then scroll
    setTimeout(() => scrollToSection(tab), 50);
  };

  /** Handle File Upload **/
  const handleFileUpload = async (file: File) => {
    if (loading) return; // 🔥 guard
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const res = await analyzeResumeFile(file);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || "Failed to process file.");
    } finally {
      setLoading(false);
    }
  };

  /** Handle Quick Form Submission **/
  const handleFormSubmit = async (formData: any) => {
    if (loading) return; // 🔥 guard
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

      const res = await analyzeResumeText(textData);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || "Failed to analyze profile.");
    } finally {
      setLoading(false);
    }
  };

  /** Handle New Analysis - Clear results and show form **/
  const handleNewAnalysis = () => {
    setResult(null);
    setError(null);
    setActiveTab("form");
    setTimeout(() => scrollToSection("form"), 50);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* BIG BLUE SLATE */}
      <div className="bg-gradient-to-b from-slate-800 to-blue-900 px-4 pt-32 pb-52 md:pb-60 lg:pb-64">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-6">
            Review Your MBA Profile
          </h1>
          <p className="text-center text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Get an AI-powered analysis of your MBA readiness in minutes. Upload
            your resume or answer a few questions.
          </p>

          {/* Tabs */}
          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={() => handleTabClick("form")}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all ${
                activeTab === "form"
                  ? "bg-white text-blue-900 shadow-xl scale-105"
                  : "bg-blue-800/50 text-white hover:bg-blue-800/70 border border-blue-600/30"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
              onClick={() => handleTabClick("upload")}
              className={`flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all ${
                activeTab === "upload"
                  ? "bg-white text-blue-900 shadow-xl scale-105"
                  : "bg-blue-800/50 text-white hover:bg-blue-800/70 border border-blue-600/30"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Resume
            </button>
          </div>

          {/* AI Badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-md rounded-full text-white text-sm font-medium border border-white/20">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              AI-Curated with Human Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Both sections are always rendered; we just hide the inactive one */}
          {!loading && !result && (
            <div className="mt-6 space-y-6">
              <div
                ref={quickFormRef}
                className={activeTab === "form" ? "" : "hidden"}
              >
                <QuickForm onAnalyze={handleFormSubmit} />
              </div>

              <div
                ref={uploadRef}
                className={activeTab === "upload" ? "" : "hidden"}
              >
                <ResumeUploader onUpload={handleFileUpload} />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              ❌ {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mt-10">
              <LoadingState />
            </div>
          )}

          {/* Results Dashboard */}
          {result && !loading && (
            <div className="mt-10">
              <ResultDashboard
                data={result}
                onNewAnalysis={handleNewAnalysis}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
