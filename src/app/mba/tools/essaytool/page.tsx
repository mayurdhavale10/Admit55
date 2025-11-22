"use client";

import { useState } from "react";

interface AnalyzeResult {
  message: string;
  input: {
    prompt: string;
    persona: string;
    school: string;
  };
}

export default function EssayToolPage() {
  const [prompt, setPrompt] = useState<string>("");
  const [persona, setPersona] = useState<string>("fulltime");
  const [school, setSchool] = useState<string>("Generic MBA");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // placeholder until you wire /api/essaytool/analyze or /draft
  async function onAnalyze(): Promise<void> {
    setLoading(true);
    const fakeResult: AnalyzeResult = {
      message: "API not wired yet. This is a placeholder.",
      input: { prompt, persona, school },
    };
    setResult(fakeResult);
    setTimeout(() => setLoading(false), 300);
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Essay Tool</h1>

      <section className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 sm:col-span-1">
          <span className="text-sm text-gray-600">Persona</span>
          <select
            className="border rounded px-3 py-2"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
          >
            <option value="fulltime">Full-Time</option>
            <option value="executive">Executive</option>
            <option value="deferred">Deferred</option>
            <option value="switcher">Career Switcher</option>
            <option value="international">International</option>
            <option value="reapplicant">Reapplicant</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm text-gray-600">Target School</span>
          <input
            className="border rounded px-3 py-2"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="e.g., Wharton / ISB / INSEAD"
          />
        </label>
      </section>

      <label className="flex flex-col gap-2">
        <span className="text-sm text-gray-600">Prompt / Draft</span>
        <textarea
          className="border rounded px-3 py-2 min-h-[160px]"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Paste the essay prompt or your draft here..."
        />
      </label>

      <div className="flex gap-3">
        <button
          onClick={onAnalyze}
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Draft"}
        </button>
      </div>

      {result && (
        <pre className="text-sm bg-gray-50 border rounded p-4 overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
