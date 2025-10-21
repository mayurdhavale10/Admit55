import { getDb } from "../../modules/data-client/mongo";
import dbnames from "../../config/dbnames.json";
import type { Evaluation } from "../schemas/profileresumetool/types";

const DB = (dbnames as Record<string, string>).profileresumetool;

export async function saveEvaluation(e: Evaluation) {
  const db = await getDb(DB);
  await db.collection<Evaluation>("evaluations").insertOne(e);
  return { ok: true as const };
}
