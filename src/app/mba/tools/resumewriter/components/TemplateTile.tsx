// src/app/mba/tools/resumewriter/components/TemplateTile.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";

export type TemplateTileProps = {
  label: string;
  description: string;
  selected: boolean;
  badge?: string;
  onClick: () => void;
  children: React.ReactNode;
};

const TemplateTile: React.FC<TemplateTileProps> = ({
  label,
  description,
  selected,
  badge,
  onClick,
  children,
}) => {
  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`
        group flex h-full w-full cursor-pointer flex-col rounded-3xl border bg-white/95 text-left
        shadow-[0_22px_70px_rgba(15,23,42,0.20)] transition-all outline-none
        ${
          selected
            ? "border-teal-500 shadow-[0_26px_90px_rgba(15,118,110,0.35)] dark:border-teal-400 dark:bg-slate-900/95"
            : "border-slate-200 hover:border-teal-300 hover:shadow-[0_26px_80px_rgba(15,23,42,0.28)] dark:border-slate-700 dark:bg-slate-900/90 dark:hover:border-teal-300"
        }
        focus-visible:ring-2 focus-visible:ring-teal-400/40
      `}
    >
      <div className="relative w-full rounded-t-3xl bg-slate-50 dark:bg-slate-950 p-4">
        {children}

        {badge && (
          <span className="absolute right-5 top-5 z-10 rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(45,212,191,0.7)]">
            {badge}
          </span>
        )}
      </div>

      <div className="border-t border-slate-100 px-8 py-5 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal-700 dark:text-teal-300">
          Resume template
        </p>
        <p className="mt-1 text-base font-semibold text-[#002b5b] dark:text-teal-100">
          {label}
        </p>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export default TemplateTile;
