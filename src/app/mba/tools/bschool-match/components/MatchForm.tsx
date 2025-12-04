// src/app/mba/tools/bschool-match/components/MatchForm.tsx

"use client";

import { useState } from "react";
import { BschoolMatchMode, QuestionAnswerMap } from "@src/lib/bschoolmatch/types";

// ✅ Export the props interface
export interface MatchFormProps {
  mode: BschoolMatchMode;
  isSubmitting: boolean;
  onSubmit: (payload: { 
    answers: QuestionAnswerMap; 
    resumeFile: File | null 
  }) => Promise<void>;
}

export default function MatchForm({ 
  mode, 
  isSubmitting, 
  onSubmit 
}: MatchFormProps) {
  const [answers, setAnswers] = useState<QuestionAnswerMap>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ answers, resumeFile });
  };

  const handleAnswerChange = (questionId: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setResumeFile(file);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          {mode === "resume-upload" && "Upload Your Resume"}
          {mode === "questions-only" && "Answer Questions"}
          {mode === "resume-from-profile" && "Use Saved Resume"}
        </h2>

        {/* Resume Upload Section */}
        {(mode === "resume-upload" || mode === "resume-from-profile") && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Resume / CV
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              disabled={isSubmitting}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50"
            />
            {resumeFile && (
              <p className="mt-2 text-xs text-slate-600">
                Selected: {resumeFile.name}
              </p>
            )}
          </div>
        )}

        {/* Question Section */}
        <div className="space-y-4">
          {/* Test Score */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Test Score (GMAT/GRE/CAT)
            </label>
            <input
              type="text"
              placeholder="e.g., GMAT 710, CAT 98%ile"
              value={(answers.test_score as string) || ""}
              onChange={(e) => handleAnswerChange("test_score", e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                disabled:opacity-50"
            />
          </div>

          {/* Work Experience */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Work Experience (years)
            </label>
            <input
              type="number"
              placeholder="e.g., 3"
              min="0"
              max="20"
              value={(answers.total_experience as number) || ""}
              onChange={(e) => handleAnswerChange("total_experience", parseFloat(e.target.value) || 0)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                disabled:opacity-50"
            />
          </div>

          {/* Career Goals */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Post-MBA Goal
            </label>
            <textarea
              placeholder="e.g., Management Consulting in India"
              rows={3}
              value={(answers.post_mba_goal as string) || ""}
              onChange={(e) => handleAnswerChange("post_mba_goal", e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                disabled:opacity-50"
            />
          </div>

          {/* Geography Preference */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Preferred Regions
            </label>
            <select
              multiple
              value={(answers.preferred_regions as string[]) || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                handleAnswerChange("preferred_regions", selected);
              }}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                disabled:opacity-50"
              size={4}
            >
              <option value="india">India</option>
              <option value="asia">Asia (ex-India)</option>
              <option value="europe">Europe</option>
              <option value="us">United States</option>
              <option value="global">Global / No Preference</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Hold Ctrl/Cmd to select multiple
            </p>
          </div>

          {/* Risk Tolerance */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Risk Tolerance
            </label>
            <select
              value={(answers.risk_tolerance as string) || "balanced"}
              onChange={(e) => handleAnswerChange("risk_tolerance", e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                disabled:opacity-50"
            >
              <option value="safe">Safe (More Target/Safe Schools)</option>
              <option value="balanced">Balanced (Mix of All Tiers)</option>
              <option value="aggressive">Aggressive (More Dream Schools)</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" cy="12" r="10" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Finding Your Matches...
              </span>
            ) : (
              "Find My B-School Matches"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}