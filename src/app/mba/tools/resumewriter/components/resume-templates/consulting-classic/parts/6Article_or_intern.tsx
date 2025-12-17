"use client";

import React from "react";

type Bullet = {
  text: string;
  highlights?: string[];
};

export type ArticleBlock = {
  companyLine: string;
  duration: string;
  dateRange: string;
  rows?: Array<{
    leftLabel: string;
    bullets: Bullet[];
  }>;
};

type Props = {
  title?: string;
  headerRight?: string;
  items?: ArticleBlock[];
};

const DEFAULT_ITEMS: ArticleBlock[] = [
  {
    companyLine:
      "Dhanda Rajendra & Co. (Loan staff Trainee at Grant Thornton Bharat LLP)",
    duration: "20 months",
    dateRange: "Nov’13 - Jul’15",
    rows: [
      {
        leftLabel: "Statutory Audit",
        bullets: [
          {
            text: "Led 2-4 members team | Limited Review, Year-end Stat & Tax Audit for listed and unlisted clients",
            highlights: [
              "Led 2-4 members team",
              "Limited Review",
              "Year-end Stat & Tax Audit",
            ],
          },
          {
            text: "Exposure of 5+ diverse sectors; Key sectors: Construction, Food & Beverages, Jewellery, Apparel",
            highlights: [
              "5+ diverse sectors",
              "Construction",
              "Food & Beverages",
              "Jewellery",
              "Apparel",
            ],
          },
        ],
      },
    ],
  },
  {
    companyLine: "Dhanda Rajendra & Co. - Trainee, Tax and Audit",
    duration: "16 months",
    dateRange: "Jul’15 - Oct’16",
    rows: [],
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

  const hs = [...highlights].sort((a, b) => b.length - a.length);
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

const Article_or_intern: React.FC<Props> = ({
  title = "ARTICLESHIP EXPERIENCE",
  headerRight = "36 months",
  items,
}) => {
  const blocks = (items?.length ? items : DEFAULT_ITEMS).filter(Boolean);
  if (!blocks.length) return null;

  return (
    <section className="mt-0 font-serif">
      {/* Black header */}
      <div className="w-full bg-black px-3 py-[6px]">
        <div className="flex justify-between">
          <div className="text-white text-[13px] font-semibold tracking-wide">
            {title}
          </div>
          <div className="text-white text-[13px] font-semibold tracking-wide">
            {headerRight}
          </div>
        </div>
      </div>

      {/* Outer border */}
      <div className="w-full border border-black border-t-0">
        {blocks.map((block, bIdx) => {
          const rows = (block.rows || []).filter(
            (r) => r.leftLabel && r.bullets?.length
          );

          return (
            <div
              key={bIdx}
              className={bIdx !== 0 ? "border-t border-black" : ""}
            >
              {/* ✅ Company header row (GREY) */}
              <div className="grid grid-cols-[160px_minmax(0,1fr)_100px_140px] border-b border-black">
                <div className="bg-[#d9d9d9] px-3 py-[4px] text-[12px] font-semibold border-r border-black">
                  Company
                </div>

                <div className="bg-[#d9d9d9] px-3 py-[4px] text-[12px] font-semibold min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border-r border-black">
                  {block.companyLine}
                </div>

                <div className="bg-[#d9d9d9] px-2 py-[4px] text-[12px] text-center font-semibold border-r border-black">
                  {block.duration}
                </div>

                <div className="bg-[#d9d9d9] px-2 py-[4px] text-[12px] text-center font-semibold">
                  {block.dateRange}
                </div>
              </div>

              {/* ✅ Detail rows */}
              {rows.map((row, rIdx) => (
                <div
                  key={rIdx}
                  className={`grid grid-cols-[160px_minmax(0,1fr)] ${
                    rIdx !== rows.length - 1 ? "border-b border-black" : ""
                  }`}
                >
                  {/* ✅ LEFT LABEL — WHITE (NOT GREY) */}
                  <div className="border-r border-black px-3 py-2 text-[12px] font-semibold text-center whitespace-pre-line">
                    {row.leftLabel}
                  </div>

                  {/* Bullets */}
                  <div className="px-3 py-2 min-w-0 overflow-hidden">
                    <ul className="list-disc pl-4 space-y-[2px] text-[11px] leading-[1.22] marker:font-extrabold">
                      {row.bullets.map((bul, i) => (
                        <li
                          key={i}
                          className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis"
                          title={bul.text}
                        >
                          <BoldHighlights
                            text={bul.text}
                            highlights={bul.highlights}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Article_or_intern;
export type { Bullet };
