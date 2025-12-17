"use client";

import React from "react";

type Bullet = {
  text: string;
  /** phrases inside `text` that should be bold (match by exact substring) */
  highlights?: string[];
};

export type WorkBlock = {
  companyLine: string;
  duration: string;
  dateRange: string;
  rows: Array<{
    leftLabel: string;
    bullets: Bullet[];
  }>;
};

type Props = {
  items?: WorkBlock[];
};

/** ✅ hard limit you asked for */
const BULLET_CHAR_LIMIT = 140;

/** ✅ simple truncate (single-line) */
function truncateToLimit(s: string, limit = BULLET_CHAR_LIMIT) {
  const str = (s ?? "").toString();
  if (str.length <= limit) return str;
  return str.slice(0, Math.max(0, limit - 1)).trimEnd() + "…";
}

const DEFAULT_ITEMS: WorkBlock[] = [
  {
    companyLine: "Cars24 Arabia- General Manager, Strategy & Business Finance",
    duration: "10 months",
    dateRange: "Aug’24 – Present",
    rows: [
      {
        leftLabel: "Business Finance",
        bullets: [
          {
            text: "Leading Business Finance: Monthly MIS, Budgeting & forecasting, financial modelling, Variance analysis, LRS",
            highlights: ["Leading Business Finance:"],
          },
        ],
      },
      {
        leftLabel: "Treasury",
        bullets: [
          {
            text: "Managed ~$20mn portfolio, overseeing cash & liquidity planning, covenant compliance, WC & fund flow projections",
            highlights: ["~$20mn portfolio", "covenant compliance", "WC"],
          },
          {
            text: "Managed banking relations & led new partner onboarding, enabling ~$5mn new debt line via collaboration",
            highlights: ["new partner onboarding", "~$5mn new debt line"],
          },
        ],
      },
      {
        leftLabel: "Strategy\n@CEO Office",
        bullets: [
          {
            text: "Collaborated closely with CEO to finalize FY26 Annual Operating Plan exit targets, leveraging financial modelling and scenario analysis; projected ~$2mn EBITDA uplift, driving a strong positive EBITDA shift",
            highlights: [
              "CEO",
              "FY26 Annual Operating Plan",
              "~$2mn EBITDA uplift",
              "positive EBITDA shift",
            ],
          },
          {
            text: "Evaluated new business vertical launches, assessing market potential, operational feasibility, & financial impact",
            highlights: ["new business vertical", "operational feasibility", "financial impact"],
          },
          {
            text: "Orchestrated monthly CEO reviews & board updates, aligning leadership on KPIs, risks, and strategic priorities",
            highlights: ["CEO reviews", "board updates", "KPIs"],
          },
        ],
      },
    ],
  },

  {
    companyLine:
      "Alvarez and Marsal (A&M)- Manager, Business Transformation Services (Post MBA)",
    duration: "13 months",
    dateRange: "Jul’23 – Jul’24",
    rows: [
      {
        leftLabel: "Project\n(Education\nIndustry)",
        bullets: [
          {
            text: "Developed 9-month liquidity crisis cash flow forecast for India’s leading Education service provider",
            highlights: ["9-month", "liquidity crisis", "India’s leading"],
          },
          {
            text: "Formulated 5-year business plan in collaboration with top management to project revenue, costs, and meet stakeholder requirements for the purpose of investor fundraising (Fund Raised ~$168mn)",
            highlights: [
              "5-year business plan",
              "top management",
              "investor fundraising",
              "Fund Raised ~$168mn",
            ],
          },
        ],
      },
      {
        leftLabel: "Card Clothing\nManufacturer",
        bullets: [
          {
            text: "Financial Transformation: Structured accounts, devised distinctive GL codes for organized financial records",
            highlights: ["Financial Transformation:", "GL codes"],
          },
          {
            text: "Formulated in-depth Standard operating procedure for seamless order-to-cash process in domestic, foreign sales",
            highlights: ["Standard operating procedure", "order-to-cash"],
          },
        ],
      },
      {
        leftLabel: "Project\n(Fintech)",
        bullets: [
          {
            text: "Streamlined key processes for India’s top fintech unicorn, partnered with CXOs and stakeholders to identify inefficiencies, driving strategic solutions and operational excellence",
            highlights: ["India’s top fintech unicorn", "CXOs", "stakeholders", "operational excellence"],
          },
          {
            text: "Individually ensured internal audit execution by liaising with internal auditor & management for compliance",
            highlights: ["internal audit", "liaising", "compliance"],
          },
        ],
      },
      {
        leftLabel: "Business\nDevelopment",
        bullets: [
          {
            text: "Conducted in-depth research & provided strategic perspective on India's top structural tube manufacturer, analysing market dynamics, peer performance, and company's financial health",
            highlights: ["strategic perspective", "India's top", "financial health"],
          },
          {
            text: "Created business proposals for EBITDA enhancement, revenue optimization, and cost reduction",
            highlights: ["EBITDA enhancement", "revenue optimization", "cost reduction"],
          },
        ],
      },
    ],
  },

  {
    companyLine:
      "Engineers India Limited (EIL)- F&A Officer, General Accounting (Pre MBA)",
    duration: "32 months",
    dateRange: "Sep’17 – May’20",
    rows: [
      {
        leftLabel: "Responsibilities",
        bullets: [
          {
            text: "Engaged for 100+ contracts (average val. ~$120k): conducted due diligence, vetting & bidder evaluation",
            highlights: ["100+ contracts", "~$120k", "due diligence"],
          },
          {
            text: "Individually handled Receivable management (AUM>$144mn) for more than 300 foreign & domestic jobs",
            highlights: ["Receivable management", "AUM>$144mn", "300"],
          },
          {
            text: "Independently managed two ONGC jobs valuing ~$60mn each (vendor payment, client invoicing & taxation)",
            highlights: ["ONGC", "~$60mn"],
          },
        ],
      },
      {
        leftLabel: "Automation &\nInitiatives",
        bullets: [
          {
            text: "Saved $30k by developing inhouse GST software with the IT team for system generated invoices",
            highlights: ["$30k", "GST software", "IT team"],
          },
          {
            text: "Achieved ~$144k increase in revenue realisation through Job Reconciliation and Client Negotiations",
            highlights: ["~$144k", "Job Reconciliation", "Client Negotiations"],
          },
        ],
      },
      {
        leftLabel: "Coordination",
        bullets: [
          {
            text: "Headed two members in team | Projected MIS & EIS to Top Management (Financials & O/S Debtors)",
            highlights: ["Top Management", "MIS & EIS", "O/S Debtors"],
          },
          {
            text: "Implementation of Electronic Cash Management System for 80+ clients in collaboration with Treasury dept",
            highlights: ["Electronic Cash Management System", "80+ clients", "Treasury"],
          },
        ],
      },
    ],
  },
];

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** ✅ bold highlights but ONLY within the truncated text */
function BoldHighlights({
  text,
  highlights = [],
}: {
  text: string;
  highlights?: string[];
}) {
  if (!highlights.length) return <>{text}</>;

  const hs = [...highlights].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!hs.length) return <>{text}</>;

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

