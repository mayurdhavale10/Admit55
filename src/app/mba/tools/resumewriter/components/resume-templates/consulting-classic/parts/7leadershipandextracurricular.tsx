"use client";

import React from "react";

/* -------------------- Types -------------------- */

type Bullet = {
  text: string;
  highlights?: string[];
};

type LeadershipRow = {
  /** For IIMA Clubs rows only (e.g., "GMLC\n(Career Club)") */
  role?: string;
  bullets: Bullet[];
  year?: string;
};

export type LeadershipBlock = {
  /**
   * If true → category is shown vertically on the far-left and spans all rows
   * (used for: "IIMA Clubs")
   */
  verticalCategory?: boolean;

  /** Category label (e.g., "IIMA Clubs", "School (POR)", "Social Service") */
  category: string;

  rows: LeadershipRow[];
};

type Props = {
  title?: string;
  blocks?: LeadershipBlock[];
};

/* -------------------- Default Data -------------------- */

const DEFAULT_BLOCKS: LeadershipBlock[] = [
  {
    category: "IIMA Clubs",
    verticalCategory: true,
    rows: [
      {
        role: "GMLC\n(Career Club)",
        year: "2022",
        bullets: [
          {
            text: "Conducted Mock GDs & PI for 130+ students; organized CV reviews for 50+ first year students",
            highlights: ["Mock GDs & PI", "130+", "50+"],
          },
          {
            text: "Guided 1st year students to create KYC (35+ Cos) & News Repo. for placement (Reach: 350+ students)",
            highlights: ["KYC", "35+ Cos", "350+"],
          },
        ],
      },
      {
        role: "Prayaas\n(A Social\nInitiative)",
        year: "2022",
        bullets: [
          {
            text: "Finance Control cell head: Funds Managed ~$9.6k; Mentored 3 underprivileged CA students",
            highlights: ["Finance Control cell head", "~$9.6k", "Mentored 3", "underprivileged"],
          },
          {
            text: "POC (Finance) for ADAI: Prayaas's Flagship event; Funds Managed: ~$3.6k, Footfall: ~225",
            highlights: ["POC (Finance)", "ADAI", "Flagship", "~$3.6k", "Footfall", "~225"],
          },
          {
            text: "Handled school fees sponsorship of 30+ students (~$3.6k); Buttermilk Initiative fund ~$1.8k",
            highlights: ["Handled", "sponsorship", "30+ students", "~$3.6k", "~$1.8k"],
          },
        ],
      },
    ],
  },
  {
    category: "School (POR)",
    rows: [
      {
        year: "2010",
        bullets: [
          {
            text: "Prefect in Student Council, Led 300+ students | Vice-Captain of Indoor Cricket House Team",
            highlights: ["Prefect", "Led 300+", "Vice-Captain", "Indoor Cricket House Team"],
          },
        ],
      },
    ],
  },
  {
    category: "Social Service",
    rows: [
      {
        year: "2020–Present",
        bullets: [
          {
            text: "Sponsored a Girl Child Education (World Vision India) since 2020 | Assisted kids of Bal Sahyog, Orphanage",
            highlights: ["Girl Child Education", "World Vision India", "Assisted", "Bal Sahyog"],
          },
        ],
      },
    ],
  },
];

/* -------------------- Helpers -------------------- */

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function BoldHighlights({ text, highlights = [] }: { text: string; highlights?: string[] }) {
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

/* -------------------- Component -------------------- */

const LeadershipAndExtracurricular: React.FC<Props> = ({
  title = "POSITIONS OF RESPONSIBILITY & EXTRACURRICULAR ACTIVITIES",
  blocks,
}) => {
  const data = (blocks?.length ? blocks : DEFAULT_BLOCKS).filter(Boolean);
  if (!data.length) return null;

  return (
    <section className="mt-0 font-serif w-full max-w-full">
      {/* Header */}
      <div className="w-full bg-black px-3 py-[6px]">
        <div className="text-white text-[13px] font-semibold tracking-wide leading-none">{title}</div>
      </div>

      {/* Outer table */}
      <div className="w-full max-w-full border border-black border-t-0 overflow-hidden">
        {data.map((block, bIdx) => {
          const rows = (block.rows || []).filter((r) => (r.bullets || []).length);
          if (!rows.length) return null;

          // ---------------- Vertical category block (IIMA Clubs) ----------------
          if (block.verticalCategory) {
            return (
              <div key={`${block.category}-${bIdx}`} className={bIdx !== 0 ? "border-t border-black" : ""}>
                <div
                  className="grid w-full max-w-full min-w-0"
                  style={{
                    gridTemplateColumns: "42px 118px minmax(0,1fr) 70px",
                  }}
                >
                  {/* Vertical category cell spanning all rows */}
                  <div
                    className="bg-[#efefef] border-r border-black flex items-center justify-center"
                    style={{ gridRow: `1 / span ${rows.length}` }}
                  >
                    <div
                      className="text-[11px] font-semibold tracking-wide rotate-[-90deg] whitespace-nowrap"
                      style={{ lineHeight: 1 }}
                    >
                      {block.category}
                    </div>
                  </div>

                  {/* Each row */}
                  {rows.map((row, rIdx) => (
                    <React.Fragment key={`${block.category}-r-${rIdx}`}>
                      {/* Role cell (LIGHT GREY) - now 118px to make total 160px */}
                      <div
                        className={`bg-[#efefef] border-r border-black px-3 py-2 text-[12px] font-semibold leading-tight whitespace-pre-line ${
                          rIdx !== 0 ? "border-t border-black" : ""
                        }`}
                      >
                        {row.role || ""}
                      </div>

                      {/* Bullets cell */}
                      <div className={`${rIdx !== 0 ? "border-t border-black" : ""} px-3 py-2 min-w-0 overflow-hidden`}>
                        <ul className="space-y-[2px]">
                          {row.bullets.map((bul, i) => (
                            <li key={i} className="flex gap-2 min-w-0">
                              <span className="font-extrabold leading-[1.15]">•</span>
                              <span className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-[11.5px] leading-[1.25]">
                                <BoldHighlights text={bul.text} highlights={bul.highlights} />
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Year cell */}
                      <div
                        className={`border-l border-black text-center text-[11.5px] font-semibold px-2 py-2 ${
                          rIdx !== 0 ? "border-t border-black" : ""
                        }`}
                      >
                        {row.year || ""}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          }

          // ---------------- Normal rows (School POR, Social Service) ----------------
          // NOW MATCHES: 160px left column to align with all other sections
          const row = rows[0];

          return (
            <div key={`${block.category}-${bIdx}`} className={bIdx !== 0 ? "border-t border-black" : ""}>
              <div className="grid w-full max-w-full min-w-0 grid-cols-[160px_minmax(0,1fr)_70px]">
                {/* Left label (LIGHT GREY) - now 160px */}
                <div className="bg-[#efefef] border-r border-black px-3 py-2 text-[12px] font-semibold leading-tight">
                  {block.category}
                </div>

                {/* Bullets */}
                <div className="px-3 py-2 min-w-0 overflow-hidden">
                  <ul className="space-y-[2px]">
                    {row.bullets.map((bul, i) => (
                      <li key={i} className="flex gap-2 min-w-0">
                        <span className="font-extrabold leading-[1.15]">•</span>
                        <span className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-[11.5px] leading-[1.25]">
                          <BoldHighlights text={bul.text} highlights={bul.highlights} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Year */}
                <div className="border-l border-black text-center text-[11.5px] font-semibold px-2 py-2">
                  {row.year || ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default LeadershipAndExtracurricular;