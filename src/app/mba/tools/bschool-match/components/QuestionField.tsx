"use client";

import { ChangeEvent } from "react";
import { BschoolQuestion } from "@src/lib/bschoolmatch/types";

interface QuestionFieldProps {
  question: BschoolQuestion;
  value: unknown;
  onChange: (id: string, value: unknown) => void;
  disabled?: boolean;
}

export default function QuestionField({
  question,
  value,
  onChange,
  disabled,
}: QuestionFieldProps) {
  const handleTextChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => onChange(question.id, e.target.value);

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(question.id, v === "" ? "" : Number(v));
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(question.id, e.target.value);
  };

  const handleMultiSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    onChange(question.id, selected);
  };

  const helper = question.helperText ? (
    <p className="mt-1 text-[11px] text-slate-500">{question.helperText}</p>
  ) : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-900">{question.label}</p>
        {question.required && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
            Required
          </span>
        )}
      </div>

      {helper}

      <div className="mt-2">
        {question.type === "textarea" && (
          <textarea
            rows={3}
            value={(value as string) ?? ""}
            onChange={handleTextChange}
            placeholder={question.placeholder}
            disabled={disabled}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/70 disabled:opacity-50"
          />
        )}

        {question.type === "text" && (
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={handleTextChange}
            placeholder={question.placeholder}
            disabled={disabled}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/70 disabled:opacity-50"
          />
        )}

        {question.type === "number" && (
          <input
            type="number"
            value={
              typeof value === "number" || typeof value === "string" ? value : ""
            }
            onChange={handleNumberChange}
            min={question.min}
            max={question.max}
            placeholder={question.placeholder}
            disabled={disabled}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/70 disabled:opacity-50"
          />
        )}

        {question.type === "slider" && (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={question.min}
              max={question.max}
              step={question.step ?? 1}
              value={typeof value === "number" ? value : question.min ?? 0}
              onChange={handleNumberChange}
              disabled={disabled}
              className="flex-1 accent-emerald-500 disabled:opacity-50"
            />
            <span className="w-10 text-right text-xs text-emerald-700">
              {typeof value === "number" ? value : question.min ?? 0}
            </span>
          </div>
        )}

        {question.type === "single-select" && (
          <select
            value={(value as string) ?? ""}
            onChange={handleSelectChange}
            disabled={disabled}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/70 disabled:opacity-50"
          >
            <option value="">Select an option</option>
            {question.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {question.type === "multi-select" && (
          <select
            multiple
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={handleMultiSelectChange}
            disabled={disabled}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/70 disabled:opacity-50"
            size={Math.min(question.options?.length ?? 6, 6)}
          >
            {question.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
