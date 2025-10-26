"use client";

import { useState } from "react";

export default function ProfileResumeToolPage() {
  const [userId, setUserId] = useState("test-user-1");
  const [persona, setPersona] = useState<"fulltime"|"executive"|"deferred"|"switcher"|"international"|"reapplicant">("fulltime");
  const [track, setTrack] = useState("product_management");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<null | "analyze" | "evaluate">(null);
  const [error, setError] = useState<string | null>(null);

  async function callApi(kind: "analyze" | "evaluate") {
    setLoading(kind);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/profileresumetool/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "analyze"
            ? { userId, track }
            : { userId, persona, track }
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setResult(json);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Profile &amp; Resume Tool</h1>

      <section className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">User ID</span>
          <input
            className="border rounded px-3 py-2"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="user-123"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Persona</span>
          <select
            className="border rounded px-3 py-2"
            value={persona}
            onChange={(e) => setPersona(e.target.value as any)}
          >
            <option value="fulltime">Full-Time</option>
            <option value="executive">Executive</option>
            <option value="deferred">Deferred</option>
            <option value="switcher">Career Switcher</option>
            <option value="international">International</option>
            <option value="reapplicant">Reapplicant</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Track</span>
          <select
            className="border rounded px-3 py-2"
            value={track}
            onChange={(e) => setTrack(e.target.value)}
          >
            <option value="product_management">Product Management</option>
            <option value="operations">Operations</option>
            <option value="consulting">Consulting</option>
            <option value="finance">Finance</option>
            <option value="data_analytics">Data / Analytics</option>
            <option value="marketing">Marketing / Growth</option>
          </select>
        </label>
      </section>

      <div className="flex gap-3">
        <button
          onClick={() => callApi("analyze")}
          disabled={loading !== null}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading === "analyze" ? "Analyzing..." : "Analyze"}
        </button>
        <button
          onClick={() => callApi("evaluate")}
          disabled={loading !== null}
          className="px-4 py-2 rounded border disabled:opacity-50"
        >
          {loading === "evaluate" ? "Evaluating..." : "Evaluate"}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded p-3">
          {error}
        </div>
      )}

      {result && (
        <pre className="text-sm bg-gray-50 border rounded p-4 overflow-auto">
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
