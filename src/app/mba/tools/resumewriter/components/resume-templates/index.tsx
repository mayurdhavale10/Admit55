// src/app/mba/tools/resumewriter/components/resume-templates/index.tsx

import React, { type ReactElement } from "react";
import TemplateConsultingClassic from "./TemplateConsultingClassic";
import type { ResumeData } from "../../utils/resumeTypes";

export type ResumeTemplateId =
  | "consulting_classic"
  | "product_modern"
  | "finance_tight"
  | "general_mba";

export type ResumeTemplateProps = {
  data: ResumeData;
};

export type ResumeTemplateComponent = (
  props: ResumeTemplateProps
) => ReactElement;

// Reusable placeholder for templates we haven't designed yet
type PlaceholderProps = ResumeTemplateProps & {
  label: string;
};

const PlaceholderTemplate: React.FC<PlaceholderProps> = ({ label }) => (
  <div className="w-full aspect-[210/297] rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 flex items-center justify-center">
    <div className="px-6 text-center">
      <p className="text-sm font-semibold">{label} template – coming soon</p>
      <p className="mt-2 text-xs">
        For now, your data will still be rendered using the Consulting Classic
        layout in the preview.
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

export const TEMPLATE_REGISTRY: Record<
  ResumeTemplateId,
  ResumeTemplateComponent
> = {
  consulting_classic: TemplateConsultingClassic as ResumeTemplateComponent,
  product_modern: TemplateProductModern,
  finance_tight: TemplateFinanceTight,
  general_mba: TemplateGeneralMBA,
};
