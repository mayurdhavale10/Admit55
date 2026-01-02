// src/lib/db/usage/quota.ts
import { MongoClient, type Collection, type Db, type Document } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName =
  process.env.MONGODB_DB ||
  process.env.MONGODB_DB_NAME ||
  process.env.MONGODB_DATABASE;

if (!uri) throw new Error("[usage/quota] Missing MONGODB_URI");

declare global {
  // eslint-disable-next-line no-var
  var __usageMongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var __providerQuotaIndexesEnsured: boolean | undefined;
}

if (!global.__usageMongoClientPromise) {
  const client = new MongoClient(uri);
  global.__usageMongoClientPromise = client.connect();
}

export async function getUsageDb(): Promise<Db> {
  const client = await global.__usageMongoClientPromise!;
  return dbName ? client.db(dbName) : client.db();
}

export async function getProviderQuotaCollection<T extends Document = Document>(): Promise<
  Collection<T>
> {
  const db = await getUsageDb();
  const col = db.collection<T>("provider_quota");

  // Ensure indexes once
  if (!global.__providerQuotaIndexesEnsured) {
    await col.createIndex({ email: 1, provider: 1 }, { unique: true });
    await col.createIndex({ updatedAt: -1 });
    global.__providerQuotaIndexesEnsured = true;
  }

  return col;
}
