// src/app/BSchools/IIMADubai/components/ideal.tsx
"use client";

import React from "react";

type IdealItem = {
  title: string;
  rest: string;
  tone: "mint" | "blue" | "purple" | "amber";
};

type FormatItem = {
  title: string;
  subtitle: string;
  tone: "red" | "teal" | "blue" | "purple" | "green";
  icon: "clock" | "pin" | "doc" | "users" | "fees";
};

const IDEAL_ITEMS: IdealItem[] = [
  {
    title: "Professionals with 3–15 years of experience",
    rest: "ready for senior leadership roles",
    tone: "mint",
  },
  {
    title: "Consultants, product leaders, and functional heads",
    rest: "preparing for general management roles",
    tone: "blue",
  },
  {
    title: "Professionals targeting leadership roles",
    rest: "in the Middle East, Asia, or global markets",
    tone: "purple",
  },
  {
    title: "Candidates looking for an accelerated MBA",
    rest: "without a long career break",
    tone: "amber",
  },
];

const FORMAT_ITEMS: FormatItem[] = [
  {
    title: "Duration: 12 months",
    subtitle: "Intensive, full-time programme",
    tone: "red",
    icon: "clock",
  },
  {
    title: "Campus: Dubai",
    subtitle: "Dubai International Academic City",
    tone: "teal",
    icon: "pin",
  },
  {
    title: "Pedagogy",
    subtitle: "Case-based learning, group work, leadership labs",
    tone: "blue",
    icon: "doc",
  },
  {
    title: "Faculty",
    subtitle: "IIM Ahmedabad professors and visiting global faculty",
    tone: "purple",
    icon: "users",
  },
  {
    title: "Fees",
    subtitle: "Approximately USD 80,000 (~INR 70 Lakhs)",
    tone: "green",
    icon: "fees",
  },
];

function idealToneStyles(tone: IdealItem["tone"]) {
  switch (tone) {
    case "mint":
      return {
        box: "bg-emerald-50/70 border-emerald-200/70",
        iconWrap: "bg-emerald-100 text-emerald-700",
        icon: "text-emerald-700",
      };
    case "blue":
      return {
        box: "bg-blue-50/70 border-blue-200/70",
        iconWrap: "bg-blue-100 text-blue-700",
        icon: "text-blue-700",
      };
    case "purple":
      return {
        box: "bg-purple-50/70 border-purple-200/70",
        iconWrap: "bg-purple-100 text-purple-700",
        icon: "text-purple-700",
      };
    case "amber":
    default:
      return {
        box: "bg-amber-50/70 border-amber-200/70",
        iconWrap: "bg-amber-100 text-amber-700",
        icon: "text-amber-700",
      };
  }
}

function formatToneStyles(tone: FormatItem["tone"]) {
  switch (tone) {
    case "red":
      return { wrap: "bg-rose-100 text-rose-700", icon: "text-rose-700" };
    case "teal":
      return { wrap: "bg-teal-100 text-teal-700", icon: "text-teal-700" };
    case "blue":
      return { wrap: "bg-blue-100 text-blue-700", icon: "text-blue-700" };
    case "purple":
      return { wrap: "bg-purple-100 text-purple-700", icon: "text-purple-700" };
    case "green":
    default:
      return { wrap: "bg-emerald-100 text-emerald-700", icon: "text-emerald-700" };
  }
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" className={className} aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Icon({ name, className }: { name: FormatItem["icon"]; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "clock":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" className={className} aria-hidden="true" {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
        </svg>
      );
    case "pin":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" className={className} aria-hidden="true" {...common}>
          <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      );
    case "doc":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" className={className} aria-hidden="true" {...common}>
          <path d="M7 3h7l3 3v15a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
          <path d="M14 3v4h4" />
          <path d="M8 12h8" />
          <path d="M8 16h8" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" className={className} aria-hidden="true" {...common}>
          <path d="M16 11a4 4 0 10-8 0" />
          <path d="M5 21a7 7 0 0114 0" />
          <path d="M20 21a5.5 5.5 0 00-4.2-5.3" />
        </svg>
      );
    case "fees":
    default:
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" className={className} aria-hidden="true" {...common}>
          <path d="M7 10a5 5 0 0110 0v4a5 5 0 01-10 0v-4z" />
          <path d="M9 21h6" />
          <path d="M10 8V6a2 2 0 114 0v2" />
        </svg>
      );
  }
}

export default function Ideal() {
  return (
    <section className="w-full py-16 bg-[#f6fbfb]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
          {/* LEFT — Ideal For */}
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-[#0B1B33]">
              Who Is This Programme Ideal For?
            </h2>

            <div className="mt-8 space-y-5">
              {IDEAL_ITEMS.map((it, idx) => {
                const s = idealToneStyles(it.tone);
                return (
                  <div
                    key={idx}
                    className={[
                      "flex items-start gap-4 rounded-2xl border p-6",
                      "shadow-[0_10px_25px_rgba(0,0,0,0.06)]",
                      s.box,
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "mt-[2px] flex h-10 w-10 items-center justify-center rounded-xl",
                        s.iconWrap,
                      ].join(" ")}
                    >
                      <CheckIcon className={s.icon} />
                    </div>

                    <p className="text-[16.5px] leading-relaxed text-[#0B1B33]">
                      <span className="font-extrabold">{it.title}</span>{" "}
                      <span className="text-black/70">{it.rest}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Programme Format */}
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-[#0B1B33]">
              Programme Format
            </h2>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
              <div className="divide-y divide-slate-200/70">
                {FORMAT_ITEMS.map((it, idx) => {
                  const s = formatToneStyles(it.tone);
                  return (
                    <div key={idx} className="flex gap-4 px-6 py-5">
                      <div className={["flex h-11 w-11 items-center justify-center rounded-xl", s.wrap].join(" ")}>
                        <Icon name={it.icon} className={s.icon} />
                      </div>

                      <div className="min-w-0">
                        <div className="text-[18px] font-extrabold text-[#0B1B33]">{it.title}</div>
                        <div className="mt-1 text-[15.5px] text-slate-600">{it.subtitle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
