// components/ResumePreview.tsx

import React from "react";
import { ResumeData } from "../utils/resumeTypes";
import {
  TEMPLATE_REGISTRY,
  ResumeTemplateId,
} from "./resume-templates";

type Props = {
  data: ResumeData;
  templateId: ResumeTemplateId | null;
};

export default function ResumePreview({ data, templateId }: Props) {
  const effectiveTemplate: ResumeTemplateId =
    templateId && templateId in TEMPLATE_REGISTRY
      ? templateId
      : "consulting_classic";

  const TemplateComponent = TEMPLATE_REGISTRY[effectiveTemplate];

  return (
    <div className="w-full">
      {/* outer preview wrapper – can add zoom controls later */}
      <div className="mx-auto max-w-[900px]">
        <TemplateComponent data={data} />
      </div>
    </div>
  );
}
