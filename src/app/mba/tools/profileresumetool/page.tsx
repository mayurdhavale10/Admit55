"use client";

import { useState } from "react";
import ResumeUploader from "./components/ResumeUploader";
import QuickForm from "./components/QuickForm";
import LoadingState from "./components/LoadingState";
import ResultDashboard from "./components/ResultDashboard";

import {
  analyzeResumeFile,
  analyzeResumeText,
} from "./utils/api";

type TabType = "form" | "upload";

export default function ProfileResumeToolPage() {
  const [activeTab, setActiveTab] = useState<TabType>("form");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  /** Handle File Upload **/
  const handleFileUpload = async (file: File) => {
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
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      // Convert form data to text format for API
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Title - MOVED DOWN AND MADE THICKER */}
          <h1 className="text-3xl md:text-5xl font-black text-black text-center mb-4 mt-8">
            Review Your MBA Profile
          </h1>
          <p className="text-center text-blue-50 text-base md:text-xl mb-8">
            Get an AI-powered analysis of your MBA readiness in minutes. Upload your
            resume or answer a few questions.
          </p>

          {/* Tabs */}
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setActiveTab("form")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === "form"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-blue-700 text-white hover:bg-blue-600"
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
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === "upload"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-blue-700 text-white hover:bg-blue-600"
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
          <div className="flex justify-end mt-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              AI-Powered Analysis
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Tab Content */}
          {!loading && !result && (
            <div className="mt-6">
              {activeTab === "form" && (
                <QuickForm onAnalyze={handleFormSubmit} />
              )}
              {activeTab === "upload" && (
                <ResumeUploader onUpload={handleFileUpload} />
              )}
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
              <ResultDashboard data={result} onNewAnalysis={handleNewAnalysis} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}