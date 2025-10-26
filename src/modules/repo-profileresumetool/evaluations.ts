import { getDb } from "../data-client/mongo";
import dbnames from "../../config/dbnames.json";
import type { EvaluationOutput } from "../schemas/profileresumetool/evaluation";

const DB = (dbnames as Record<string, string>).profileresumetool;

export type DbEvaluation = EvaluationOutput & {
  userId: string;
  createdAt: Date;
};

export async function saveEvaluation(e: DbEvaluation) {
  const db = await getDb(DB);
  await db.collection<DbEvaluation>("evaluations").insertOne(e);
  return { ok: true as const };
}

export async function listEvaluations(userId: string, limit = 10) {
  const db = await getDb(DB);
  return db
    .collection<DbEvaluation>("evaluations")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
