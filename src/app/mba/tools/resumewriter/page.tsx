"use client";

import React, { useState } from "react";
import BuilderLayout from "./components/BuilderLayout";
import Stepper from "./components/Stepper";
import StepBasicInfo from "./components/StepBasicInfo";
import StepEducation from "./components/StepEducation";
import StepExperience from "./components/StepExperience";
import StepSkills from "./components/StepSkills";
import StepProjects from "./components/StepProjects";
import StepLeadership from "./components/StepLeadership";
import StepPreferences from "./components/StepPreferences";
import StepReviewSubmit from "./components/StepReviewSubmit";
import ResumePreview from "./components/ResumePreview";
import DownloadButtons from "./components/DownloadButtons";
import {
  generateResume,
  ResumeWriterResponse,
  ResumeWriterAnswers,
} from "./utils/api";

// Define all form data types
type BasicInfoValues = {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  current_role?: string;
  target_role?: string;
  years_experience?: string;
  work_authorization?: string;
};

type EducationItem = {
  level?: string;
  degree?: string;
  institution?: string;
  location?: string;
  start_year?: string;
  end_year?: string;
  gpa?: string;
  honors?: string;
  key_courses?: string;
};

type ExperienceItem = {
  company?: string;
  role?: string;
  location?: string;
  start_month?: string;
  start_year?: string;
  end_month?: string;
  end_year?: string;
  is_current?: boolean;
  bullets?: string;
  impact_summary?: string;
};

type SkillsValues = {
  technical_skills?: string;
  soft_skills?: string;
  languages?: string;
  certifications?: string;
  tools_software?: string;
};

type ProjectItem = {
  title?: string;
  organization?: string;
  location?: string;
  start_month?: string;
  start_year?: string;
  end_month?: string;
  end_year?: string;
  is_current?: boolean;
  context?: string;
  bullets?: string;
  outcome?: string;
};

type LeadershipItem = {
  title?: string;
  organization?: string;
  location?: string;
  start_month?: string;
  start_year?: string;
  end_month?: string;
  end_year?: string;
  is_current?: boolean;
  description?: string;
  impact?: string;
};

type PreferencesValues = {
  tone_preference?: "conservative" | "balanced" | "aggressive";
  length_preference?: "one_page" | "two_page" | "auto";
  highlight_skills?: boolean;
  emphasize_leadership?: boolean;
  include_summary?: boolean;
  additional_notes?: string;
};

type FormData = {
  basic_info: BasicInfoValues;
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: SkillsValues;
  projects: ProjectItem[];
  leadership: LeadershipItem[];
  preferences: PreferencesValues;
};

const STEPS = [
  { id: "basic", label: "Basic Info", description: "Name & contact" },
  { id: "education", label: "Education", description: "Degrees & schools" },
  { id: "experience", label: "Experience", description: "Work history" },
  { id: "skills", label: "Skills", description: "Technical & soft" },
  { id: "projects", label: "Projects", description: "Key projects" },
  { id: "leadership", label: "Leadership", description: "Activities" },
  { id: "preferences", label: "Preferences", description: "Formatting" },
  { id: "review", label: "Review", description: "Final check" },
];

