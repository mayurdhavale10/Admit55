// src/app/mba/tools/resumewriter/components/resume-templates/index.tsx
"use client";

import React, { type ReactElement } from "react";
import type { ResumeData } from "../../utils/resumeTypes";

// ✅ keep YOUR existing path (this is what you actually have)
import ConsultingClassicTemplate from "./ConsultingClassicTemplate";

// ✅ use preview (so your TechClassicTemplate renders via TechClassicPreview sample/draft)
import TechClassicPreview from "./tech-classic/TechClassicPreview";

export type ResumeTemplateId =
  | "consulting_classic"
  | "product_modern"
  | "finance_tight"
  | "general_mba"
  | "tech_classic";

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
   Adapters (ResumeData -> Template Props)
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

// ✅ IMPORTANT: Tech should render the PREVIEW (it already contains sample + scaling)
const TemplateTechClassicAdapter: ResumeTemplateComponent = ({ data }) => {
  return <TechClassicPreview data={data as any} />;
};

export const TEMPLATE_REGISTRY: Record<ResumeTemplateId, ResumeTemplateComponent> =
  {
    consulting_classic: TemplateConsultingClassicAdapter,
    tech_classic: TemplateTechClassicAdapter,

    product_modern: TemplateProductModern,
    finance_tight: TemplateFinanceTight,
    general_mba: TemplateGeneralMBA,
  };
