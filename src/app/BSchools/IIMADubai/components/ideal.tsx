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
      return "bg-emerald-50 border-emerald-200";
    case "blue":
      return "bg-blue-50 border-blue-200";
    case "purple":
      return "bg-purple-50 border-purple-200";
    case "amber":
    default:
      return "bg-amber-50 border-amber-200";
  }
}

function formatToneStyles(tone: FormatItem["tone"]) {
  switch (tone) {
    case "red":
      return "bg-rose-100 text-rose-700";
    case "teal":
      return "bg-teal-100 text-teal-700";
    case "blue":
      return "bg-blue-100 text-blue-700";
    case "purple":
      return "bg-purple-100 text-purple-700";
    case "green":
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

export default function Ideal() {
  return (
    <section className="w-full bg-[#f6fbfb] py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

          {/* LEFT — IDEAL FOR */}
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0B1B33]">
              Who Is This Programme Ideal For?
            </h2>

            <div className="mt-8 space-y-5">
              {IDEAL_ITEMS.map((it, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-4 rounded-2xl border p-5 shadow-sm ${idealToneStyles(it.tone)}`}
                >
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-700 font-semibold">
                    ✓
                  </div>

                  <p className="text-base leading-relaxed text-[#0B1B33]">
                    <span className="font-semibold">{it.title}</span>{" "}
                    <span className="text-[#0B1B33]/70">{it.rest}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — PROGRAMME FORMAT */}
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0B1B33]">
              Programme Format
            </h2>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm divide-y">
              {FORMAT_ITEMS.map((it, idx) => (
                <div key={idx} className="flex gap-4 px-5 py-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${formatToneStyles(it.tone)}`}
                  >
                    ●
                  </div>

                  <div>
                    <div className="text-base font-semibold text-[#0B1B33]">
                      {it.title}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {it.subtitle}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
