import { getDb } from "../../modules/data-client/mongo";
import dbnames from "../../config/dbnames.json";

const DB = (dbnames as Record<string, string>).profileresumetool;

// minimal shape of what we save per snapshot run
export interface SnapshotStoredResult {
  band: string;
  meta: {
    yoe?: string;
    functionArea?: string;
    testLabel?: string;
  };
  radar: Record<string, number>;
  strengths: string[];
  gaps: string[];
  next6Weeks: string[];
  next90Days: string[];
  essayAngles: string[];
  createdAt: Date;
  email: string | null;
}

export async function saveSnapshotResult(
  data: Omit<SnapshotStoredResult, "createdAt" | "email">,
  email?: string
): Promise<{ ok: true; sessionId: string }> {
  const db = await getDb(DB);
  const createdAt = new Date();

  // generate a simple session id (no crypto import to avoid node:crypto edge issues)
  const sessionId = `snap_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

  await db.collection<SnapshotStoredResult & { sessionId: string }>("snapshot_results").insertOne({
    sessionId,
    band: data.band,
    meta: data.meta,
    radar: data.radar,
    strengths: data.strengths,
    gaps: data.gaps,
    next6Weeks: data.next6Weeks,
    next90Days: data.next90Days,
    essayAngles: data.essayAngles,
    createdAt,
    email: email ?? null,
  });

  return { ok: true as const, sessionId };
}

// track usage per email so we can enforce free limit later
export async function incrementSnapshotRuns(
  email: string
): Promise<{ runsUsed: number }> {
  const db = await getDb(DB);
  const now = new Date();

  // upsert without conflicting on runsUsed
  await db.collection("snapshot_users").updateOne(
    { email },
    {
      $setOnInsert: {
        email,
        createdAt: now,
      },
      $inc: {
        runsUsed: 1,
      },
    },
    { upsert: true }
  );

  const doc = await db.collection<{ email: string; runsUsed: number }>("snapshot_users").findOne({ email });
  const runsUsed = doc?.runsUsed ?? 1;
  return { runsUsed };
}
