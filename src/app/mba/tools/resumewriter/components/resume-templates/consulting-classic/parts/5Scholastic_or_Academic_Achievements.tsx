"use client";

import React from "react";

export type ScholasticItem = {
  text: string;
  year: string;
  highlights?: string[];
};

export type ScholasticBlock = {
  leftLabel: string; // supports \n
  items: ScholasticItem[];
};

type Props = {
  blocks?: ScholasticBlock[];
  title?: string;
};

const DEFAULT_BLOCKS: ScholasticBlock[] = [
  {
    leftLabel: "Case\nCompetitions",
    items: [
      {
        text: "National Winners: 1st out of 200+ teams at a market expansion strategy competition by 180DC NITK",
        year: "2022",
        highlights: ["National Winners:"],
      },
      {
        text: "Semi-Finalist (1/12 out of 35 teams) in Multiple Mania (Avendus), stock pitch competition at IIMA",
        year: "2021",
        highlights: ["Semi-Finalist"],
      },
    ],
  },
  {
    leftLabel: "Certifications",
    items: [
      {
        text: "Completed Financial Markets course (93.77%) from Yale University by Prof Robert J. Shiller",
        year: "2023",
        highlights: [
          "Financial Markets",
          "93.77%",
          "Yale University",
          "Prof Robert J. Shiller",
        ],
      },
      {
        text: "Completed Corporate Strategy course (88.91%) by UCL school of Mgmt. & University of London",
        year: "2022",
        highlights: ["Corporate Strategy", "88.91%", "UCL", "University of London"],
      },
      {
        text: "Completed Private Equity & Venture Capital course (84%) by University of Bocconi on Coursera",
        year: "2021",
        highlights: [
          "Private Equity & Venture Capital",
          "84%",
          "University of Bocconi",
          "Coursera",
        ],
      },
      {
        text: "Successfully completed Green Belt Certification in Lean Six Sigma conducted by KPMG India",
        year: "2021",
        highlights: ["Green Belt", "Lean Six Sigma", "KPMG India"],
      },
    ],
  },
];

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function BoldHighlights({
  text,
  highlights = [],
}: {
  text: string;
  highlights?: string[];
}) {
  if (!highlights.length) return <>{text}</>;

  const hs = [...highlights].filter(Boolean).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${hs.map(escapeRegExp).join("|")})`, "g");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((p, i) =>
        hs.includes(p) ? (
          <strong key={i} className="font-semibold">
            {p}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

const Extracurricular: React.FC<Props> = ({
  blocks,
  title = "SCHOLASTIC ACHIEVEMENTS",
}) => {
  const data = (blocks && blocks.length ? blocks : DEFAULT_BLOCKS).filter(Boolean);
  if (!data.length) return null;

  return (
    <section className="mt-0 w-full max-w-full font-serif">
      {/* Title bar */}
      <div className="w-full bg-black px-3 py-[6px]">
        <div className="text-[13px] font-semibold leading-none tracking-wide text-white">
          {title}
        </div>
      </div>

      {/* Outer table border */}
      <div className="w-full max-w-full overflow-hidden border border-black border-t-0">
        {data.map((block, bIdx) => {
          const items = (block.items || []).filter(
            (it) => String(it?.text || "").trim() && String(it?.year || "").trim()
          );
          if (!items.length) return null;

          return (
            <div
              key={`${block.leftLabel}-${bIdx}`}
              className={bIdx !== 0 ? "border-t border-black" : ""}
            >
              {/* 3 columns: left label | bullets | years */}
              <div className="grid w-full max-w-full min-w-0 grid-cols-[160px_minmax(0,1fr)_70px]">
                {/* Left grey label */}
                <div className="whitespace-pre-line bg-[#d9d9d9] border-r border-black px-3 py-2 text-center text-[12px] font-semibold leading-tight">
                  {block.leftLabel}
                </div>

                {/* Middle bullets with ✅ bold bullet "•" */}
                <div className="min-w-0 overflow-hidden border-r border-black px-3 py-2 text-[11.5px] leading-[1.25]">
                  <div className="space-y-1">
                    {items.map((it, i) => (
                      <div key={i} className="flex min-w-0 gap-2">
                        <span className="font-semibold leading-[1.25]">•</span>
                        <div
                          className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis"
                          title={it.text}
                        >
                          <BoldHighlights text={it.text} highlights={it.highlights} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right years aligned to bullets */}
                <div className="overflow-hidden px-2 py-2 text-center text-[11.5px] leading-[1.25]">
                  <div className="space-y-1">
                    {items.map((it, i) => (
                      <div
                        key={i}
                        className="whitespace-nowrap overflow-hidden text-ellipsis"
                        title={it.year}
                      >
                        {it.year}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Extracurricular;
