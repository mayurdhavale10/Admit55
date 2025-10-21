import { getDb } from "../../modules/data-client/mongo";
import dbnames from "../../config/dbnames.json";
import type { ProfileResume } from "../schemas/profileresumetool/types";
import { ProfileResumeZ } from "../schemas/profileresumetool/types";

const DB = (dbnames as Record<string, string>).profileresumetool;

export async function upsertProfile(userId: string, data: unknown) {
  const base: Record<string, unknown> = (data && typeof data === "object") ? (data as Record<string, unknown>) : {};
  const parsed = ProfileResumeZ.parse({ ...base, userId, updatedAt: new Date() });

  const db = await getDb(DB);
  await db.collection<ProfileResume>("profiles").updateOne(
    { userId },
    { $set: parsed },
    { upsert: true }
  );
  return parsed;
}

export async function getProfile(userId: string) {
  const db = await getDb(DB);
  return db.collection<ProfileResume>("profiles").findOne({ userId });
}
