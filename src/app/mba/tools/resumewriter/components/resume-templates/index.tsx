// src/app/mba/tools/resumewriter/components/resume-templates/index.tsx
"use client";

import React, { type ReactElement } from "react";
import type { ResumeData } from "../../utils/resumeTypes";

// existing
import ConsultingClassicTemplate from "./ConsultingClassicTemplate";
import TechClassicPreview from "./tech-classic/TechClassicPreview";
import Classic1Preview from "./consulting-1/Classic1Preview";

// ✅ NEW: Tech VC1 preview
import TechVC1Preview from "./tech-vc1/TechVC1Preview";

export type ResumeTemplateId =
  | "consulting_classic"
  | "consulting_1"
  | "tech_classic"
  | "tech_vc1" // ✅ add
  | "product_modern"
  | "finance_tight"
  | "general_mba";

export type ResumeTemplateProps = {
  data: ResumeData;
};

export type ResumeTemplateComponent = (props: ResumeTemplateProps) => ReactElement;

/* -----------------------------------------
   Placeholders
------------------------------------------ */

type PlaceholderProps = ResumeTemplateProps & { label: string };

const PlaceholderTemplate: React.FC<PlaceholderProps> = ({ label }) => (
  <div className="w-full aspect-[210/297] rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 flex items-center justify-center">
    <div className="px-6 text-center">
      <p className="text-sm font-semibold">{label} template – coming soon</p>
      <p className="mt-2 text-xs">
        For now, your data may still be shown via another template in preview.
      </p>
    </div>
  </div>
);

const TemplateProductModern: ResumeTemplateComponent = (props) => (
  <PlaceholderTemplate {...props} label="Product Modern" />
);

const TemplateFinanceTight: ResumeTemplateComponent = (props) => (
  <PlaceholderTemplate {...props} label="Finance Tight" />
);

const TemplateGeneralMBA: ResumeTemplateComponent = (props) => (
  <PlaceholderTemplate {...props} label="General MBA" />
);

/* -----------------------------------------
   Adapters
------------------------------------------ */

const TemplateConsultingClassicAdapter: ResumeTemplateComponent = ({ data }) => {
  const first = (data as any)?.basicInfo?.firstName ?? "";
  const last = (data as any)?.basicInfo?.lastName ?? "";
  const name =
    `${first} ${last}`.trim() || (data as any)?.header?.name || "Your Name";

  const email =
    (data as any)?.basicInfo?.email || (data as any)?.header?.email || "";
  const phone =
    (data as any)?.basicInfo?.phone || (data as any)?.header?.phone || "";
  const address =
    (data as any)?.basicInfo?.location || (data as any)?.header?.location || "";

  return (
    <ConsultingClassicTemplate
      name={name}
      email={email}
      phone={phone}
      address={address}
    />
  );
};

const TemplateTechClassicAdapter: ResumeTemplateComponent = ({ data }) => {
  return <TechClassicPreview data={data as any} />;
};

const TemplateConsulting1Adapter: ResumeTemplateComponent = ({ data }) => {
  return <Classic1Preview data={data as any} />;
};

// ✅ NEW: Tech VC1 adapter
const TemplateTechVC1Adapter: ResumeTemplateComponent = ({ data }) => {
  return <TechVC1Preview data={data as any} />;
};

export const TEMPLATE_REGISTRY: Record<ResumeTemplateId, ResumeTemplateComponent> =
  {
    consulting_classic: TemplateConsultingClassicAdapter,
    consulting_1: TemplateConsulting1Adapter,
    tech_classic: TemplateTechClassicAdapter,

    // ✅ NEW
    tech_vc1: TemplateTechVC1Adapter,

    product_modern: TemplateProductModern,
    finance_tight: TemplateFinanceTight,
    general_mba: TemplateGeneralMBA,
  };