export default function ResumeWriterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    basic_info: {
      full_name: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      current_role: "",
      target_role: "",
      years_experience: "",
      work_authorization: "",
    },
    education: [
      {
        level: "",
        degree: "",
        institution: "",
        location: "",
        start_year: "",
        end_year: "",
        gpa: "",
        honors: "",
        key_courses: "",
      },
    ],
    experience: [
      {
        company: "",
        role: "",
        location: "",
        start_month: "",
        start_year: "",
        end_month: "",
        end_year: "",
        is_current: false,
        bullets: "",
        impact_summary: "",
      },
    ],
    skills: {
      technical_skills: "",
      soft_skills: "",
      languages: "",
      certifications: "",
      tools_software: "",
    },
    projects: [],
    leadership: [],
    preferences: {
      tone_preference: "balanced",
      length_preference: "auto",
      highlight_skills: false,
      emphasize_leadership: false,
      include_summary: true,
      additional_notes: "",
    },
  });

  const [generatedResume, setGeneratedResume] =
    useState<ResumeWriterResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data for specific step
  const updateFormData = (step: keyof FormData, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [step]: data,
    }));
  };

  // Navigate to next step
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Navigate to previous step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Jump to specific step
  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  // Validate basic info before allowing next
  const isBasicInfoValid = () => {
    const { full_name, email } = formData.basic_info;
    return full_name.trim().length > 0 && email.trim().length > 0;
  };

  // Validate education before allowing next
  const isEducationValid = () => {
    return formData.education.some(
      (edu) => edu.degree && edu.institution
    );
  };

  // Validate experience before allowing next
  const isExperienceValid = () => {
    return formData.experience.some(
      (exp) => exp.role && exp.company
    );
  };

  // Generate resume
  const handleGenerateResume = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // 🔥 Transform form data into ResumeWriterAnswers structure
      const apiPayload: ResumeWriterAnswers = {
        basic_info: {
          full_name: formData.basic_info.full_name,
          email: formData.basic_info.email,
          phone: formData.basic_info.phone || undefined,
          location: formData.basic_info.location || undefined,
          linkedin_url: formData.basic_info.linkedin || undefined,
          target_role: formData.basic_info.target_role || undefined,
          target_geography: formData.basic_info.location || undefined,
          summary_preference: "medium",
        },
        education: formData.education.map((edu) => ({
          institution: edu.institution || "",
          degree: edu.degree || "",
          field_of_study: edu.level || undefined,
          location: edu.location || undefined,
          start_year: edu.start_year || undefined,
          end_year: edu.end_year || undefined,
          is_current: !edu.end_year,
          gpa: edu.gpa || undefined,
          highlights: [edu.honors, edu.key_courses]
            .filter(Boolean)
            .join(" • ") || undefined,
        })),
        experience: formData.experience.map((exp) => ({
          organization: exp.company || "",
          title: exp.role || "",
          location: exp.location || undefined,
          start_month: exp.start_month || undefined,
          start_year: exp.start_year || undefined,
          end_month: exp.is_current ? undefined : exp.end_month || undefined,
          end_year: exp.is_current ? undefined : exp.end_year || undefined,
          is_current: exp.is_current,
          scope: exp.impact_summary || undefined,
          bullets: exp.bullets || "",
        })),
        projects: formData.projects.map((proj) => ({
          title: proj.title || "",
          organization: proj.organization || undefined,
          location: proj.location || undefined,
          start_month: proj.start_month || undefined,
          start_year: proj.start_year || undefined,
          end_month: proj.is_current ? undefined : proj.end_month || undefined,
          end_year: proj.is_current ? undefined : proj.end_year || undefined,
          is_current: proj.is_current,
          context: proj.context || undefined,
          bullets: proj.bullets || undefined,
          outcome: proj.outcome || undefined,
        })),
        leadership_and_ec: {
          positions: formData.leadership
            .map((lead) =>
              [lead.title, lead.organization].filter(Boolean).join(" – ")
            )
            .filter(Boolean)
            .join("\n"),
          initiatives: formData.leadership
            .map((lead) => lead.description)
            .filter(Boolean)
            .join("\n"),
          volunteering: "",
          awards: formData.education
            .map((edu) => edu.honors)
            .filter(Boolean)
            .join("\n"),
        },
        skills_and_preferences: {
          technical_skills: formData.skills.technical_skills || "",
          domain_expertise: formData.skills.soft_skills || "",
          languages: formData.skills.languages || "",
          certifications: formData.skills.certifications || "",
          resume_style: "general_mba",
          tone: formData.preferences.tone_preference || "balanced",
        },
        constraints: {
          page_limit:
            formData.preferences.length_preference === "one_page"
              ? "one_page"
              : formData.preferences.length_preference === "two_page"
              ? "two_page"
              : undefined,
          include_photo: false,
          include_gpa: !!formData.education.find((e) => e.gpa),
        },
      };

      const response = await generateResume(apiPayload);
      setGeneratedResume(response);
    } catch (err) {
      console.error("Error generating resume:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate resume"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Convert generated resume to preview format
  const getPreviewData = () => {
    if (!generatedResume) return null;

    return {
      generated_resume: {
        header: {
          full_name: formData.basic_info.full_name,
          title: formData.basic_info.current_role,
          email: formData.basic_info.email,
          phone: formData.basic_info.phone,
          location: formData.basic_info.location,
          linkedin: formData.basic_info.linkedin,
        },
        summary: "Professional summary will appear here...",
        sections: [
          {
            title: "Experience",
            entries: formData.experience.map((exp) => ({
              title: exp.role,
              subtitle: exp.company,
              location: exp.location,
              start_date:
                exp.start_month && exp.start_year
                  ? `${exp.start_month} ${exp.start_year}`
                  : undefined,
              end_date: exp.is_current
                ? "Present"
                : exp.end_month && exp.end_year
                ? `${exp.end_month} ${exp.end_year}`
                : undefined,
              bullets: exp.bullets?.split("\n").filter(Boolean) || [],
            })),
          },
          {
            title: "Education",
            entries: formData.education.map((edu) => ({
              title: edu.degree,
              subtitle: edu.institution,
              location: edu.location,
              start_date: edu.start_year,
              end_date: edu.end_year,
              bullets: edu.honors ? [edu.honors] : [],
            })),
          },
        ],
      },
      raw_markdown: generatedResume.resume_text,
    };
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepBasicInfo
            value={formData.basic_info}
            onChange={(updates) =>
              updateFormData("basic_info", {
                ...formData.basic_info,
                ...updates,
              })
            }
            onNext={handleNext}
            disableNext={!isBasicInfoValid()}
          />
        );
      case 1:
        return (
          <StepEducation
            value={formData.education}
            onChange={(value) => updateFormData("education", value)}
            onNext={handleNext}
            onBack={handleBack}
            disableNext={!isEducationValid()}
          />
        );
      case 2:
        return (
          <StepExperience
            value={formData.experience}
            onChange={(value) => updateFormData("experience", value)}
            onNext={handleNext}
            onBack={handleBack}
            disableNext={!isExperienceValid()}
          />
        );
      case 3:
        return (
          <StepSkills
            value={formData.skills}
            onChange={(updates) =>
              updateFormData("skills", { ...formData.skills, ...updates })
            }
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <StepProjects
            value={formData.projects}
            onChange={(value) => updateFormData("projects", value)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <StepLeadership
            value={formData.leadership}
            onChange={(value) => updateFormData("leadership", value)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 6:
        return (
          <StepPreferences
            value={formData.preferences}
            onChange={(updates) =>
              updateFormData("preferences", {
                ...formData.preferences,
                ...updates,
              })
            }
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 7:
        return (
          <StepReviewSubmit
            formData={formData}
            onBack={handleBack}
            onSubmit={handleGenerateResume}
            isSubmitting={isGenerating}
            onEditStep={handleStepClick}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                MBA Resume Writer
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Create a professional, ATS-friendly resume tailored for MBA
                recruiting
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stepper */}
        <Stepper
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={handleStepClick}
          allowClickNavigation={true}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-red-900">Error</h4>
                <p className="mt-1 text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <BuilderLayout
          left={<div className="max-w-3xl">{renderStep()}</div>}
          right={
            <div>
              <ResumePreview
                data={getPreviewData()}
                loading={isGenerating}
              />
              {generatedResume && (
                <div className="mt-6">
                  <DownloadButtons
                    resumeData={getPreviewData()}
                    candidateName={formData.basic_info.full_name}
                  />
                </div>
              )}
            </div>
          }
        />
      </main>
    </div>
  );
}
