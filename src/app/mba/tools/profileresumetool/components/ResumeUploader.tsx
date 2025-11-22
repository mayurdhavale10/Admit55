"use client";

import { useState } from "react";

interface ResumeUploaderProps {
  onUpload: (file: File) => Promise<void> | void;
}

export default function ResumeUploader({ onUpload }: ResumeUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setError(null);

    // Client-side validation
    const MAX = 5 * 1024 * 1024; // 5MB
    const allowed = [".pdf", ".docx"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (!allowed.includes(ext)) {
      setError("Only PDF and DOCX files are allowed");
      return;
    }

    if (file.size > MAX) {
      setError("File too large (max 5MB)");
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);

    // Call parent handler
    try {
      setUploading(true);
      await onUpload(file);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-blue-600"
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
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Upload Your Resume
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Supports PDF and DOCX files (max 5MB)
        </p>

        {/* File Input */}
        <label className="cursor-pointer inline-block">
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <div
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              uploading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {uploading ? (
              <>
                <svg
                  className="animate-spin w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span>Choose File</span>
              </>
            )}
          </div>
        </label>

        {/* File Info */}
        {fileName && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg
                  className="w-8 h-8 text-blue-600"
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
                <div className="text-left">
                  <p className="font-medium text-gray-900">{fileName}</p>
                  <p className="text-sm text-gray-600">
                    {((fileSize || 0) / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              {uploading && (
                <div className="flex items-center gap-2 text-blue-600">
                  <svg
                    className="animate-spin w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-sm font-medium">Processing...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>🔒</span>
          <span>Your resume is secure and confidential. We never share your information.</span>
        </div>

        {/* Supported Formats */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>PDF supported</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>DOCX supported</span>
          </div>
        </div>
      </div>
    </div>
  );
}