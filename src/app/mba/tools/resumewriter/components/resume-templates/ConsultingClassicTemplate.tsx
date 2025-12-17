// src/app/mba/tools/resumewriter/components/resume-templates/consulting-classic/ConsultingClassicTemplate.tsx
"use client";

import React from "react";

import NameGenderUniversity from "./consulting-classic/parts/1Name_gender_University";
import Achivements from "./consulting-classic/parts/2Achivements";

import EducationTable, {
  type ConsultingEducationRow,
} from "./consulting-classic/parts/3EducationTable";

import Work_experience, {
  type WorkBlock,
} from "./consulting-classic/parts/4Work_experience";

import Extracurricular, {
  type ScholasticBlock,
} from "./consulting-classic/parts/5Scholastic_or_Academic_Achievements";

import Article_or_intern, {
  type ArticleBlock,
} from "./consulting-classic/parts/6Article_or_intern";

import LeadershipAndExtracurricular, {
  type LeadershipBlock,
} from "./consulting-classic/parts/7leadershipandextracurricular";

export type ConsultingClassicTemplateProps = {
  name?: string;
  gender?: string;
  university?: string;

  headerHighlights?: string[];
  educationRows?: ConsultingEducationRow[];
  experienceItems?: WorkBlock[];

  // Step 4
  scholasticBlocks?: ScholasticBlock[];

  // Step 5
  articleSectionTitle?: string;
  articleHeaderRight?: string;
  articleBlocks?: ArticleBlock[];

  // Step 6
  leadershipTitle?: string;
  leadershipBlocks?: LeadershipBlock[];

  email?: string;
  address?: string;
  phone?: string;
  logo?: React.ReactNode;
};

const DEFAULT_HIGHLIGHTS = [
  "Cars24 Arabia (UAE)",
  "Alvarez & Marsal (India)",
  "IIM Ahmedabad",
  "Chartered Accountant",
  "Grant Thornton Bharat LLP",
];

// Keep these defaults in sync with your Step5 defaults
const DEFAULT_ARTICLE_TITLE = "ARTICLESHIP EXPERIENCE";
const DEFAULT_ARTICLE_RIGHT = "36 months";

const DEFAULT_LEADERSHIP_TITLE =
  "POSITIONS OF RESPONSIBILITY & EXTRACURRICULAR ACTIVITIES";

const ConsultingClassicTemplate: React.FC<ConsultingClassicTemplateProps> = ({
  name = "Vaishali Gupta",
  gender = "Female",
  university = "",
  headerHighlights = DEFAULT_HIGHLIGHTS,

  educationRows,
  experienceItems,

  scholasticBlocks,

  // ✅ Defaults so it renders even if user doesn't fill step yet
  articleSectionTitle = DEFAULT_ARTICLE_TITLE,
  articleHeaderRight = DEFAULT_ARTICLE_RIGHT,
  articleBlocks,

  // ✅ Step 6
  leadershipTitle = DEFAULT_LEADERSHIP_TITLE,
  leadershipBlocks,

  email = "email@example.com",
  address = "Dubai (Relocating to Mumbai)",
  phone = "+91-1234567890",
  logo,
}) => {
  return (
    <div className="relative w-[794px] min-h-[1123px] bg-white text-slate-900">
      <div className="px-10 pt-10 pb-8 text-[10.5px] leading-tight">
        <header className="space-y-1">
          <NameGenderUniversity
            name={name}
            gender={gender}
            logo={logo}
            universityName={university}
          />
          <div className="-mt-[2px]">
            <Achivements items={headerHighlights} />
          </div>
        </header>

        <div className="-mt-[6px]">
          <EducationTable items={educationRows} />
          <Work_experience items={experienceItems} />

          {/* ✅ Step 4 */}
          <Extracurricular blocks={scholasticBlocks} />

          {/* ✅ Step 5 */}
          <Article_or_intern
            title={articleSectionTitle}
            headerRight={articleHeaderRight}
            items={articleBlocks}
          />

          {/* ✅ Step 6 */}
          <LeadershipAndExtracurricular
            title={leadershipTitle}
            blocks={leadershipBlocks}
          />
        </div>

        <footer className="mt-6 border-t border-slate-300 pt-2 text-[9px]">
          <div className="flex justify-between gap-4">
            <span className="truncate">
              E-mail: <span className="underline">{email}</span>
            </span>
            <span className="truncate">Address: {address}</span>
            <span className="truncate font-semibold text-[#1f4f82]">
              Contact: {phone}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ConsultingClassicTemplate;
