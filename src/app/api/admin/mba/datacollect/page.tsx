"use client";
import { useState } from "react";

async function post(url: string, body?: any) {
  const res = await fetch(url, { method: "POST", headers: {"Content-Type":"application/json"}, body: body?JSON.stringify(body):undefined });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function DataCollectPage() {
  const [log, setLog] = useState<string[]>([]);
  const add = (s: string) => setLog((L) => [`${new Date().toLocaleTimeString()} ${s}`, ...L]);

  const runGithub = async () => {
    add("Starting GitHub collector...");
    await post("/api/data/collectors/github", { query: "resume developer", pages: 2 });
    add("Collector enqueued.");
  };

  const promoteGithub = async () => {
    add("Promoting inbox→processed...");
    await post("/api/admin/mba/profileresumetool/jobs", { action: "promote", source: "github" });
    add("Promote done.");
  };

  const buildDataset = async () => {
    add("Building dataset...");
    await post("/api/admin/mba/profileresumetool/jobs", { action: "build_dataset" });
    add("Dataset built.");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Data Collect Dashboard</h1>
      <div className="flex gap-3">
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={runGithub}>Run GitHub</button>
        <button className="px-3 py-2 rounded bg-amber-600 text-white" onClick={promoteGithub}>Promote Inbox→Processed</button>
        <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={buildDataset}>Build Dataset</button>
      </div>
      <div className="mt-6">
        <h2 className="font-medium">Logs</h2>
        <pre className="text-sm bg-gray-100 p-3 rounded">{log.join("\n")}</pre>
      </div>
    </div>
  );
}