const Work_experience: React.FC<Props> = ({ items }) => {
  const blocks = (items?.length ? items : DEFAULT_ITEMS).filter(Boolean);
  if (!blocks.length) return null;

  return (
    <section className="mt-0 font-serif">
      {/* Title bar */}
      <div className="w-full bg-black px-3 py-[6px]">
        <div className="text-white font-semibold tracking-wide text-[13px] leading-none">
          WORK EXPERIENCE
        </div>
      </div>

      {/* Outer border (no top border, sticks to black bar) */}
      <div className="w-full border border-black border-t-0">
        {blocks.map((block, bIdx) => (
          <div
            key={`${block.companyLine}-${bIdx}`}
            className={bIdx ? "border-t border-black" : ""}
          >
            {/* Company header row */}
            <div className="grid grid-cols-[1fr_110px_140px] border-b border-black">
              <div className="bg-[#d9d9d9] px-3 py-[4px] text-[12px] font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                {block.companyLine}
              </div>
              <div className="bg-[#d9d9d9] px-2 py-[4px] text-[12px] text-center font-semibold leading-tight border-l border-black whitespace-nowrap">
                {block.duration}
              </div>
              <div className="bg-[#d9d9d9] px-2 py-[4px] text-[12px] text-center font-semibold leading-tight border-l border-black whitespace-nowrap">
                {block.dateRange}
              </div>
            </div>

            {/* Detail rows */}
            {block.rows.map((row, rIdx) => (
              <div
                key={`${row.leftLabel}-${rIdx}`}
                className={`grid grid-cols-[160px_1fr] ${
                  rIdx !== block.rows.length - 1 ? "border-b border-black" : ""
                }`}
              >
                {/* Left label */}
                <div className="border-r border-black px-3 py-2 text-[12px] font-semibold leading-tight text-center whitespace-pre-line bg-[#efefef]">
                  {row.leftLabel}
                </div>

                {/* Bullets (✅ bigger font, tighter spacing; limit unchanged) */}
                <div className="px-3 py-[6px] text-[11px] leading-[1.05] overflow-hidden">
                  <ul className="space-y-0.5">
                    {row.bullets.map((bul, i) => {
                      const clipped = truncateToLimit(bul.text, BULLET_CHAR_LIMIT);

                      // only keep highlights that still exist after truncation
                      const safeHighlights = (bul.highlights ?? []).filter(
                        (h) => h && clipped.includes(h)
                      );

                      return (
                        <li key={i} className="flex items-start gap-1">
                          <span className="font-bold leading-[1.0]">•</span>

                          <span
                            className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis"
                            title={bul.text}
                          >
                            <BoldHighlights text={clipped} highlights={safeHighlights} />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Work_experience;
export type { Bullet };
