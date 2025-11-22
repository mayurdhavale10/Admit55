// src/modules/repo-profileresumetool/telemetry.ts
import { getDb } from "../data-client/mongo";
import dbnames from "../../config/dbnames.json";

const DB = (dbnames as Record<string, string>).profileresumetool;

export async function saveSnapshotTelemetry(e: {
  email?: string;
  method: "llm" | "heuristic" | "mixed";
  model?: string;
  latencyMs?: number;
  confidence?: number;
  docHash?: string;
  createdAt?: Date;
}) {
  const db = await getDb(DB);
  await db.collection("snapshot_telemetry").insertOne({
    ...e,
    createdAt: e.createdAt ?? new Date(),
  });
  return { ok: true as const };
}
