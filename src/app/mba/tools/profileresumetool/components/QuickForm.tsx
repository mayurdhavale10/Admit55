"use client";

import { useState } from "react";

interface QuickFormProps {
  onAnalyze: (data: any) => Promise<void> | void;
}

export default function QuickForm({ onAnalyze }: QuickFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    workExperience: "",
    industryRole: "",
    education: "",
    achievements: "",
    leadership: "",
    extracurriculars: "",
    gmatScore: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      formData.workExperience.trim() &&
      formData.industryRole.trim() &&
      formData.education.trim() &&
      formData.achievements.trim()
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    setLoading(true);
    try {
      await onAnalyze(formData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="space-y-6">
        {/* Work Experience & Industry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Experience (years) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.workExperience}
              onChange={(e) => handleChange("workExperience", e.target.value)}
              placeholder="e.g., 5 years"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry & Current Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.industryRole}
              onChange={(e) => handleChange("industryRole", e.target.value)}
              placeholder="e.g., Tech - Product Manager"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Education Background */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Education Background <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.education}
            onChange={(e) => handleChange("education", e.target.value)}
            placeholder="e.g., B.Tech Computer Science, IIT Delhi"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Key Achievements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Key Achievements (3 bullet points) <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.achievements}
            onChange={(e) => handleChange("achievements", e.target.value)}
            rows={5}
            placeholder="• Led a team of 10 to launch product feature&#10;• Increased revenue by 30%&#10;• Managed $2M budget"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Leadership Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Leadership Experience <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.leadership}
            onChange={(e) => handleChange("leadership", e.target.value)}
            rows={4}
            placeholder="Describe your leadership roles (team size, cross-functional work, mentoring, etc.)"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Extracurriculars */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Extracurriculars & Volunteering
          </label>
          <input
            type="text"
            value={formData.extracurriculars}
            onChange={(e) => handleChange("extracurriculars", e.target.value)}
            placeholder="e.g., NGO volunteer, Sports captain, Music"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* GMAT/GRE Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GMAT/GRE Score (or target)
          </label>
          <input
            type="text"
            value={formData.gmatScore}
            onChange={(e) => handleChange("gmatScore", e.target.value)}
            placeholder="e.g., GMAT 720 or Target: 700+"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!isFormValid() || loading}
          className={`w-full py-3.5 rounded-lg font-semibold text-white transition-colors ${
            !isFormValid() || loading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Analyzing..." : "Analyze My Profile"}
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
        <span>🔒</span>
        <span>Your data is secure and confidential. We never share your information.</span>
      </div>
    </div>
  );
}